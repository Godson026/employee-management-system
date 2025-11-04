import { useAuth } from '../contexts/AuthContext';
import EmployeeAttendanceView from '../components/attendance/EmployeeAttendanceView';

// This page is used for personal attendance view (accessed via /personal/attendance)
// It always shows the employee's personal attendance, regardless of role
export default function AttendancePage() {
    return <EmployeeAttendanceView />;
}