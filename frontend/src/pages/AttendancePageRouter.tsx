import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import AttendancePage from './AttendancePage';
import TeamAttendancePage from './TeamAttendancePage';
import AdminAttendanceView from '../components/attendance/AdminAttendanceView';

export default function AttendancePageRouter() {
    const { hasRole } = useAuth();
    
    // Check if user is an admin/HR manager - show company-wide attendance
    const isAdminUser = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);
    if (isAdminUser) {
        return <AdminAttendanceView />;
    }
    
    // Check if user is a manager - show team attendance
    const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
    if (isManager) {
        return <TeamAttendancePage />;
    }
    
    // For regular employees, show personal attendance
    return <AttendancePage />;
}

