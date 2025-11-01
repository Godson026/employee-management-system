import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles'; // We will create this enum file next

interface ProtectedRouteProps {
    allowedRoles?: RoleName[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles are specified, check if the user has any of them
  const hasRequiredRole = allowedRoles ? user?.roles.some(role => allowedRoles.includes(role.name as RoleName)) : true;

  if (!hasRequiredRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}