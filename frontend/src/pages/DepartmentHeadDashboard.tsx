import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const KpiCard = ({ title, value, isLoading, icon, gradient, onClick }: any) => (
    <div 
        className={`bg-white p-6 rounded-2xl border-2 ${gradient} shadow-lg transition-all ${onClick ? 'hover:shadow-xl hover:scale-105 cursor-pointer' : 'hover:shadow-xl hover:scale-105'}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">{title}</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    {isLoading ? '...' : value}
                </p>
            </div>
            <div className={`p-3 bg-gradient-to-br ${icon} rounded-xl shadow-md`}>
                {icon === 'from-green-500 to-emerald-600' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                )}
                {icon === 'from-blue-500 to-indigo-600' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                )}
                {icon === 'from-purple-500 to-pink-600' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                )}
                {icon === 'from-orange-500 to-red-600' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                )}
            </div>
        </div>
    </div>
);

const AttendanceRow = ({ record }: { record: any }) => {
    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md border-2";
        
        switch (status?.toUpperCase()) {
            case 'PRESENT':
                return <span className={`${baseClasses} bg-green-500 text-white border-green-600`}>PRESENT</span>;
            case 'ABSENT':
                return <span className={`${baseClasses} bg-red-500 text-white border-red-600`}>ABSENT</span>;
            case 'LATE':
                return <span className={`${baseClasses} bg-yellow-500 text-white border-yellow-600`}>LATE</span>;
            default:
                return <span className={`${baseClasses} bg-gray-500 text-white border-gray-600`}>{status}</span>;
        }
    };

    return (
        <tr className="hover:bg-green-50 transition-colors border-b border-gray-100">
            <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
                    </div>
                    <span className="font-medium text-gray-900">
                        {record.employee.first_name} {record.employee.last_name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-gray-700">
                {record.clock_in_time ? format(new Date(record.clock_in_time), 'hh:mm a') : '-'}
            </td>
            <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
        </tr>
    );
};

const LeaveRequestRow = ({ request }: { request: any }) => (
    <tr className="hover:bg-green-50 transition-colors border-b border-gray-100">
        <td className="px-4 py-3">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                </div>
                <span className="font-medium text-gray-900">
                    {request.employee.first_name} {request.employee.last_name}
                </span>
            </div>
        </td>
        <td className="px-4 py-3 text-gray-700">{request.leave_type}</td>
        <td className="px-4 py-3 text-gray-700">{format(new Date(request.start_date), 'MMM dd, yyyy')}</td>
        <td className="px-4 py-3">
            <Link 
                to="/leave/approvals" 
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Review
            </Link>
        </td>
    </tr>
);

export default function DepartmentHeadDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [statsRes, attendanceRes, leavesRes] = await Promise.all([
                api.get('/dashboard/stats-for-department-head'),
                api.get(`/attendance/team-history?startDate=${today}&endDate=${today}`),
                api.get('/leaves/pending-approval'),
            ]);

            setStats(statsRes.data);
            setAttendance(attendanceRes.data);
            setPendingLeaves(leavesRes.data);

        } catch {
            toast.error("Could not load all dashboard data.");
        } finally {
            setLoading(false);
        }
    };
    
    fetchDashboardData();
    
    // Listen for custom events to trigger immediate refresh
    const handleRefresh = () => {
        fetchDashboardData();
    };
    
    window.addEventListener('leave:refresh', handleRefresh);
    
    // Poll for updates every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => {
        window.removeEventListener('leave:refresh', handleRefresh);
        clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        {/* SIC Life Branded Hero Section */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
            <div className="px-4 md:px-8 py-10 md:py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Department Dashboard</h1>
                            <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                        </div>
                    </div>
                    <p className="text-lg md:text-xl text-green-50 mt-4 max-w-3xl leading-relaxed">
                        Here's what's happening in your department today.
                    </p>
                </div>
            </div>
        </div>
      
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 animate-fade-in">
                <KpiCard 
                    title="Total Staff" 
                    value={stats?.totalStaff} 
                    isLoading={loading} 
                    icon="from-green-500 to-emerald-600" 
                    gradient="border-green-200" 
                />
                <KpiCard 
                    title="Active Branches" 
                    value={stats?.activeBranches} 
                    isLoading={loading} 
                    icon="from-blue-500 to-indigo-600" 
                    gradient="border-blue-200" 
                />
                <KpiCard 
                    title="Attendance Rate" 
                    value={`${stats?.attendanceRateToday || 0}%`} 
                    isLoading={loading} 
                    icon="from-purple-500 to-pink-600" 
                    gradient="border-purple-200" 
                />
                <KpiCard 
                    title="On Leave Today" 
                    value={stats?.onLeaveToday} 
                    isLoading={loading} 
                    icon="from-orange-500 to-red-600" 
                    gradient="border-orange-200"
                    onClick={() => navigate('/team-leave?view=on-leave&date=' + new Date().toISOString().split('T')[0])}
                />
            </div>

            {/* Main Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Today's Attendance */}
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-100 overflow-hidden">
                    <div className="px-6 py-5 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b-2 border-green-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-extrabold text-green-900">Today's Attendance</h2>
                                <p className="text-green-700 text-sm font-medium">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200"></div>
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 absolute top-0 left-0"></div>
                                    </div>
                                    <span className="text-green-800 font-semibold">Loading...</span>
                                </div>
                            </div>
                        ) : attendance.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employee</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Clock-In</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {attendance.slice(0, 5).map(rec => <AttendanceRow key={rec.id} record={rec} />)}
                                    </tbody>
                                </table>
                                {attendance.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <Link 
                                            to="/attendance" 
                                            className="text-green-700 font-semibold hover:text-green-800 inline-flex items-center"
                                        >
                                            View All ({attendance.length})
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                                    <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-green-900 mb-2">No Records Yet</h3>
                                <p className="text-green-700">No attendance records for today.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Pending Leave Requests */}
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-100 overflow-hidden">
                    <div className="px-6 py-5 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b-2 border-green-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-extrabold text-green-900">Pending Leave Requests</h2>
                                <p className="text-green-700 text-sm font-medium">Awaiting your approval</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200"></div>
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 absolute top-0 left-0"></div>
                                    </div>
                                    <span className="text-green-800 font-semibold">Loading...</span>
                                </div>
                            </div>
                        ) : pendingLeaves.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employee</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Start Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {pendingLeaves.slice(0, 5).map(req => <LeaveRequestRow key={req.id} request={req} />)}
                                    </tbody>
                                </table>
                                {pendingLeaves.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <Link 
                                            to="/leave/approvals" 
                                            className="text-green-700 font-semibold hover:text-green-800 inline-flex items-center"
                                        >
                                            View All ({pendingLeaves.length})
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                                    <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-green-900 mb-2">All Caught Up!</h3>
                                <p className="text-green-700">No pending leave requests for your team.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}