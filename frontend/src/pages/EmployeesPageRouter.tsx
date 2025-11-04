import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import EmployeesListPage from './EmployeesListPage';
import ManagerEmployeesPage from './ManagerEmployeesPage';

export default function EmployeesPageRouter() {
  const { hasRole } = useAuth();
  
  // Check if user is Admin or HR Manager
  const isAdminUser = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);
  
  // Check if user is a manager (Branch Manager or Department Head)
  const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
  
  // Admin/HR Manager: Show full employees list with management capabilities
  if (isAdminUser) {
    return <EmployeesListPage />;
  }
  
  // Branch Manager/Department Head: Show their team with stats
  if (isManager) {
    return <ManagerEmployeesPage />;
  }
  
  // Regular employees: No access (shouldn't reach here due to route protection)
  return <div>Access Denied</div>;
}

