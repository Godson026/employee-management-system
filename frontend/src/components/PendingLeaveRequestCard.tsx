import { LeaveRequest, ApprovalStatus } from '../types';

interface ActionHandler {
    (requestId: string, action: ApprovalStatus): void;
}

export default function PendingLeaveRequestCard({ request, onAction }: { request: LeaveRequest, onAction: ActionHandler }) {
    
    return (
        <li className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg shadow mb-4">
            <div className="flex items-center">
                 <img className="h-12 w-12 rounded-full object-cover" src={request.employee.photo_url || ''} alt="" />
                 <div className="ml-4">
                     <p className="font-semibold text-gray-900">{request.employee.first_name} {request.employee.last_name}</p>
                     <p className="text-sm text-gray-500">{request.leave_type}: {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}</p>
                 </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 shrink-0">
                <button onClick={() => onAction(request.id, ApprovalStatus.APPROVED)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Approve</button>
                <button onClick={() => onAction(request.id, ApprovalStatus.REJECTED)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                 <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">View Details</button>
            </div>
        </li>
    );
}
