import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import MyLeavePage from './MyLeavePage';
import TeamLeavePage from './TeamLeavePage';
import AdminLeaveManagementPage from './AdminLeaveManagementPage';

export default function LeavePageRouter() {
    const { hasRole } = useAuth();
    
    // Check if user is an admin/HR manager - show comprehensive leave management (company-wide)
    const isAdminUser = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);
    if (isAdminUser) {
        return <AdminLeaveManagementPage />;
    }
    
    // Check if user is a manager - show team leave
    const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
    if (isManager) {
        return <TeamLeavePage />;
    }
    
    // For regular employees, show personal leave
    return <MyLeavePage />;
}

