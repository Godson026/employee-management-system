import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import api from '../api';
import toast from 'react-hot-toast';
import LeaveRequestList from '../components/LeaveRequestList';
import { parseISO, eachDayOfInterval, isWeekend, format } from 'date-fns';

export default function TeamLeavePage() {
    const { hasRole } = useAuth();
    const [teamRequests, setTeamRequests] = useState([]);
    const [employeesOnLeave, setEmployeesOnLeave] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const isBranchManager = hasRole(RoleName.BRANCH_MANAGER);
    const isDepartmentHead = hasRole(RoleName.DEPARTMENT_HEAD);
    const teamType = isBranchManager ? 'Branch' : isDepartmentHead ? 'Department' : 'Team';

    const fetchTeamLeaveRequests = async () => {
        setLoading(true);
        try {
            // Fetch ALL leave requests (not just pending) for the team
            const response = await api.get('/leaves/team-history');
            console.log('Team leave requests:', response.data);
            console.log('Statuses:', response.data.map((r: any) => r.status));
            setTeamRequests(response.data);
            
            // Calculate stats (case-insensitive)
            const total = response.data.length;
            const pending = response.data.filter((r: any) => r.status?.toUpperCase() === 'PENDING').length;
            const approved = response.data.filter((r: any) => r.status?.toUpperCase() === 'APPROVED').length;
            const rejected = response.data.filter((r: any) => r.status?.toUpperCase() === 'REJECTED').length;
            
            console.log('Stats:', { total, pending, approved, rejected });
            
            // Calculate total days requested
            const totalDays = response.data.reduce((sum: number, req: any) => {
                const start = parseISO(req.start_date);
                const end = parseISO(req.end_date);
                const allDays = eachDayOfInterval({ start, end });
                const businessDays = allDays.filter(day => !isWeekend(day));
                return sum + businessDays.length;
            }, 0);

            setStats({ total, pending, approved, rejected, totalDays });
        } catch (err) {
            console.error('Error fetching team leave requests:', err);
            toast.error('Could not load team leave requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeesOnLeave = async (date: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/leaves/on-leave?date=${date}`);
            setEmployeesOnLeave(response.data || []);
        } catch (err: any) {
            console.error('Error fetching employees on leave:', err);
            toast.error(err?.response?.data?.message || 'Could not load employees on leave');
            setEmployeesOnLeave([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            try {
                // Always fetch leave requests
                await fetchTeamLeaveRequests();
                // Always fetch employees on leave for today
                await fetchEmployeesOnLeave(new Date().toISOString().split('T')[0]);
            } catch (error) {
                console.error('Error loading data:', error);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        loadData();
        
        // Listen for custom events to trigger immediate refresh
        const handleRefresh = () => {
            if (isMounted) {
                fetchTeamLeaveRequests();
                fetchEmployeesOnLeave(new Date().toISOString().split('T')[0]);
            }
        };
        
        window.addEventListener('leave:refresh', handleRefresh);
        
        // Poll for updates every 10 seconds
        const interval = setInterval(handleRefresh, 10000);
        
        return () => {
            isMounted = false;
            window.removeEventListener('leave:refresh', handleRefresh);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                                            {teamType} Leave Requests
                                        </h1>
                                        <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                                    </div>
                                </div>
                                <p className="text-lg md:text-xl text-green-50 max-w-3xl leading-relaxed">
                                    Monitor and manage leave requests from your {teamType.toLowerCase()} employees
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Stats Cards - SIC Life Branded */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-8 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-700 text-sm font-bold uppercase tracking-wide">Total Requests</p>
                                    <p className="text-4xl font-extrabold text-green-900 mt-2">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-700 text-sm font-bold uppercase tracking-wide">Pending</p>
                                    <p className="text-4xl font-extrabold text-yellow-900 mt-2">{stats.pending}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-700 text-sm font-bold uppercase tracking-wide">Approved</p>
                                    <p className="text-4xl font-extrabold text-emerald-900 mt-2">{stats.approved}</p>
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
                                    <p className="text-red-700 text-sm font-bold uppercase tracking-wide">Rejected</p>
                                    <p className="text-4xl font-extrabold text-red-900 mt-2">{stats.rejected}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border-2 border-green-300 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-700 text-sm font-bold uppercase tracking-wide">Total Days</p>
                                    <p className="text-4xl font-extrabold text-green-900 mt-2">{stats.totalDays}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-md">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Employees on Leave Today Section */}
                {employeesOnLeave.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 overflow-hidden mb-8">
                        <div className="px-6 md:px-8 py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b-2 border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900">Employees on Leave Today</h2>
                                        <p className="text-blue-700 mt-1 text-sm md:text-base font-medium">
                                            {employeesOnLeave.length} {employeesOnLeave.length === 1 ? 'employee' : 'employees'} from your {teamType.toLowerCase()} {employeesOnLeave.length === 1 ? 'is' : 'are'} currently on leave
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {employeesOnLeave.map((request: any) => (
                                            <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {request.employee?.photo_url ? (
                                                            <img
                                                                src={request.employee.photo_url}
                                                                alt={`${request.employee.first_name} ${request.employee.last_name}`}
                                                                className="w-10 h-10 rounded-full object-cover mr-3"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                                                                {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {request.employee?.first_name} {request.employee?.last_name}
                                                            </div>
                                                            <div className="text-sm text-slate-500">{request.employee?.job_title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {request.employee?.department?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 capitalize">
                                                    {request.leave_type.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {format(new Date(request.start_date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Requests Table - SIC Life Branded */}
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-100 overflow-hidden">
                    <div className="px-6 md:px-8 py-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b-2 border-green-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-green-900">{teamType} Leave History</h2>
                                <p className="text-green-700 mt-1 text-sm md:text-base font-medium">All leave requests from your {teamType.toLowerCase()} employees</p>
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
                                    <span className="text-green-800 font-semibold text-lg">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            teamRequests.length > 0 ? (
                                <LeaveRequestList requests={teamRequests} />
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <svg className="w-10 h-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-green-900 mb-3">No Leave Requests Found</h3>
                                    <p className="text-green-700 text-base max-w-md mx-auto">Your {teamType.toLowerCase()} has no leave requests yet. When employees submit leave requests, they will appear here.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

