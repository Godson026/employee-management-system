import { useState } from 'react';
import { LeaveRequest } from "../types"; // Use shared type
import ApprovalChainTracker from './ApprovalChainTracker'; // Import our new component
import { parseISO, eachDayOfInterval, isWeekend, format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
        case 'approved':
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
        case 'rejected':
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
        case 'pending':
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const LeaveRequestRow = ({ request }: { request: LeaveRequest }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Calculate business days
    const calculateBusinessDays = () => {
        const start = parseISO(request.start_date);
        const end = parseISO(request.end_date);
        const allDays = eachDayOfInterval({ start, end });
        const businessDays = allDays.filter(day => !isWeekend(day));
        return businessDays.length;
    };

    const businessDays = calculateBusinessDays();
    
    // Get leave type color
    const getLeaveTypeColor = (type: string) => {
        const colors: any = {
            'Annual': 'bg-blue-500',
            'Sick': 'bg-red-500',
            'Maternity': 'bg-pink-500',
            'Paternity': 'bg-purple-500',
            'Casual': 'bg-yellow-500',
            'Compassionate': 'bg-gray-500',
        };
        return colors[type] || 'bg-blue-500';
    };

    return (
        <>
            <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            {request.employee?.photo_url ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={request.employee.photo_url} alt="" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                                {request.employee?.first_name} {request.employee?.last_name}
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">{request.leave_type}</td>
                <td className="px-6 py-4 text-slate-700">
                    {format(parseISO(request.start_date), 'MMM dd, yyyy')} - {format(parseISO(request.end_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4"><StatusBadge status={request.status} /></td>
                <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                        {isExpanded ? (
                            <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Hide Details
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                View Details
                            </>
                        )}
                    </button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gradient-to-br from-slate-50 to-blue-50">
                    <td colSpan={5} className="px-6 py-8">
                        <div className="max-w-6xl mx-auto">
                            {/* Header Section */}
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 ${getLeaveTypeColor(request.leave_type)} rounded-xl shadow-lg`}>
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">{request.leave_type} Leave</h3>
                                        <p className="text-sm text-slate-600 mt-1">Request ID: {request.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={request.status} />
                                    {request.actioned_at && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Updated: {format(parseISO(request.actioned_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Leave Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Duration Card */}
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-slate-600 uppercase">Duration</h4>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-baseline space-x-2">
                                            <p className="text-4xl font-bold text-slate-900">{businessDays}</p>
                                            <p className="text-sm text-slate-500">{businessDays === 1 ? 'day' : 'days'}</p>
                                        </div>
                                        <p className="text-xs text-slate-500">Business days (weekends excluded)</p>
                                    </div>
                                </div>

                                {/* Start Date Card */}
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-slate-600 uppercase">Start Date</h4>
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{format(parseISO(request.start_date), 'MMM dd')}</p>
                                        <p className="text-sm text-slate-500">{format(parseISO(request.start_date), 'EEEE, yyyy')}</p>
                                    </div>
                                </div>

                                {/* End Date Card */}
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-slate-600 uppercase">End Date</h4>
                                        <div className="p-2 bg-rose-100 rounded-lg">
                                            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{format(parseISO(request.end_date), 'MMM dd')}</p>
                                        <p className="text-sm text-slate-500">{format(parseISO(request.end_date), 'EEEE, yyyy')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason Section */}
                            {request.reason && (
                                <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-8">
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-slate-600 uppercase mb-2">Reason for Leave</h4>
                                            <p className="text-slate-700 leading-relaxed">{request.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Approval Chain Section */}
                            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Approval Workflow
                                </h4>
                                <ApprovalChainTracker chain={request.approval_chain} />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default function LeaveRequestList({ requests }: { requests: LeaveRequest[] }) {
    return (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Details</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map(req => <LeaveRequestRow key={req.id} request={req} />)}
                </tbody>
            </table>
        </div>
    );
}