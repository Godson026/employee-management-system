import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import MyLeavePage from './MyLeavePage';
import TeamLeavePage from './TeamLeavePage';

export default function LeavePageRouter() {
    const { hasRole } = useAuth();
    
    // Check if user is a manager
    const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
    
    // Route to appropriate page based on role
    if (isManager) {
        return <TeamLeavePage />;
    }
    
    return <MyLeavePage />;
}

