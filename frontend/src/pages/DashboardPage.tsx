import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import AdminDashboard from './AdminDashboard';
import BranchManagerDashboard from './BranchManagerDashboard'; // Our new, correctly named dashboard
import DepartmentHeadDashboard from './DepartmentHeadDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function DashboardPage() {
    const { hasRole } = useAuth();
    
    // Check in order of highest privilege
    if (hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER)) {
        return <AdminDashboard />;
    }
    
    if (hasRole(RoleName.DEPARTMENT_HEAD)) {
        return <DepartmentHeadDashboard />;
    }

    if (hasRole(RoleName.BRANCH_MANAGER)) {
        return <BranchManagerDashboard />; // Point to the new component
    }

    if (hasRole(RoleName.EMPLOYEE)) {
        return <EmployeeDashboard />;
    }

    // A safe fallback
    return <div>Loading...</div>;
}