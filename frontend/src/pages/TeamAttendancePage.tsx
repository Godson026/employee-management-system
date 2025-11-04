import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TeamAttendancePage() {
    const { hasRole } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<any>(null);

    const isBranchManager = hasRole(RoleName.BRANCH_MANAGER);
    const isDepartmentHead = hasRole(RoleName.DEPARTMENT_HEAD);
    const teamType = isBranchManager ? 'Branch' : isDepartmentHead ? 'Department' : 'Team';

    const fetchTeamAttendance = async () => {
        setLoading(true);
        try {
            const dateStr = selectedDate;
            
            // Fetch dashboard stats to get the accurate total employee count (already filtered by role)
            let totalEmployees = 0;
            try {
                if (isBranchManager) {
                    const statsResponse = await api.get('/dashboard/stats-for-branch-manager');
                    totalEmployees = statsResponse.data.totalEmployees || 0;
                } else if (isDepartmentHead) {
                    const statsResponse = await api.get('/dashboard/stats-for-department-head');
                    totalEmployees = statsResponse.data.totalStaff || 0;
                }
            } catch (statsErr) {
                console.warn('Could not fetch dashboard stats, will calculate from attendance records');
            }
            
            // Fetch all employees in branch/department (backend now auto-filters by role)
            // Use a high limit to get all employees
            const employeesResponse = await api.get(`/employees?limit=1000`);
            const teamEmployees = employeesResponse.data.data || employeesResponse.data || [];
            
            // Fetch attendance records for the selected date (backend already filters by role)
            const attendanceResponse = await api.get(`/attendance/team-history?startDate=${dateStr}&endDate=${dateStr}`);
            const recordsForSelectedDate = attendanceResponse.data || [];
            
            // Create a map of employee ID to attendance record for quick lookup
            const recordMap = new Map();
            recordsForSelectedDate.forEach((record: any) => {
                if (record.employee?.id) {
                    recordMap.set(record.employee.id, record);
                }
            });
            
            // Create final records - include ALL employees from the branch/department
            // For employees with attendance records for this date, use the record
            // For employees without records for this date, mark as ABSENT
            const finalRecords = teamEmployees.map((employee: any) => {
                const record = recordMap.get(employee.id);
                
                if (record) {
                    return {
                        ...record,
                        time_in: record.clock_in_time,
                        time_out: record.clock_out_time,
                        status: record.status
                    };
                } else {
                    // Employee doesn't have a record for this date - mark as ABSENT
                    return {
                        id: `absent-${employee.id}`,
                        employee: employee,
                        date: dateStr,
                        status: 'ABSENT',
                        time_in: null,
                        time_out: null,
                        clock_in_time: null,
                        clock_out_time: null
                    };
                }
            });
            
            setAttendanceRecords(finalRecords);
            
            // Calculate stats - use dashboard total if available, otherwise use teamEmployees length
            // Note: Backend returns status as 'Present', 'Absent', 'Late' (not all uppercase)
            const total = totalEmployees > 0 ? totalEmployees : teamEmployees.length;
            const present = finalRecords.filter((r: any) => {
                const status = (r.status || '').toUpperCase();
                return status === 'PRESENT' || status === 'LATE';
            }).length;
            const absent = finalRecords.filter((r: any) => {
                const status = (r.status || '').toUpperCase();
                return status === 'ABSENT';
            }).length;
            const late = finalRecords.filter((r: any) => {
                const status = (r.status || '').toUpperCase();
                return status === 'LATE';
            }).length;
            const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

            setStats({ present, absent, late, total, attendanceRate });
        } catch (err) {
            console.error('Error fetching team attendance:', err);
            toast.error('Could not load team attendance records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamAttendance();
    }, [selectedDate]);

    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md border-2";
        
        switch (status?.toUpperCase()) {
            case 'PRESENT':
                return <span className={`${baseClasses} bg-green-500 text-white border-green-600`}>PRESENT</span>;
            case 'ABSENT':
                return <span className={`${baseClasses} bg-red-500 text-white border-red-600`}>ABSENT</span>;
            case 'LATE':
                return <span className={`${baseClasses} bg-yellow-500 text-white border-yellow-600`}>LATE</span>;
            case 'ON_LEAVE':
                return <span className={`${baseClasses} bg-blue-500 text-white border-blue-600`}>ON LEAVE</span>;
            default:
                return <span className={`${baseClasses} bg-gray-500 text-white border-gray-600`}>{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
            {/* SIC Life Branded Hero Section */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
                <div className="px-4 md:px-8 py-10 md:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{teamType} Attendance</h1>
                                        <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                                    </div>
                                </div>
                                <p className="text-lg md:text-xl text-green-50 max-w-3xl leading-relaxed">
                                    Monitor and track attendance for your {teamType.toLowerCase()} employees
                                </p>
                            </div>
                            
                            {/* Date Selector */}
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                                <label className="block text-sm font-medium text-white mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-4 py-2 rounded-xl border-2 border-white/30 bg-white/10 text-white font-medium focus:outline-none focus:border-white/50 focus:ring-4 focus:ring-white/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                {/* Stats Cards - SIC Life Branded */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-8 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-700 text-sm font-bold uppercase tracking-wide">Total Employees</p>
                                    <p className="text-4xl font-extrabold text-green-900 mt-2">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-700 text-sm font-bold uppercase tracking-wide">Present</p>
                                    <p className="text-4xl font-extrabold text-emerald-900 mt-2">{stats.present}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-700 text-sm font-bold uppercase tracking-wide">Absent</p>
                                    <p className="text-4xl font-extrabold text-red-900 mt-2">{stats.absent}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-700 text-sm font-bold uppercase tracking-wide">Late</p>
                                    <p className="text-4xl font-extrabold text-yellow-900 mt-2">{stats.late}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-green-300 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-700 text-sm font-bold uppercase tracking-wide">Attendance Rate</p>
                                    <p className="text-4xl font-extrabold text-green-900 mt-2">{stats.attendanceRate}%</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Records Table - SIC Life Branded */}
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-100 overflow-hidden">
                    <div className="px-6 md:px-8 py-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b-2 border-green-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-green-900">Attendance Records</h2>
                                <p className="text-green-700 mt-1 text-sm md:text-base font-medium">
                                    {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200"></div>
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 absolute top-0 left-0"></div>
                                    </div>
                                    <span className="text-green-800 font-semibold text-lg">Loading attendance records...</span>
                                </div>
                            </div>
                        ) : attendanceRecords.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {attendanceRecords.map((record: any) => (
                                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {record.employee?.photo_url ? (
                                                            <img
                                                                src={record.employee.photo_url}
                                                                alt={`${record.employee.first_name} ${record.employee.last_name}`}
                                                                className="w-10 h-10 rounded-full object-cover mr-3"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold mr-3">
                                                                {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {record.employee?.first_name} {record.employee?.last_name}
                                                            </div>
                                                            <div className="text-sm text-slate-500">{record.employee?.job_title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {record.employee?.department?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {record.clock_in_time ? format(new Date(record.clock_in_time), 'hh:mm a') : (record.time_in ? format(new Date(record.time_in), 'hh:mm a') : '—')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {record.clock_out_time ? format(new Date(record.clock_out_time), 'hh:mm a') : (record.time_out ? format(new Date(record.time_out), 'hh:mm a') : '—')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(record.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <svg className="w-10 h-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-green-900 mb-3">No Attendance Records Found</h3>
                                <p className="text-green-700 text-base max-w-md mx-auto">No attendance records for the selected date. Select a different date to view records.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

