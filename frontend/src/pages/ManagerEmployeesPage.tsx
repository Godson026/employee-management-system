import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import api from '../api';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  SearchIcon,
} from '../components/icons';

interface Employee {
  id: string;
  employee_id_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  job_title: string;
  photo_url: string | null;
  start_date: string;
  status: string;
  leave_balance: number;
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

interface EmployeeStats {
  attendanceRate: number;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  onLeaveToday: boolean;
}

export default function ManagerEmployeesPage() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<Record<string, EmployeeStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isBranchManager = hasRole(RoleName.BRANCH_MANAGER);
  const isDepartmentHead = hasRole(RoleName.DEPARTMENT_HEAD);
  const teamType = isBranchManager ? 'Branch' : isDepartmentHead ? 'Department' : 'Team';

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        // Fetch employees - backend automatically filters by role
        const res = await api.get('/employees');
        const employeesData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setEmployees(employeesData);

        // Fetch stats for all employees at once
        const today = new Date().toISOString().split('T')[0];
        try {
          // Fetch attendance history for the last 30 days (all team members)
          const [attendanceRes, onLeaveRes] = await Promise.all([
            api.get(`/attendance/team-history?startDate=${getDateNDaysAgo(30)}&endDate=${today}`),
            api.get(`/leaves/on-leave?date=${today}`)
          ]);
          
          const attendanceRecords = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
          const onLeaveToday = Array.isArray(onLeaveRes.data) ? onLeaveRes.data : [];
          
          // Create a map of employee IDs to their on-leave status
          const onLeaveMap = new Set(onLeaveToday.map((req: any) => req.employee?.id));
          
          // Calculate stats for each employee
          const statsMap: Record<string, EmployeeStats> = {};
          employeesData.forEach((emp: Employee) => {
            // Filter records for this employee
            const empRecords = attendanceRecords.filter((r: any) => r.employee?.id === emp.id);
            
            // Calculate stats
            const totalDays = empRecords.length;
            const presentDays = empRecords.filter((r: any) => {
              const status = (r.status || '').toUpperCase();
              return status === 'PRESENT' || status === 'LATE';
            }).length;
            const absentDays = empRecords.filter((r: any) => {
              const status = (r.status || '').toUpperCase();
              return status === 'ABSENT';
            }).length;
            const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            statsMap[emp.id] = {
              attendanceRate,
              presentDays,
              absentDays,
              totalDays,
              onLeaveToday: onLeaveMap.has(emp.id),
            };
          });
          
          setEmployeeStats(statsMap);
        } catch (error) {
          console.error('Failed to fetch employee stats:', error);
          // Initialize with default stats
          const statsMap: Record<string, EmployeeStats> = {};
          employeesData.forEach((emp: Employee) => {
            statsMap[emp.id] = {
              attendanceRate: 0,
              presentDays: 0,
              absentDays: 0,
              totalDays: 0,
              onLeaveToday: false,
            };
          });
          setEmployeeStats(statsMap);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const getDateNDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(search) ||
      emp.last_name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.job_title.toLowerCase().includes(search) ||
      emp.employee_id_code.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                <UsersIcon className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{teamType} Employees</h1>
                <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                <p className="text-lg md:text-xl text-green-50 mt-2">
                  Manage and monitor your {teamType.toLowerCase()} team members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees by name, email, job title, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
            </div>
          </div>
        </div>

        {/* Employee Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
              <UsersIcon className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">No employees found</p>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : `No employees assigned to your ${teamType.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => {
              const stats = employeeStats[employee.id] || {
                attendanceRate: 0,
                presentDays: 0,
                absentDays: 0,
                totalDays: 0,
                onLeaveToday: false,
              };

              return (
                <div
                  key={employee.id}
                  className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {/* Employee Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b-2 border-green-200">
                    <div className="flex items-center space-x-4">
                      {/* Photo */}
                      {employee.photo_url ? (
                        <img
                          src={employee.photo_url}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                        </div>
                      )}
                      
                      {/* Name and Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{employee.job_title}</p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(employee.status)}`}>
                          {employee.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="p-6 space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 text-green-600" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone_number && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 text-green-600" />
                          <span>{employee.phone_number}</span>
                        </div>
                      )}
                      {employee.department && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <BuildingOfficeIcon className="h-4 w-4 text-green-600" />
                          <span>{employee.department.name}</span>
                        </div>
                      )}
                      {employee.branch && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 text-green-600" />
                          <span>{employee.branch.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                      {/* Attendance Rate */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <ChartBarIcon className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-semibold text-gray-700">Attendance</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.attendanceRate}%</p>
                        <p className="text-xs text-gray-500">{stats.presentDays}/{stats.totalDays} days</p>
                      </div>

                      {/* Leave Balance */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-semibold text-gray-700">Leave Days</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{employee.leave_balance || 0}</p>
                        <p className="text-xs text-gray-500">remaining</p>
                      </div>
                    </div>

                    {/* On Leave Badge */}
                    {stats.onLeaveToday && (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
                        <span className="text-sm font-semibold text-yellow-800">On Leave Today</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200">
                      <Link
                        to={`/employees/${employee.id}`}
                        className="block w-full text-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

