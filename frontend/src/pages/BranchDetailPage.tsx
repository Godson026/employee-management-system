import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PencilIcon,
  MapPinIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  UsersIcon,
  IdentificationIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface BranchDetails {
  id: string;
  name: string;
  code: string;
  region: string;
  address: string;
  branch_manager: { first_name: string; last_name: string; } | null;
  employees: { id: string; first_name: string; last_name: string; job_title: string }[];
}

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  onLeaveToday: number;
  totalRequests: number;
}

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [branch, setBranch] = useState<BranchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'leaves'>('overview');
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const branchRes = await api.get(`/branches/${id}`);
          setBranch(branchRes.data);
          
          // Fetch comprehensive statistics
          const today = format(new Date(), 'yyyy-MM-dd');
          const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
          
          // Fetch attendance stats and records (today)
          const [attendanceToday, attendanceRecordsRes, leavesRes, onLeaveRes] = await Promise.all([
            api.get(`/attendance/summary-stats?branchId=${id}&startDate=${today}&endDate=${today}`),
            api.get(`/attendance/team-history?branchId=${id}&startDate=${today}&endDate=${today}`),
            api.get(`/leaves/team-history?startDate=${startOfMonth}&endDate=${today}`),
            api.get(`/leaves/on-leave?date=${today}`)
          ]);
          
          // Process attendance stats
          const todayStats = attendanceToday.data;
          
          setAttendanceStats({
            totalEmployees: todayStats.totalEmployees || branchRes.data.employees.length,
            present: todayStats.present || 0,
            absent: todayStats.absent || 0,
            late: todayStats.late || 0,
          });
          
          // Process attendance records - filter by branch
          const allAttendanceRecords = Array.isArray(attendanceRecordsRes.data) ? attendanceRecordsRes.data : [];
          const branchAttendanceRecords = allAttendanceRecords.filter((r: any) => {
            const empBranchId = r.employee?.branch?.id || r.employee?.branch_id;
            return empBranchId === id;
          });
          setAttendanceRecords(branchAttendanceRecords);
          
          // Process leave stats
          const allLeaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];
          const onLeaveToday = Array.isArray(onLeaveRes.data) ? onLeaveRes.data : [];
          
          // Filter leaves for this branch
          const branchLeaves = allLeaves.filter((l: any) => {
            const empBranchId = l.employee?.branch?.id || l.employee?.branch_id;
            return empBranchId === id;
          });
          
          const branchOnLeave = onLeaveToday.filter((l: any) => {
            const empBranchId = l.employee?.branch?.id || l.employee?.branch_id;
            return empBranchId === id;
          });
          
          setLeaveRecords(branchLeaves);
          
          setLeaveStats({
            pending: branchLeaves.filter((l: any) => (l.status || '').toUpperCase() === 'PENDING').length,
            approved: branchLeaves.filter((l: any) => (l.status || '').toUpperCase() === 'APPROVED').length,
            rejected: branchLeaves.filter((l: any) => (l.status || '').toUpperCase() === 'REJECTED').length,
            onLeaveToday: branchOnLeave.length,
            totalRequests: branchLeaves.length,
          });
        } catch (error) {
          console.error('Failed to fetch branch data:', error);
          toast.error('Failed to fetch branch details.');
        } finally {
          setLoading(false);
          setLoadingStats(false);
        }
      };
      
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading branch details...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-bold text-lg">Branch not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SIC Life Branded Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Link
                  to="/branches"
                  className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                    <MapPinIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">{branch.name}</h1>
                    <p className="text-emerald-600 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                    <p className="text-lg md:text-xl text-gray-600 mt-2">Branch Code: {branch.code}</p>
                  </div>
                </div>
              </div>
              <Link
                to={`/branches/${branch.id}/edit`}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Branch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Tabs Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="flex space-x-2 border-b-2 border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'employees', label: 'Employees', icon: UsersIcon },
              { id: 'attendance', label: 'Attendance', icon: ClockIcon },
              { id: 'leaves', label: 'Leaves', icon: CalendarDaysIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-3 font-semibold transition-all duration-200 border-b-2 -mb-0.5 ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                      : 'border-transparent text-gray-600 hover:text-emerald-600 hover:border-emerald-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Total Employees */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <UsersIcon className="w-10 h-10 opacity-80" />
                </div>
                <p className="text-emerald-100 text-sm font-bold uppercase tracking-wide mb-1">Total Employees</p>
                <p className="text-4xl font-extrabold">{branch.employees.length}</p>
              </div>

              {/* Present Today */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircleIcon className="w-10 h-10 opacity-80" />
                </div>
                <p className="text-green-100 text-sm font-bold uppercase tracking-wide mb-1">Present Today</p>
                <p className="text-4xl font-extrabold">{attendanceStats?.present || 0}</p>
                {attendanceStats && (
                  <p className="text-green-100 text-xs mt-2">
                    {attendanceStats.totalEmployees > 0
                      ? Math.round((attendanceStats.present / attendanceStats.totalEmployees) * 100)
                      : 0}% attendance rate
                  </p>
                )}
              </div>

              {/* On Leave Today */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <CalendarDaysIcon className="w-10 h-10 opacity-80" />
                </div>
                <p className="text-blue-100 text-sm font-bold uppercase tracking-wide mb-1">On Leave Today</p>
                <p className="text-4xl font-extrabold">{leaveStats?.onLeaveToday || 0}</p>
              </div>

              {/* Pending Leaves */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <ClockIcon className="w-10 h-10 opacity-80" />
                </div>
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wide mb-1">Pending Leaves</p>
                <p className="text-4xl font-extrabold">{leaveStats?.pending || 0}</p>
              </div>
            </div>

            {/* Branch Details and Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Details Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BuildingOffice2Icon className="w-7 h-7 text-emerald-600 mr-3" />
                    Branch Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <UserCircleIcon className="w-5 h-5 mr-2 text-emerald-600" />
                        Branch Manager
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">
                        {branch.branch_manager 
                          ? `${branch.branch_manager.first_name} ${branch.branch_manager.last_name}`
                          : <span className="text-gray-400 italic">Unassigned</span>
                        }
                      </dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <MapPinIcon className="w-5 h-5 mr-2 text-emerald-600" />
                        Region
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{branch.region}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200 md:col-span-2">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <IdentificationIcon className="w-5 h-5 mr-2 text-emerald-600" />
                        Address
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{branch.address}</dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <ChartBarIcon className="w-6 h-6 text-emerald-600 mr-2" />
                    Quick Stats
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-700">Absent Today</span>
                      <span className="text-2xl font-bold text-red-600">{attendanceStats?.absent || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-700">Late Today</span>
                      <span className="text-2xl font-bold text-amber-600">{attendanceStats?.late || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-700">Approved Leaves</span>
                      <span className="text-2xl font-bold text-green-600">{leaveStats?.approved || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-700">Total Requests</span>
                      <span className="text-2xl font-bold text-blue-600">{leaveStats?.totalRequests || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 md:px-8 py-5 border-b-2 border-emerald-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <UsersIcon className="w-7 h-7 text-emerald-600 mr-3" />
                Employees in this Branch ({branch.employees.length})
              </h2>
            </div>
            {branch.employees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No employees assigned to this branch</p>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branch.employees.map((emp) => (
                    <Link
                      key={emp.id}
                      to={`/employees/${emp.id}`}
                      className="group bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <BriefcaseIcon className="w-4 h-4 mr-1 text-emerald-600" />
                              {emp.job_title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6 md:space-y-8">
            {/* Statistics Cards */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="w-7 h-7 text-emerald-600 mr-3" />
                Attendance Statistics
              </h2>
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Present</p>
                    <p className="text-3xl font-extrabold text-green-600">{attendanceStats?.present || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border-2 border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <XCircleIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Absent</p>
                    <p className="text-3xl font-extrabold text-red-600">{attendanceStats?.absent || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
                    <div className="flex items-center justify-between mb-4">
                      <ClockIcon className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Late</p>
                    <p className="text-3xl font-extrabold text-amber-600">{attendanceStats?.late || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <ChartBarIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Attendance Rate</p>
                    <p className="text-3xl font-extrabold text-blue-600">
                      {attendanceStats && attendanceStats.totalEmployees > 0
                        ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.totalEmployees) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Records Table */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 md:px-8 py-5 border-b-2 border-emerald-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ClockIcon className="w-7 h-7 text-emerald-600 mr-3" />
                  Attendance Records
                </h2>
              </div>
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No attendance records found for today</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record: any, index: number) => (
                        <tr key={record.id} className={`hover:bg-emerald-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                {record.employee?.first_name?.charAt(0)}{record.employee?.last_name?.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.employee?.first_name} {record.employee?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{record.employee?.job_title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clock_in_time ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {format(new Date(record.clock_in_time), 'hh:mm a')}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clock_out_time ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {format(new Date(record.clock_out_time), 'hh:mm a')}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (record.status || '').toUpperCase() === 'PRESENT' ? 'bg-green-100 text-green-800' :
                              (record.status || '').toUpperCase() === 'LATE' ? 'bg-amber-100 text-amber-800' :
                              (record.status || '').toUpperCase() === 'ABSENT' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="space-y-6 md:space-y-8">
            {/* Statistics Cards */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="w-7 h-7 text-emerald-600 mr-3" />
                Leave Statistics
              </h2>
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                    <div className="flex items-center justify-between mb-4">
                      <ClockIcon className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Pending</p>
                    <p className="text-3xl font-extrabold text-amber-600">{leaveStats?.pending || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Approved</p>
                    <p className="text-3xl font-extrabold text-green-600">{leaveStats?.approved || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border-2 border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <XCircleIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Rejected</p>
                    <p className="text-3xl font-extrabold text-red-600">{leaveStats?.rejected || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <CalendarDaysIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">On Leave Today</p>
                    <p className="text-3xl font-extrabold text-blue-600">{leaveStats?.onLeaveToday || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <ChartBarIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Total Requests</p>
                    <p className="text-3xl font-extrabold text-purple-600">{leaveStats?.totalRequests || 0}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Leave Records Table */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 md:px-8 py-5 border-b-2 border-emerald-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="w-7 h-7 text-emerald-600 mr-3" />
                  Leave Requests
                </h2>
              </div>
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : leaveRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <CalendarDaysIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No leave requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaveRecords.map((request: any, index: number) => {
                        const startDate = new Date(request.start_date);
                        const endDate = new Date(request.end_date);
                        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        
                        return (
                          <tr key={request.id} className={`hover:bg-emerald-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                  {request.employee?.first_name?.charAt(0)}{request.employee?.last_name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {request.employee?.first_name} {request.employee?.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{request.employee?.job_title}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {request.leave_type?.replace(/_/g, ' ') || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(startDate, 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(endDate, 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {daysDiff} {daysDiff === 1 ? 'day' : 'days'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (request.status || '').toUpperCase() === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                (request.status || '').toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                (request.status || '').toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {request.status || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
