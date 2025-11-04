import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import { HomeIcon, BuildingOfficeIcon, UsersIcon, CogIcon, DocumentTextIcon, ClockIcon, MapPinIcon } from './icons';
import api from '../api';
import NotificationBell from './NotificationBell';

export default function MainLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPersonalOpen, setIsPersonalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employeeData, setEmployeeData] = useState<{
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null>(null);
  
  // Check if we're on a settings page to auto-open the dropdown
  useEffect(() => {
    if (location.pathname.startsWith('/settings')) {
      setIsSettingsOpen(true);
    }
  }, [location.pathname]);

  // Check if we're on a personal page to auto-open the dropdown
  useEffect(() => {
    if (location.pathname.startsWith('/personal')) {
      setIsPersonalOpen(true);
    }
  }, [location.pathname]);

  // Fetch employee data for the current user
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.id) return;
      try {
        // Use secure self-profile endpoint which returns roles and employee
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

  // Function to determine if a settings tab is active
  const isSettingsTabActive = (tabName: string) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');
    
    // If no tab parameter, default to 'User Management'
    if (!currentTab && location.pathname === '/settings') {
      return tabName === 'User Management';
    }
    
    return currentTab === tabName;
  };

  // Define who is considered an Admin for UI purposes (only System Admins and HR Managers)
  const isAdminUser = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);
  
  // Define who is a manager (Branch Manager or Department Head)
  const isManager = hasRole(RoleName.BRANCH_MANAGER) || hasRole(RoleName.DEPARTMENT_HEAD);
  
  // Define who should see the Personal section (Managers, Admins, and HR Managers)
  const shouldShowPersonal = isManager || isAdminUser;

  // Close mobile menu when navigation occurs
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-yellow-50 font-sans">
      {/* Mobile Header with Hamburger Menu */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-green-900 to-green-800 text-white shadow-lg z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-yellow-400">SIC</span>
            <span className="text-xl font-italic text-green-300">Life</span>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-green-700/50 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Modern Sidebar - Responsive */}
      <aside className={`
        w-72 flex flex-col bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl
        fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Enhanced Logo Section */}
        <div className="p-6 border-b border-green-700/50">
          <div className="flex flex-col items-center space-y-3">
            {/* Top bar with notifications (Desktop only) */}
            <div className="w-full flex justify-end mb-2 hidden lg:flex">
              <NotificationBell />
            </div>
            {/* SIC Life Logo */}
            <div className="w-full flex justify-center">
              <div className="flex items-center space-x-3">
                {/* SIC Text */}
                <span className="text-2xl font-bold text-yellow-400">SIC</span>
                {/* Life Text */}
                <span className="text-2xl font-italic text-green-300">Life</span>
                {/* Diamond with rays */}
                <div className="relative">
                  <div className="w-2 h-2 bg-white rotate-45"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0.5 h-1 bg-green-300"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0.5 h-1 bg-green-300"></div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1 h-0.5 bg-green-300"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-1 h-0.5 bg-green-300"></div>
                </div>
              </div>
            </div>
            {/* Tagline */}
            <div className="text-center">
              <p className="text-xs text-green-300 font-medium">Absolute peace of mind</p>
              <div className="w-16 h-0.5 bg-green-300 mx-auto mt-1"></div>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Staff Portal
              </h1>
            </div>
          </div>
        </div>
        
        <nav className="flex-grow px-4 py-6 overflow-y-auto pb-24 scrollbar-hide">
          <ul className="space-y-3">
            {/* Enhanced Navigation Links */}
            <li>
              <NavLink 
                to="/" 
                end 
                onClick={handleNavClick}
                className={({ isActive }) => 
                  `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                      : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <HomeIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                Dashboard
              </NavLink>
            </li>
            
            {/* Admin-only links with enhanced styling - Reordered for better workflow */}
            {isAdminUser && (
              <>
                <li>
                  <NavLink 
                    to="/employees" 
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                          : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                      }`
                    }
                  >
                    <UsersIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                    Employees
                  </NavLink>
                </li>
                
                <li>
                  <NavLink 
                    to="/departments" 
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                          : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                      }`
                    }
                  >
                    <BuildingOfficeIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                    Departments
                  </NavLink>
                </li>
                
                <li>
                  <NavLink 
                    to="/branches" 
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                          : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                      }`
                    }
                  >
                    <MapPinIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                    Branches
                  </NavLink>
                </li>
              </>
            )}

            {/* Employees tab - for managers and admins */}
            {isManager && (
              <li>
                <NavLink 
                  to="/employees" 
                  onClick={handleNavClick}
                  className={({ isActive }) => 
                    `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                        : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                    }`
                  }
                >
                  <UsersIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                  Employees
                </NavLink>
              </li>
            )}

            {/* Attendance tab - different labels for managers vs employees vs admins - Reordered for managers */}
            <li>
              <NavLink 
                to="/attendance" 
                onClick={handleNavClick}
                className={({ isActive }) => 
                  `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                      : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <ClockIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                {isAdminUser ? 'All Attendance' : (isManager ? (hasRole(RoleName.BRANCH_MANAGER) ? 'Branch Attendance' : 'Department Attendance') : 'Attendance')}
              </NavLink>
            </li>

            {/* Leave tab - different labels for managers vs employees vs admins - Reordered for managers */}
            <li>
              <NavLink 
                to="/leave" 
                onClick={handleNavClick}
                className={({ isActive }) => 
                  `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                      : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                {isAdminUser ? 'Leave Approvals' : (isManager ? (hasRole(RoleName.BRANCH_MANAGER) ? 'Branch Leave' : 'Department Leave') : 'Leave')}
              </NavLink>
            </li>

            {/* Announcements - Admin only */}
            {isAdminUser && (
              <li>
                <NavLink 
                  to="/announcements" 
                  onClick={handleNavClick}
                  className={({ isActive }) => 
                    `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-yellow-400 to-green-600 text-white shadow-lg shadow-green-500/25' 
                        : 'text-green-200 hover:bg-green-700/50 hover:text-white hover:translate-x-1'
                    }`
                  }
                >
                  <svg className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Announcements
                </NavLink>
              </li>
            )}

            {/* Personal Dropdown for Managers, Admins, and HR Managers - Reordered to end for managers */}
            {shouldShowPersonal && (
              <li>
                <button 
                  onClick={() => setIsPersonalOpen(!isPersonalOpen)} 
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-green-200 hover:bg-green-700/50 hover:text-white transition-all duration-200"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal
                  </div>
                  <svg 
                    className={`h-4 w-4 transition-transform duration-200 ${isPersonalOpen ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Personal Dropdown Content */}
                {isPersonalOpen && (
                  <ul className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <li>
                      <NavLink 
                        to="/personal/leave" 
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-yellow-100 text-green-700' 
                              : 'text-green-300 hover:text-white hover:bg-green-700/30'
                          }`
                        }
                      >
                        <span className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          My Leave
                        </span>
                        {location.pathname === '/personal/leave' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/personal/attendance" 
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-yellow-100 text-green-700' 
                              : 'text-green-300 hover:text-white hover:bg-green-700/30'
                          }`
                        }
                      >
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          My Attendance
                        </span>
                        {location.pathname === '/personal/attendance' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {/* Enhanced Settings Dropdown */}
            {(hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER)) && (
              <li>
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-green-200 hover:bg-green-700/50 hover:text-white transition-all duration-200"
                >
                  <div className="flex items-center">
                    <CogIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                    Settings
                  </div>
                  <svg 
                    className={`h-4 w-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Enhanced Dropdown Content */}
                {isSettingsOpen && (
                  <ul className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <li>
                      <NavLink 
                        to="/settings?tab=User%20Management" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('User Management')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>User Management</span>
                        {isSettingsTabActive('User Management') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/settings?tab=Company%20Profile" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('Company Profile')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>Company Profile</span>
                        {isSettingsTabActive('Company Profile') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/settings?tab=Organization%20Structure" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('Organization Structure')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>Organization Structure</span>
                        {isSettingsTabActive('Organization Structure') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/settings?tab=Leave%20%26%20Attendance" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('Leave & Attendance')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>Leave & Attendance</span>
                        {isSettingsTabActive('Leave & Attendance') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/settings?tab=Payroll%20%26%20Finance" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('Payroll & Finance')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>Payroll & Finance</span>
                        {isSettingsTabActive('Payroll & Finance') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/settings?tab=Security" 
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSettingsTabActive('Security')
                            ? 'bg-yellow-100 text-green-700' 
                            : 'text-green-300 hover:text-white hover:bg-green-700/30'
                        }`}
                      >
                        <span>Security</span>
                        {isSettingsTabActive('Security') && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>
        
        {/* Enhanced User Profile Section */}
        <div className="border-t border-green-700/50 p-6">
          <div className="flex items-center space-x-4 mb-4">
            {employeeData?.photo_url ? (
              <img 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg" 
                src={employeeData.photo_url} 
                alt={`${employeeData.first_name} ${employeeData.last_name}`} 
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">
                  {employeeData ? 
                    `${employeeData.first_name?.charAt(0)}${employeeData.last_name?.charAt(0)}` : 
                    (user?.email ? user.email.charAt(0).toUpperCase() : 'U')
                  }
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {employeeData ? 
                  `${employeeData.first_name} ${employeeData.last_name}` : 
                  (user?.email || 'Guest User')
                }
              </p>
              <p className="text-xs text-green-300 font-medium">
                {user?.roles?.[0]?.name || 'No role'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center px-4 py-3 text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 font-medium group"
          >
            <svg className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Enhanced Main Content Area - Scrollable and Responsive */}
      <main className="flex-1 lg:ml-72 overflow-y-auto pt-16 lg:pt-0">
        <div className="min-h-full bg-gradient-to-br from-green-50 to-yellow-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}