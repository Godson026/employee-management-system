import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import SessionTimeoutManager from './components/SessionTimeoutManager';
import { Toaster } from 'react-hot-toast';

import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import DashboardPage from './pages/DashboardPage';
import DepartmentsListPage from './pages/DepartmentsListPage';
import AddNewDepartmentPage from './pages/AddNewDepartmentPage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import EditDepartmentPage from './pages/EditDepartmentPage';
import BranchDetailPage from './pages/BranchDetailPage';
import EditBranchPage from './pages/EditBranchPage';
import EmployeesPageRouter from './pages/EmployeesPageRouter';
import BranchesListPage from './pages/BranchesListPage';
import AddNewEmployeePage from './pages/AddNewEmployeePage';
import EditEmployeePage from './pages/EditEmployeePage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import AddNewBranchPage from './pages/AddNewBranchPage';
import SettingsPage from './pages/SettingsPage';
import MyLeavePage from './pages/MyLeavePage';
import LeavePageRouter from './pages/LeavePageRouter';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import KioskPage from './pages/KioskPage';
import AttendancePage from './pages/AttendancePage';
import AttendancePageRouter from './pages/AttendancePageRouter';
import TestAttendancePage from './pages/TestAttendancePage';
import NotificationsPage from './pages/NotificationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HelpSupportPage from './pages/HelpSupportPage';

function AppRoutes() {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/help" element={<HelpSupportPage />} />
        
        {/* Protected Routes for ANY Authenticated User */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            
            {/* Personal routes for managers */}
            <Route path="personal/leave" element={<MyLeavePage />} />
            <Route path="personal/attendance" element={<AttendancePage />} />
            
            {/* Main leave and attendance routes - router decides based on role */}
            <Route path="leave" element={<LeavePageRouter />} />
            <Route path="attendance" element={<AttendancePageRouter />} />
            
            {/* CORRECTED ORDER FOR DEPARTMENTS */}
            <Route path="departments" element={<DepartmentsListPage />} />
            <Route path="departments/new" element={<AddNewDepartmentPage />} />
            <Route path="departments/:id" element={<DepartmentDetailPage />} />
            <Route path="departments/:id/edit" element={<EditDepartmentPage />} />
            
            {/* CORRECTED ORDER FOR BRANCHES */}
            <Route path="branches" element={<BranchesListPage />} />
            <Route path="branches/new" element={<AddNewBranchPage />} />
            <Route path="branches/:id" element={<BranchDetailPage />} />
            <Route path="branches/:id/edit" element={<EditBranchPage />} />
            
            <Route path="employees" element={<EmployeesPageRouter />} />
            <Route path="employees/new" element={<AddNewEmployeePage />} />
            <Route path="employees/:id" element={<EmployeeDetailPage />} />
            <Route path="employees/:id/edit" element={<EditEmployeePage />} />
            
            <Route path="settings" element={<SettingsPage />} />
            <Route path="leave/approvals" element={<LeaveApprovalsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="test-attendance" element={<TestAttendancePage />} />
          </Route>
        </Route>
      </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <SessionTimeoutManager />
          <AppRoutes />
        <Toaster 
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Default options for all toasts
            duration: 4000, // Auto-dismiss after 4 seconds
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              maxWidth: '500px',
            },
            // Success toast styling
            success: {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: '600',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            // Error toast styling
            error: {
              duration: 5000, // Errors stay a bit longer
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                fontWeight: '600',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            // Loading toast styling
            loading: {
              style: {
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontWeight: '600',
              },
            },
          }}
        />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;