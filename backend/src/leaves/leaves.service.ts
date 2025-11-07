import { Injectable, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { differenceInDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns'; // Import date-fns helpers
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveRequest, ApprovalStatus, ApprovalStep, LeaveStatus } from './entities/leave-request.entity';
import { Employee } from '../employees/entities/employee.entity';
import { RoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class LeavesService {
    constructor(
        @InjectRepository(LeaveRequest) private leaveRequestRepo: Repository<LeaveRequest>,
        @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
        @InjectRepository(User) private userRepo: Repository<User>,
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => WebSocketGateway))
        private readonly websocketGateway: WebSocketGateway,
    ) {}

    /**
     * Calculate business days (excluding weekends) between two dates
     */
    private calculateBusinessDays(startDate: Date, endDate: Date): number {
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const businessDays = allDays.filter(day => !isWeekend(day));
        return businessDays.length;
    }

    async create(createDto: CreateLeaveRequestDto, requester: Employee): Promise<LeaveRequest> {
        // Calculate leave duration (excluding weekends)
        const startDate = new Date(createDto.start_date);
        const endDate = new Date(createDto.end_date);
        const businessDays = this.calculateBusinessDays(startDate, endDate);

        // Validate that there are business days
        if (businessDays === 0) {
            throw new Error('Leave request must include at least one business day (weekends are not counted).');
        }

        // Check if employee has sufficient balance
        if (requester.leave_balance < businessDays) {
            throw new Error(`Insufficient leave balance. You have ${requester.leave_balance} days, but requested ${businessDays} business days.`);
        }

        // Deduct leave balance immediately upon submission (business days only)
        requester.leave_balance -= businessDays;
        await this.employeeRepo.save(requester);

        const approvalChain = await this.buildHierarchicalApprovalChain(requester);

        // Get requester's user account for notifications
        const requesterUser = await this.userRepo.findOne({
            where: { employee: { id: requester.id } },
            relations: ['employee'],
        });

        if (approvalChain.length === 0) {
            // Auto-approve for top-level employees (balance already deducted above)
            const newRequest = this.leaveRequestRepo.create({ ...createDto, employee: requester, status: LeaveStatus.APPROVED });
            const savedRequest = await this.leaveRequestRepo.save(newRequest);

            // Notify the requester that their leave was auto-approved
            if (requesterUser) {
                const employeeName = `${requester.first_name} ${requester.last_name}`;
                await this.notificationsService.createLeaveNotification(
                    requesterUser.id,
                    NotificationType.LEAVE_SUBMITTED,
                    employeeName,
                    savedRequest.id,
                    businessDays,
                );
                await this.notificationsService.createLeaveNotification(
                    requesterUser.id,
                    NotificationType.LEAVE_APPROVED,
                    employeeName,
                    savedRequest.id,
                    businessDays,
                );
            }

            return savedRequest;
        }

        const newRequest = this.leaveRequestRepo.create({
            ...createDto,
            employee: requester,
            approval_chain: approvalChain,
            status: LeaveStatus.PENDING,
        });

        const savedRequest = await this.leaveRequestRepo.save(newRequest);

        // Notify the requester that their leave request was submitted
        if (requesterUser) {
            const employeeName = `${requester.first_name} ${requester.last_name}`;
            await this.notificationsService.createLeaveNotification(
                requesterUser.id,
                NotificationType.LEAVE_SUBMITTED,
                employeeName,
                savedRequest.id,
                businessDays,
            );
        }

        // Notify the first approver in the chain
        if (approvalChain.length > 0) {
            const firstApproverId = approvalChain[0].approverId;
            const firstApprover = await this.employeeRepo.findOne({
                where: { id: firstApproverId },
                relations: ['user'],
            });

            if (firstApprover?.user) {
                const employeeName = `${requester.first_name} ${requester.last_name}`;
                await this.notificationsService.createLeaveNotification(
                    firstApprover.user.id,
                    NotificationType.LEAVE_REQUEST,
                    employeeName,
                    savedRequest.id,
                    businessDays,
                );
            }
        }

        // Emit Socket.IO event for real-time update
        this.websocketGateway.emitLeaveUpdate({
          type: 'created',
          leaveRequest: savedRequest,
          employeeId: requester.id,
          employeeName: `${requester.first_name} ${requester.last_name}`,
        }, requesterUser?.id);

        return savedRequest;
    }
  
    // STEP 2: Logic for a manager to approve or reject a request
    async takeAction(leaveRequestId: string, action: ApprovalStatus, manager: Employee, comments?: string) {
        // Load leave request with employee and user relationships to ensure we can send notifications
        const leaveRequest = await this.leaveRequestRepo.findOne({
            where: {id: leaveRequestId}, 
            relations: ['employee']
        });
        if (!leaveRequest) throw new NotFoundException('Leave Request not found');
        
        // Ensure we have the employee's user account loaded for notifications
        const requesterEmployee = await this.employeeRepo.findOne({
            where: { id: leaveRequest.employee.id },
            relations: ['user'],
        });
        
        // Find the current step that is pending for this manager
        const currentStepIndex = leaveRequest.approval_chain.findIndex(
            step => step.approverId === manager.id && step.status === ApprovalStatus.PENDING
        );

        if (currentStepIndex === -1) {
            throw new UnauthorizedException('You are not the current approver for this request.');
        }
        
        // Update the current step in the approval chain
        leaveRequest.approval_chain[currentStepIndex].status = action;
        leaveRequest.approval_chain[currentStepIndex].actionedAt = new Date();
        if(comments) leaveRequest.approval_chain[currentStepIndex].comments = comments;

        if (action === ApprovalStatus.REJECTED) {
            leaveRequest.status = LeaveStatus.REJECTED;
            leaveRequest.actioned_at = new Date();
            
            // Restore the leave balance since the request was rejected (business days only)
            const startDate = new Date(leaveRequest.start_date);
            const endDate = new Date(leaveRequest.end_date);
            const businessDays = this.calculateBusinessDays(startDate, endDate);
            
            leaveRequest.employee.leave_balance += businessDays;
            await this.employeeRepo.save(leaveRequest.employee);

            // Notify the employee about rejection
            if (requesterEmployee?.user) {
                try {
                    const employeeName = `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`;
                    await this.notificationsService.createLeaveNotification(
                        requesterEmployee.user.id,
                        NotificationType.LEAVE_REJECTED,
                        employeeName,
                        leaveRequest.id,
                        businessDays,
                    );
                } catch (error) {
                    console.error(`Failed to send rejection notification to employee ${leaveRequest.employee.id}:`, error);
                    // Don't throw - we still want to complete the rejection even if notification fails
                }
            } else {
                console.warn(`Employee ${leaveRequest.employee.id} (${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}) does not have a user account. Cannot send rejection notification.`);
            }
            
            // Emit Socket.IO event for real-time update
            const savedLeaveRequest = await this.leaveRequestRepo.save(leaveRequest);
            this.websocketGateway.emitLeaveUpdate({
              type: 'rejected',
              leaveRequest: savedLeaveRequest,
              employeeId: leaveRequest.employee.id,
              employeeName: `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`,
            }, requesterEmployee?.user?.id);
        } 
        else if (action === ApprovalStatus.APPROVED) {
            const nextStepIndex = currentStepIndex + 1;
            if (nextStepIndex < leaveRequest.approval_chain.length) {
                // Move to the next approver (balance already deducted on submission)
                leaveRequest.approval_chain[nextStepIndex].status = ApprovalStatus.PENDING;
                
                // Notify the next approver
                const nextApproverId = leaveRequest.approval_chain[nextStepIndex].approverId;
                const nextApprover = await this.employeeRepo.findOne({
                    where: { id: nextApproverId },
                    relations: ['user'],
                });
                if (nextApprover?.user) {
                    const employeeName = `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`;
                    const startDate = new Date(leaveRequest.start_date);
                    const endDate = new Date(leaveRequest.end_date);
                    const businessDays = this.calculateBusinessDays(startDate, endDate);
                    await this.notificationsService.createLeaveNotification(
                        nextApprover.user.id,
                        NotificationType.LEAVE_REQUEST,
                        employeeName,
                        leaveRequest.id,
                        businessDays,
                    );
                }
                
                // Emit Socket.IO event for intermediate approval
                const savedLeaveRequest = await this.leaveRequestRepo.save(leaveRequest);
                this.websocketGateway.emitLeaveUpdate({
                  type: 'updated',
                  leaveRequest: savedLeaveRequest,
                  employeeId: leaveRequest.employee.id,
                  employeeName: `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`,
                });
            } else {
                // This was the FINAL approval.
                // Balance was already deducted when the request was submitted, so just mark as approved
                leaveRequest.status = LeaveStatus.APPROVED;
                leaveRequest.actioned_at = new Date();

                // Notify the employee about final approval
                if (requesterEmployee?.user) {
                    try {
                        const employeeName = `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`;
                        const startDate = new Date(leaveRequest.start_date);
                        const endDate = new Date(leaveRequest.end_date);
                        const businessDays = this.calculateBusinessDays(startDate, endDate);
                        await this.notificationsService.createLeaveNotification(
                            requesterEmployee.user.id,
                            NotificationType.LEAVE_APPROVED,
                            employeeName,
                            leaveRequest.id,
                            businessDays,
                        );
                    } catch (error) {
                        console.error(`Failed to send approval notification to employee ${leaveRequest.employee.id}:`, error);
                        // Don't throw - we still want to complete the approval even if notification fails
                    }
                } else {
                    console.warn(`Employee ${leaveRequest.employee.id} (${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}) does not have a user account. Cannot send approval notification.`);
                }
                
                // Emit Socket.IO event for real-time update
                const savedLeaveRequest = await this.leaveRequestRepo.save(leaveRequest);
                this.websocketGateway.emitLeaveUpdate({
                  type: 'approved',
                  leaveRequest: savedLeaveRequest,
                  employeeId: leaveRequest.employee.id,
                  employeeName: `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`,
                }, requesterEmployee?.user?.id);
            }
        }
        
        return await this.leaveRequestRepo.save(leaveRequest);
    }

    findForEmployee(employeeId: string): Promise<LeaveRequest[]> {
        return this.leaveRequestRepo.find({
            where: { employee: { id: employeeId } },
            order: { created_at: 'DESC' }
        });
    }

    async findAllForEmployee(employeeId: string): Promise<LeaveRequest[]> {
        const employee = await this.employeeRepo.findOneBy({ id: employeeId });
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found.`);
        }
        return this.leaveRequestRepo.find({
            where: { employee: { id: employeeId } },
            order: { start_date: 'DESC' } // Order by most recent start date
        });
    }

    // This version is simpler and more readable than the complex JSON query
    async findPendingForManager(managerId: string): Promise<LeaveRequest[]> {
        return this.leaveRequestRepo
            .createQueryBuilder('request')
            .innerJoinAndSelect('request.employee', 'employee')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.branch', 'branch')
            .where('request.status = :status', { status: LeaveStatus.PENDING })
            .andWhere(`EXISTS (
                SELECT 1 FROM jsonb_array_elements(request.approval_chain) AS step 
                WHERE step->>'approverId' = :managerId AND step->>'status' = 'pending'
            )`)
            .setParameter('managerId', managerId)
            .orderBy('request.created_at', 'DESC')
            .getMany();
    }

    // Get ALL leave requests (not just pending) for a manager's team
    async findTeamHistory(manager: Employee): Promise<LeaveRequest[]> {
        // First, get the user to check their roles
        const user = await this.userRepo.findOne({
            where: { employee: { id: manager.id } },
            relations: ['roles', 'employee', 'employee.branch', 'employee.department']
        });

        if (!user) {
            return [];
        }

        const managerRoles = user.roles.map(r => r.name);

        // System Admins and HR Managers can see ALL leave requests
        if (managerRoles.includes(RoleName.SYSTEM_ADMIN) || managerRoles.includes(RoleName.HR_MANAGER)) {
            return this.leaveRequestRepo.find({
                relations: ['employee', 'employee.department', 'employee.branch'],
                order: { created_at: 'DESC' }
            });
        }

        // Branch Managers see all requests from their branch
        if (managerRoles.includes(RoleName.BRANCH_MANAGER) && manager.branch?.id) {
            return this.leaveRequestRepo
                .createQueryBuilder('request')
                .innerJoinAndSelect('request.employee', 'employee')
                .leftJoinAndSelect('employee.department', 'department')
                .leftJoinAndSelect('employee.branch', 'branch')
                .where('employee.branch_id = :branchId', { branchId: manager.branch.id })
                .orderBy('request.created_at', 'DESC')
                .getMany();
        }

        // Department Heads see all requests from their department
        if (managerRoles.includes(RoleName.DEPARTMENT_HEAD) && manager.department?.id) {
            return this.leaveRequestRepo
                .createQueryBuilder('request')
                .innerJoinAndSelect('request.employee', 'employee')
                .leftJoinAndSelect('employee.department', 'department')
                .leftJoinAndSelect('employee.branch', 'branch')
                .where('employee.department_id = :departmentId', { departmentId: manager.department.id })
                .orderBy('request.created_at', 'DESC')
                .getMany();
        }

        // Default: Regular supervisors see requests from their direct reports
        return this.leaveRequestRepo
            .createQueryBuilder('request')
            .innerJoinAndSelect('request.employee', 'employee')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.branch', 'branch')
            .leftJoinAndSelect('employee.supervisor', 'supervisor')
            .where('supervisor.id = :supervisorId', { supervisorId: manager.id })
            .orderBy('request.created_at', 'DESC')
            .getMany();
    }
    
    // THE NEW COUNTING METHOD
    async countPendingForManager(managerId: string): Promise<number> {
        return this.leaveRequestRepo
            .createQueryBuilder('request')
            .where('request.status = :status', { status: LeaveStatus.PENDING })
            .andWhere(`EXISTS (
                SELECT 1 FROM jsonb_array_elements(request.approval_chain) AS step 
                WHERE step->>'approverId' = :managerId AND step->>'status' = 'pending'
            )`)
            .setParameter('managerId', managerId)
            .getCount();
    }

    // Get employees on leave for a specific date, filtered by manager's role
    async findEmployeesOnLeave(manager: Employee, date: string): Promise<LeaveRequest[]> {
        // First, get the user to check their roles
        const user = await this.userRepo.findOne({
            where: { employee: { id: manager.id } },
            relations: ['roles', 'employee', 'employee.branch', 'employee.department']
        });

        if (!user) {
            return [];
        }

        const managerRoles = user.roles.map(r => r.name);

        // Build base query for approved leave requests that include the specified date
        let queryBuilder = this.leaveRequestRepo
            .createQueryBuilder('request')
            .innerJoinAndSelect('request.employee', 'employee')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.branch', 'branch')
            .where('request.status = :status', { status: LeaveStatus.APPROVED })
            .andWhere('request.start_date <= :date', { date })
            .andWhere('request.end_date >= :date', { date });

        // System Admins and HR Managers see all employees on leave
        if (managerRoles.includes(RoleName.SYSTEM_ADMIN) || managerRoles.includes(RoleName.HR_MANAGER)) {
            return queryBuilder.orderBy('request.start_date', 'DESC').getMany();
        }

        // Branch Managers see employees from their branch
        if (managerRoles.includes(RoleName.BRANCH_MANAGER) && manager.branch?.id) {
            queryBuilder = queryBuilder.andWhere('employee.branch_id = :branchId', { branchId: manager.branch.id });
            return queryBuilder.orderBy('request.start_date', 'DESC').getMany();
        }

        // Department Heads see employees from their department
        if (managerRoles.includes(RoleName.DEPARTMENT_HEAD) && manager.department?.id) {
            queryBuilder = queryBuilder.andWhere('employee.department_id = :departmentId', { departmentId: manager.department.id });
            return queryBuilder.orderBy('request.start_date', 'DESC').getMany();
        }

        // Default: Regular supervisors see their direct reports
        queryBuilder = queryBuilder
            .leftJoin('employee.supervisor', 'supervisor')
            .andWhere('supervisor.id = :supervisorId', { supervisorId: manager.id });
        
        return queryBuilder.orderBy('request.start_date', 'DESC').getMany();
    }

    async findEmployeeFromUserId(userId: string): Promise<Employee> {
        const employee = await this.employeeRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user'] // Ensure user relation is loaded to confirm the link
        });
        if (!employee) {
            throw new NotFoundException(`Associated employee not found for the user ID: ${userId}`);
        }
        return employee;
    }

    async debugPendingForManager(managerId: string): Promise<any> {
        // Get all pending requests
        const allPendingRequests = await this.leaveRequestRepo.find({
            where: { status: LeaveStatus.PENDING },
            relations: ['employee'],
            order: { created_at: 'ASC' }
        });

        // Get manager info
        const manager = await this.employeeRepo.findOne({
            where: { id: managerId },
            relations: ['user', 'user.roles']
        });

        return {
            manager: {
                id: manager?.id,
                name: manager ? `${manager.first_name} ${manager.last_name}` : 'Not found',
                roles: manager?.user?.roles?.map(r => r.name) || []
            },
            totalPendingRequests: allPendingRequests.length,
            allPendingRequests: allPendingRequests.map(req => ({
                id: req.id,
                employee: `${req.employee.first_name} ${req.employee.last_name}`,
                approval_chain: req.approval_chain,
                currentStep: req.approval_chain?.find(step => step.status === ApprovalStatus.PENDING)
            })),
            managerRequests: allPendingRequests.filter(request => {
                if (!request.approval_chain || request.approval_chain.length === 0) {
                    return false;
                }
                const currentStep = request.approval_chain.find(step => step.status === ApprovalStatus.PENDING);
                return currentStep && currentStep.approverId === managerId;
            }).length
        };
    }

    // --- THIS IS THE NEW HIERARCHICAL LOGIC ---
    private async buildHierarchicalApprovalChain(requester: Employee): Promise<ApprovalStep[]> {
        const chain: ApprovalStep[] = [];
        const addedApproverIds = new Set<string>(); // Track added approvers to prevent duplicates
        let currentEmployee = requester;
        
        // Loop up to 5 levels deep to prevent infinite loops in case of circular reporting
        for (let i = 0; i < 5; i++) {
            const supervisor = await this.findSupervisor(currentEmployee.id);
            
            if (!supervisor) {
                // This employee has no supervisor; they are at the top.
                break;
            }

            // Prevent circular references: if supervisor is the requester or already in chain, stop
            if (supervisor.id === requester.id || addedApproverIds.has(supervisor.id)) {
                // If we've already seen this approver, we've hit a circular reference - stop
                break;
            }

            // Add supervisor to the approval chain
            chain.push({
                approverId: supervisor.id,
                approverName: `${supervisor.first_name} ${supervisor.last_name}`,
                status: ApprovalStatus.PENDING,
            });

            // Track this approver to prevent duplicates
            addedApproverIds.add(supervisor.id);
            
            // If the supervisor is an HR Manager or Admin, they are the final approver. Stop.
            const supervisorUser = await this.userRepo.findOne({where: {employee: {id: supervisor.id}}, relations: ['roles']});
            const supervisorRoles = supervisorUser?.roles.map(r => r.name) || [];

            if (supervisorRoles.includes(RoleName.HR_MANAGER) || supervisorRoles.includes(RoleName.SYSTEM_ADMIN)) {
                break;
            }

            currentEmployee = supervisor; // Move up the chain
        }
        
        // Mark the first step as PENDING (active), all others will be handled when previous steps are approved
        // The status assignment happens in takeAction method when approvals are processed
        
        return chain;
    }

    private async findSupervisor(employeeId: string): Promise<Employee | null> {
        const employee = await this.employeeRepo.findOne({
            where: { id: employeeId },
            relations: ['supervisor'],
        });
        return employee?.supervisor || null;
    }

    // Dashboard statistics for leaves
    async getStats(user: User): Promise<any> {
        const isPrivileged = user.roles?.some(
            (r) => r.name === RoleName.SYSTEM_ADMIN || r.name === RoleName.HR_MANAGER,
        );

        const baseWhere = isPrivileged
            ? {}
            : { employee: { supervisor: { id: user.employee?.id } } } as any;

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [pending, approvedThisMonth, rejectedThisMonth, upcoming] = await Promise.all([
            // Pending approvals (scoped)
            this.leaveRequestRepo.count({ where: { ...baseWhere, status: LeaveStatus.PENDING } }),
            // Approved this month
            this.leaveRequestRepo.count({
                where: { ...baseWhere, status: LeaveStatus.APPROVED, actioned_at: MoreThanOrEqual(startOfMonth) },
            }),
            // Rejected this month
            this.leaveRequestRepo.count({
                where: { ...baseWhere, status: LeaveStatus.REJECTED, actioned_at: MoreThanOrEqual(startOfMonth) },
            }),
            // Upcoming approved leaves starting today or later
            this.leaveRequestRepo.count({
                where: { ...baseWhere, status: LeaveStatus.APPROVED, start_date: MoreThanOrEqual(startOfToday) },
            }),
        ]);

        return { pending, approvedThisMonth, rejectedThisMonth, upcoming };
    }
}