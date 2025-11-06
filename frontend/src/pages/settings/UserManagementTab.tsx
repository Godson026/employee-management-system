import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import ManageRolesModal from './ManageRolesModal';
import CreateUserModal from './CreateUserModal';
import { useAuth } from '../../contexts/AuthContext';
import { RoleName } from '../../roles';
import {
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Role { 
  id: string; 
  name: string; 
}

interface User { 
  id: string; 
  email: string; 
  roles: Role[]; 
}

interface Employee {
  id: string;
  employee_id_code: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  photo_url: string | null;
  start_date: string;
  status: string;
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

interface EmployeeWithUser extends Employee { 
  user: User | null; 
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function UserManagementTab() {
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAccountStatus, setFilterAccountStatus] = useState<string>('all');
  const { hasRole } = useAuth();

  const fetchEmployeeUsers = async () => {
    try {
        const res = await api.get('/users/all-employees');
        setEmployees(res.data);
    } catch {
        toast.error('Could not fetch employee and user list.');
    }
  };

  useEffect(() => {
    if (hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER)) {
        fetchEmployeeUsers();

        api.get('/roles')
        .then(res => setAllRoles(res.data))
        .catch(() => toast.error('Could not fetch roles.'));
    }
  }, [hasRole]);
  
  const openModalForUser = (user: User) => {
    setSelectedUser(user);
  };
  
  const closeModal = () => {
      setSelectedUser(null);
  }

  const openCreateUserModal = (employee: EmployeeWithUser) => {
      setSelectedEmployee(employee);
      setIsCreateUserModalOpen(true);
  };

  const closeCreateUserModal = () => {
      setIsCreateUserModalOpen(false);
      setSelectedEmployee(null);
  };

  const handleCreateUser = async (password: string) => {
      if (!selectedEmployee) return;
      
      try {
          await api.post(`/users/create-for-employee/${selectedEmployee.id}`, { password: password });
          toast.success(`User account created for ${selectedEmployee.email}`);
          fetchEmployeeUsers();
          closeCreateUserModal();
      } catch (err) {
          toast.error("Failed to create user account.");
      }
  }

  const handleSaveRoles = async (userId: string, roleIds: string[]) => {
    setIsSaving(true);
    try {
        await api.patch(`/users/${userId}/roles`, { roleIds });
        toast.success("User roles updated successfully!");
        fetchEmployeeUsers();
        closeModal();
    } catch (err) {
        const error = err as AxiosError<{ message: string | string[] }>;
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
             backendMessage.forEach(msg => toast.error(msg));
        } else if (backendMessage) {
            toast.error(backendMessage);
        } else {
            toast.error("Failed to update roles.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const usersWithAccounts = employees.filter(emp => emp.user !== null).length;
    const employeesWithoutAccounts = totalEmployees - usersWithAccounts;
    
    // Count users by role
    const roleCounts: Record<string, number> = {};
    employees.forEach(emp => {
      if (emp.user && emp.user.roles.length > 0) {
        emp.user.roles.forEach(role => {
          roleCounts[role.name] = (roleCounts[role.name] || 0) + 1;
        });
      }
    });

    // Prepare data for charts
    const roleChartData = Object.entries(roleCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const accountStatusData = [
      { name: 'With Account', value: usersWithAccounts, color: '#10b981' },
      { name: 'No Account', value: employeesWithoutAccounts, color: '#ef4444' },
    ];

    return {
      totalEmployees,
      usersWithAccounts,
      employeesWithoutAccounts,
      roleCounts,
      roleChartData,
      accountStatusData,
    };
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === 'all' || 
        (emp.user && emp.user.roles.some(r => r.name === filterRole));

      const matchesAccountStatus = 
        filterAccountStatus === 'all' ||
        (filterAccountStatus === 'with-account' && emp.user !== null) ||
        (filterAccountStatus === 'without-account' && emp.user === null);

      return matchesSearch && matchesRole && matchesAccountStatus;
    });
  }, [employees, searchQuery, filterRole, filterAccountStatus]);

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'System Administrator': 'bg-gradient-to-r from-purple-500 to-pink-600',
      'HR Manager': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'Branch Manager': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'Department Head': 'bg-gradient-to-r from-teal-500 to-cyan-600',
      'Employee': 'bg-gradient-to-r from-gray-500 to-gray-600',
    };
    return colors[roleName] || 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Total Employees</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.totalEmployees}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Users with Accounts */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">With Accounts</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats.usersWithAccounts}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalEmployees > 0 
                  ? Math.round((stats.usersWithAccounts / stats.totalEmployees) * 100) 
                  : 0}% coverage
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Employees without Accounts */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">No Account</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                {stats.employeesWithoutAccounts}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Need user accounts
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
              <UserPlusIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Active Roles */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Active Roles</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {Object.keys(stats.roleCounts).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Role types assigned
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 mr-2" />
            Users by Role
          </h3>
          {stats.roleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.roleChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>No role data available</p>
            </div>
          )}
        </div>

        {/* Account Status Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
            Account Status Distribution
          </h3>
          {stats.accountStatusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.accountStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, value, percent } = props;
                    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.accountStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">All Roles</option>
              {allRoles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Account Status Filter */}
          <div className="relative">
            <select
              value={filterAccountStatus}
              onChange={(e) => setFilterAccountStatus(e.target.value)}
              className="pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">All Accounts</option>
              <option value="with-account">With Account</option>
              <option value="without-account">Without Account</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600">
            Showing <span className="text-emerald-600 font-bold">{filteredEmployees.length}</span> of <span className="text-gray-900 font-bold">{employees.length}</span> employees
          </p>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                {hasRole(RoleName.SYSTEM_ADMIN) && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={hasRole(RoleName.SYSTEM_ADMIN) ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No employees found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {emp.photo_url ? (
                          <img
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200"
                            src={emp.photo_url}
                            alt={`${emp.first_name} ${emp.last_name}`}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-200">
                            <span className="text-white font-bold text-sm">
                              {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{emp.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.department?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {emp.user && emp.user.roles.length > 0 ? (
                          emp.user.roles.map(role => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${getRoleBadgeColor(role.name)} shadow-md`}
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100">
                            No User Account
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp.user ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-green-800 bg-green-100">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-red-800 bg-red-100">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          No Account
                        </span>
                      )}
                    </td>
                    {hasRole(RoleName.SYSTEM_ADMIN) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {emp.user ? (
                          <button
                            onClick={() => emp.user && openModalForUser(emp.user)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <ShieldCheckIcon className="w-4 h-4 mr-2" />
                            Manage Roles
                          </button>
                        ) : (
                          <button
                            onClick={() => openCreateUserModal(emp)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            Create User
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {hasRole(RoleName.SYSTEM_ADMIN) && (
          <ManageRolesModal
            user={selectedUser}
            allRoles={allRoles}
            onClose={closeModal}
            onSave={handleSaveRoles}
            isSaving={isSaving}
          />
      )}

      {hasRole(RoleName.SYSTEM_ADMIN) && (
          <CreateUserModal
            isOpen={isCreateUserModalOpen}
            onClose={closeCreateUserModal}
            onSubmit={handleCreateUser}
            email={selectedEmployee?.email || ''}
          />
      )}
    </div>
  );
}
