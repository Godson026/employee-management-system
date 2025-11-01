import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import EmployeeAttendanceView from '../components/attendance/EmployeeAttendanceView';
import AdminAttendanceView from '../components/attendance/AdminAttendanceView';

export default function AttendancePage() {
    const { hasRole } = useAuth();

    // For Admins, show the admin view (they manage all attendance)
    if (hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER)) {
        return <AdminAttendanceView />;
    }

    // For everyone else (including managers), show their personal attendance
    // Managers will access team attendance through the separate /attendance route
    return <EmployeeAttendanceView />;
}