import { useState, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import api from '../api';
import toast from 'react-hot-toast';
import { LeaveRequest, ApprovalStatus } from '../types';
import ApprovalChainTracker from '../components/ApprovalChainTracker';
import {
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/solid';
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const calculateBusinessDays = (startDate: string, endDate: string) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const allDays = eachDayOfInterval({ start, end });
  const businessDays = allDays.filter(day => !isWeekend(day));
  return businessDays.length;
};

const getLeaveTypeColor = (type: string) => {
  const colors: any = {
    'Annual': 'bg-blue-100 text-blue-800 border-blue-200',
    'Sick': 'bg-red-100 text-red-800 border-red-200',
    'Maternity': 'bg-pink-100 text-pink-800 border-pink-200',
    'Paternity': 'bg-purple-100 text-purple-800 border-purple-200',
    'Casual': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Compassionate': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusColor = (status: string) => {
  const statusUpper = status?.toUpperCase();
  if (statusUpper === 'APPROVED') return 'bg-green-100 text-green-800 border-green-200';
  if (statusUpper === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200';
  if (statusUpper === 'PENDING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function AdminLeaveManagementPage() {
    const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [branchFilter, setBranchFilter] = useState<string>('');
    
    const fetchAllRequests = () => {
        setLoading(true);
        api.get('/leaves/team-history')
        .then(res => {
            const requests = res.data || [];
            setAllRequests(requests);
            applyFilters(requests, activeTab, searchTerm, departmentFilter, branchFilter);
        })
        .catch(() => toast.error('Could not fetch leave requests.'))
        .finally(() => setLoading(false));
    };

    const applyFilters = (
        requests: LeaveRequest[], 
        tab: string, 
        search: string, 
        dept: string, 
        branch: string
    ) => {
        let filtered = [...requests];

        // Apply status filter
        if (tab !== 'all') {
            filtered = filtered.filter(req => req.status?.toUpperCase() === tab.toUpperCase());
        }

        // Apply search filter (employee name)
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(req => {
                const fullName = `${req.employee.first_name} ${req.employee.last_name}`.toLowerCase();
                return fullName.includes(searchLower);
            });
        }

        // Apply department filter
        if (dept) {
            filtered = filtered.filter(req => (req.employee as any).department?.id === dept);
        }

        // Apply branch filter
        if (branch) {
            filtered = filtered.filter(req => (req.employee as any).branch?.id === branch);
        }

        setFilteredRequests(filtered);
    };

    useEffect(() => {
        applyFilters(allRequests, activeTab, searchTerm, departmentFilter, branchFilter);
    }, [activeTab, searchTerm, departmentFilter, branchFilter]);

    useEffect(() => {
        fetchAllRequests();
        
        const handleRefresh = () => {
            fetchAllRequests();
        };
        
        window.addEventListener('leave:refresh', handleRefresh);
        const interval = setInterval(fetchAllRequests, 30000); // Refresh every 30 seconds
        
        return () => {
            window.removeEventListener('leave:refresh', handleRefresh);
            clearInterval(interval);
        };
    }, []);

    const handleAction = async (requestId: string, status: ApprovalStatus) => {
        try {
            await api.patch(`/leaves/${requestId}/action`, { status });
            toast.success(`Request ${status} successfully!`);
            
            window.dispatchEvent(new Event('notification:refresh'));
            window.dispatchEvent(new Event('leave:refresh'));
            
            setTimeout(() => {
                window.dispatchEvent(new Event('notification:refresh'));
                window.dispatchEvent(new Event('leave:refresh'));
            }, 1000);
            
            fetchAllRequests();
        } catch(err) {
            const errorMsg = (err as any).response?.data?.message || `Failed to ${status} the request.`;
            toast.error(errorMsg);
        }
    };

    // Calculate statistics
    const stats = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status?.toUpperCase() === 'PENDING').length,
        approved: allRequests.filter(r => r.status?.toUpperCase() === 'APPROVED').length,
        rejected: allRequests.filter(r => r.status?.toUpperCase() === 'REJECTED').length,
        totalDays: allRequests.reduce((sum, req) => {
            return sum + calculateBusinessDays(req.start_date, req.end_date);
        }, 0),
        extendedLeave: allRequests.filter(req => {
            const days = calculateBusinessDays(req.start_date, req.end_date);
            return days >= 5;
        }).length,
        thisMonth: allRequests.filter(req => {
            const reqDate = parseISO(req.start_date);
            const now = new Date();
            return reqDate.getMonth() === now.getMonth() && reqDate.getFullYear() === now.getFullYear();
        }).length,
    };

    // Get unique departments and branches for filters
    const departments = Array.from(new Set(
        allRequests.map(req => (req.employee as any).department).filter(Boolean)
    )).map((dept: any) => ({ id: dept.id, name: dept.name }));

    const branches = Array.from(new Set(
        allRequests.map(req => (req.employee as any).branch).filter(Boolean)
    )).map((branch: any) => ({ id: branch.id, name: branch.name }));

    const tabs = [
        { id: 'all', label: 'All Leaves', count: stats.total, color: 'bg-blue-500' },
        { id: 'pending', label: 'Pending', count: stats.pending, color: 'bg-yellow-500' },
        { id: 'approved', label: 'Approved', count: stats.approved, color: 'bg-green-500' },
        { id: 'rejected', label: 'Rejected', count: stats.rejected, color: 'bg-red-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
            {/* SIC Life Branded Header */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
                <div className="px-4 md:px-8 py-10 md:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                                <ChartBarIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Leave Management</h1>
                                <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                                <p className="text-lg md:text-xl text-green-50 mt-2 max-w-3xl">
                                    Comprehensive overview of all leave activities across departments and branches
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Comprehensive Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Requests</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                    {stats.total}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">All time</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md">
                                <DocumentCheckIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Pending</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                    {stats.pending}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md">
                                <ClockIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Approved</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {stats.approved}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">This month: {stats.thisMonth}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                                <CheckCircleIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Rejected</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                                    {stats.rejected}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Total rejections</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                                <XCircleIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Days</p>
                                <p className="text-3xl font-extrabold mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    {stats.totalDays}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Business days requested</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
                                <CalendarDaysIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-orange-200 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Extended Leave</p>
                                <p className="text-3xl font-extrabold mt-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    {stats.extendedLeave}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">5+ business days</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md">
                                <CalendarDaysIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-green-300 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">This Month</p>
                                <p className="text-3xl font-extrabold mt-2 bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                                    {stats.thisMonth}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Requests this month</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-md">
                                <ChartBarIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Tabs */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 mb-8">
                    {/* Tabs */}
                    <div className="border-b-2 border-gray-100">
                        <div className="flex flex-wrap gap-2 px-6 pt-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        activeTab === tab.id ? 'bg-white/20' : 'bg-white'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by employee name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                            />
                        </div>

                        {/* Department Filter */}
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>

                        {/* Branch Filter */}
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                        >
                            <option value="">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Leave Requests List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                            <p className="text-gray-600 font-medium">Loading leave requests...</p>
                        </div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                            <CheckCircleIcon className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="text-xl font-bold text-gray-800 mb-2">No Leave Requests Found</p>
                        <p className="text-gray-500">
                            {activeTab === 'all' 
                                ? 'No leave requests match your current filters'
                                : `No ${activeTab} leave requests found`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredRequests.map((req) => {
                            const businessDays = calculateBusinessDays(req.start_date, req.end_date);
                            const employeeInitials = `${req.employee.first_name.charAt(0)}${req.employee.last_name.charAt(0)}`;
                            const statusUpper = req.status?.toUpperCase();
                            const isPending = statusUpper === 'PENDING';
                            
                            return (
                                <div
                                    key={req.id}
                                    className="group bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-5 border-b-2 border-green-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                {/* Employee Avatar */}
                                                {req.employee.photo_url ? (
                                                    <img
                                                        className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                                                        src={req.employee.photo_url}
                                                        alt={`${req.employee.first_name}'s photo`}
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 border-white shadow-lg">
                                                        <span className="text-white font-bold text-xl">{employeeInitials}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1">
                                                    <h3 className="text-2xl font-bold text-gray-900">
                                                        {req.employee.first_name} {req.employee.last_name}
                                                    </h3>
                                                    <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getLeaveTypeColor(req.leave_type)}`}>
                                                            {req.leave_type}
                                                        </span>
                                                        <span className="text-sm text-gray-600 font-medium">
                                                            {businessDays} business day{businessDays !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(req.status)}`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                                        {(req.employee as any).department && (
                                                            <span className="flex items-center">
                                                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                                                {(req.employee as any).department.name}
                                                            </span>
                                                        )}
                                                        {(req.employee as any).branch && (
                                                            <span className="flex items-center">
                                                                <UsersIcon className="h-4 w-4 mr-1" />
                                                                {(req.employee as any).branch.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        {/* Date Range */}
                                        <div className="mb-6">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                                                <h4 className="font-semibold text-gray-900">Leave Period</h4>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <div className="flex items-center space-x-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium uppercase">Start Date</p>
                                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                                            {format(parseISO(req.start_date), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {format(parseISO(req.start_date), 'EEEE')}
                                                        </p>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center">
                                                        <div className="w-full h-px bg-gradient-to-r from-green-200 via-green-400 to-green-200"></div>
                                                        <ArrowRightIcon className="w-5 h-5 text-green-500 mx-2" />
                                                        <div className="w-full h-px bg-gradient-to-r from-green-200 via-green-400 to-green-200"></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium uppercase">End Date</p>
                                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                                            {format(parseISO(req.end_date), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {format(parseISO(req.end_date), 'EEEE')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        {req.reason && (
                                            <div className="mb-6">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <DocumentCheckIcon className="w-5 h-5 text-green-600" />
                                                    <h4 className="font-semibold text-gray-900">Reason</h4>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                        {req.reason}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Approval Chain */}
                                        {isPending && (
                                            <div className="mb-6">
                                                <ApprovalChainTracker chain={req.approval_chain} />
                                            </div>
                                        )}

                                        {/* Action Buttons - Only show for pending requests */}
                                        {isPending && (
                                            <div className="flex items-center space-x-4 pt-6 border-t-2 border-gray-100">
                                                <button
                                                    onClick={() => handleAction(req.id, ApprovalStatus.APPROVED)}
                                                    className="flex-1 group/btn px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <span>Approve</span>
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleAction(req.id, ApprovalStatus.REJECTED)}
                                                    className="flex-1 group/btn px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        )}
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

