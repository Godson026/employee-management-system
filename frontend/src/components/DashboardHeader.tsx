import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import api from '../api';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import { getPersonalizedGreeting } from '../utils/greetings';

export default function DashboardHeader() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [employeeData, setEmployeeData] = useState<{
    first_name: string;
    last_name: string;
    photo_url: string | null;
    department?: { name: string } | null;
    branch?: { name: string } | null;
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
            department: me.data.employee.department || null,
            branch: me.data.employee.branch || null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }
    };

    fetchEmployeeData();
  }, [user?.id]);

  // Format role display with department/branch name
  const getRoleDisplay = (): string => {
    const roleName = user?.roles?.[0]?.name || 'No role';
    
    if (hasRole(RoleName.DEPARTMENT_HEAD) && employeeData?.department?.name) {
      return `Department Head, ${employeeData.department.name}`;
    }
    
    if (hasRole(RoleName.BRANCH_MANAGER) && employeeData?.branch?.name) {
      return `Branch Manager, ${employeeData.branch.name}`;
    }
    
    return roleName;
  };

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

  // Get personalized greeting
  const greeting = employeeData?.first_name 
    ? getPersonalizedGreeting(employeeData.first_name, hasRole)
    : getPersonalizedGreeting(null, hasRole);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-white/95 via-emerald-50/30 to-teal-50/30 backdrop-blur-xl border-b border-emerald-200/50 shadow-lg shadow-emerald-500/5">
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Page Title with Enhanced Styling */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="relative">
              {/* Decorative gradient circle behind icon */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl"></div>
              <div className="relative">
                <div className="w-2 h-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                {getPageTitle()}
              </h1>
              <p className="text-sm md:text-base font-black tracking-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-emerald-900 bg-clip-text text-transparent mt-0.5 hidden md:block">
                {greeting.message}
              </p>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile, visible on tablet and up */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Right Side - Notifications and Profile */}
          <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                id="profile-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="group flex items-center space-x-3 px-3 md:px-4 py-2 rounded-2xl bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm border border-emerald-200/50 shadow-md hover:shadow-lg hover:from-white hover:to-emerald-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {employeeData?.photo_url ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-md"></div>
                    <img
                      className="relative w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-emerald-300/50 group-hover:ring-emerald-400 transition-all"
                      src={employeeData.photo_url}
                      alt={`${employeeData.first_name} ${employeeData.last_name}`}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-md"></div>
                    <div className="relative w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-emerald-300/50 group-hover:ring-emerald-400 transition-all shadow-md">
                      <span className="text-white text-sm md:text-base font-black">
                        {employeeData
                          ? `${employeeData.first_name?.charAt(0)}${employeeData.last_name?.charAt(0)}`
                          : user?.email
                          ? user.email.charAt(0).toUpperCase()
                          : 'U'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                    {employeeData
                      ? `${employeeData.first_name} ${employeeData.last_name}`
                      : user?.email || 'Guest User'}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600/80">
                    {getRoleDisplay()}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-emerald-600 transition-all duration-300 ${isProfileMenuOpen ? 'rotate-180 text-emerald-700' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile Dropdown Menu - Enhanced */}
              {isProfileMenuOpen && (
                <div
                  id="profile-menu"
                  className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
                >
                  {/* Profile Header */}
                  <div className="px-5 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                    <div className="flex items-center space-x-3">
                      {employeeData?.photo_url ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-md"></div>
                          <img
                            className="relative w-12 h-12 rounded-full object-cover ring-2 ring-emerald-300"
                            src={employeeData.photo_url}
                            alt={`${employeeData.first_name} ${employeeData.last_name}`}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-md"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-emerald-300 shadow-lg">
                            <span className="text-white text-base font-black">
                              {employeeData
                                ? `${employeeData.first_name?.charAt(0)}${employeeData.last_name?.charAt(0)}`
                                : user?.email
                                ? user.email.charAt(0).toUpperCase()
                                : 'U'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {employeeData
                            ? `${employeeData.first_name} ${employeeData.last_name}`
                            : user?.email || 'Guest User'}
                        </p>
                        <p className="text-xs text-emerald-600/80 font-semibold mt-0.5 truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {getRoleDisplay()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-semibold text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 flex items-center space-x-3 group"
                    >
                      <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                        <svg
                          className="w-5 h-5 text-red-600"
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
                      </div>
                      <span className="flex-1">Logout</span>
                      <svg className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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

