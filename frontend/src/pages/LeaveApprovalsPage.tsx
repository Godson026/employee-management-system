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
  UserCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

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

export default function LeaveApprovalsPage() {
    const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPendingRequests = () => {
        setLoading(true);
        api.get('/leaves/pending-approval')
        .then(res => setPendingRequests(res.data))
        .catch(() => toast.error('Could not fetch pending requests.'))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPendingRequests();
        
        // Listen for custom events to trigger immediate refresh
        const handleRefresh = () => {
            fetchPendingRequests();
        };
        
        window.addEventListener('leave:refresh', handleRefresh);
        
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchPendingRequests, 10000);
        
        return () => {
            window.removeEventListener('leave:refresh', handleRefresh);
            clearInterval(interval);
        };
    }, []);

    const handleAction = async (requestId: string, status: ApprovalStatus) => {
        try {
            await api.patch(`/leaves/${requestId}/action`, { status });
            toast.success(`Request ${status} successfully!`);
            
            // Trigger immediate notification refresh for both the approver and the requester
            window.dispatchEvent(new Event('notification:refresh'));
            
            // Trigger immediate leave request list refresh
            window.dispatchEvent(new Event('leave:refresh'));
            
            // Wait a moment for the notification to be created on the backend
            setTimeout(() => {
                window.dispatchEvent(new Event('notification:refresh'));
                window.dispatchEvent(new Event('leave:refresh'));
            }, 1000);
            
            fetchPendingRequests(); // Refresh the list after an action is taken
        } catch(err) {
            const errorMsg = (err as any).response?.data?.message || `Failed to ${status} the request.`;
            toast.error(errorMsg);
        }
    };

    const totalPending = pendingRequests.length;
    const urgentRequests = pendingRequests.filter(req => {
      const days = calculateBusinessDays(req.start_date, req.end_date);
      return days >= 5; // Consider 5+ days as urgent
    }).length;

    return (
        <div className="min-h-screen bg-white">
            {/* SIC Life Branded Header */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
                <div className="px-4 md:px-8 py-10 md:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                                <DocumentCheckIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Pending Leave Approvals</h1>
                                <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                                <p className="text-lg md:text-xl text-green-50 mt-2 max-w-3xl">
                                    Review and approve leave requests from your team members
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Pending</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                    {totalPending}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md">
                                <ClockIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-orange-200 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Extended Leave</p>
                                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    {urgentRequests}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">5+ business days</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md">
                                <CalendarDaysIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leave Requests List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                            <p className="text-gray-600 font-medium">Loading pending requests...</p>
                        </div>
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                            <CheckCircleIcon className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="text-xl font-bold text-gray-800 mb-2">All Clear!</p>
                        <p className="text-gray-500">There are no pending leave requests for your team</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingRequests.map((req) => {
                            const businessDays = calculateBusinessDays(req.start_date, req.end_date);
                            const employeeInitials = `${req.employee.first_name.charAt(0)}${req.employee.last_name.charAt(0)}`;
                            
                            return (
                                <div
                                    key={req.id}
                                    className="group bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-5 border-b-2 border-green-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-4">
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
                                                
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900">
                                                        {req.employee.first_name} {req.employee.last_name}
                                                    </h3>
                                                    <div className="flex items-center space-x-3 mt-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getLeaveTypeColor(req.leave_type)}`}>
                                                            {req.leave_type}
                                                        </span>
                                                        <span className="text-sm text-gray-600 font-medium">
                                                            {businessDays} business day{businessDays !== 1 ? 's' : ''}
                                                        </span>
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
                                        <div className="mb-6">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <UserCircleIcon className="w-5 h-5 text-green-600" />
                                                <h4 className="font-semibold text-gray-900">Reason</h4>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {req.reason || <span className="italic text-gray-400">No reason provided</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Approval Chain */}
                                        <div className="mb-6">
                                            <ApprovalChainTracker chain={req.approval_chain} />
                                        </div>

                                        {/* Action Buttons */}
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
