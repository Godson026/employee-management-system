import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import AttendancePage from './AttendancePage';
import TeamAttendancePage from './TeamAttendancePage';

export default function AttendancePageRouter() {
    const { hasRole } = useAuth();
    
    // Check if user is a manager
    const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
    
    // Route to appropriate page based on role
    if (isManager) {
        return <TeamAttendancePage />;
    }
    
    return <AttendancePage />;
}

