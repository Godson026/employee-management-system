import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import NotificationBell from './NotificationBell';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeData, setEmployeeData] = useState<{
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.id) return;
      try {
        const me = await api.get('/users/me');
        if (me.data?.employee) {
          setEmployeeData({
            first_name: me.data.employee.first_name,
            last_name: me.data.employee.last_name,
            photo_url: me.data.employee.photo_url || null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user?.id]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const profileMenu = document.getElementById('profile-menu');
      const profileButton = document.getElementById('profile-button');
      
      if (profileMenu && !profileMenu.contains(target) && profileButton && !profileButton.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/employees')) return 'Employees';
    if (path.startsWith('/departments')) return 'Departments';
    if (path.startsWith('/branches')) return 'Branches';
    if (path.startsWith('/attendance')) return 'Attendance';
    if (path.startsWith('/leave')) return 'Leave';
    if (path.startsWith('/announcements')) return 'Announcements';
    if (path.startsWith('/personal')) return 'Personal';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/notifications')) return 'Notifications';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
      <div className="px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Side - Notifications and Profile */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                id="profile-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {employeeData?.photo_url ? (
                  <img
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200"
                    src={employeeData.photo_url}
                    alt={`${employeeData.first_name} ${employeeData.last_name}`}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-emerald-200">
                    <span className="text-white text-sm font-bold">
                      {employeeData
                        ? `${employeeData.first_name?.charAt(0)}${employeeData.last_name?.charAt(0)}`
                        : user?.email
                        ? user.email.charAt(0).toUpperCase()
                        : 'U'}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {employeeData
                      ? `${employeeData.first_name} ${employeeData.last_name}`
                      : user?.email || 'Guest User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.roles?.[0]?.name || 'No role'}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  id="profile-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {employeeData
                        ? `${employeeData.first_name} ${employeeData.last_name}`
                        : user?.email || 'Guest User'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/notifications');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <span>View All Notifications</span>
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

