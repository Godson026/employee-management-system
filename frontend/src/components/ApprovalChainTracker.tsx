import { ApprovalStep, ApprovalStatus } from "../types";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

export default function ApprovalChainTracker({ chain }: { chain: ApprovalStep[] }) {
    if (!chain || chain.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-4 flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-blue-600" />
                <span>Approval Status</span>
            </h4>
            <div className="space-y-4">
                {chain.map((step, index) => (
                    <div
                        key={index}
                        className={`relative pl-8 pb-4 ${
                            index !== chain.length - 1 ? 'border-l-2 border-blue-300' : ''
                        }`}
                    >
                        {/* Status Icon */}
                        <div className={`absolute left-0 top-0 -translate-x-1/2 p-1.5 rounded-full ${
                            step.status === ApprovalStatus.APPROVED
                                ? 'bg-green-500 border-4 border-white shadow-lg'
                                : step.status === ApprovalStatus.REJECTED
                                ? 'bg-red-500 border-4 border-white shadow-lg'
                                : 'bg-yellow-400 border-4 border-white shadow-lg'
                        }`}>
                            {step.status === ApprovalStatus.APPROVED ? (
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                            ) : step.status === ApprovalStatus.REJECTED ? (
                                <XCircleIcon className="w-4 h-4 text-white" />
                            ) : (
                                <ClockIcon className="w-4 h-4 text-white" />
                            )}
                        </div>

                        {/* Approver Info */}
                        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        {step.approverName}
                                    </h3>
                                    {step.actionedAt && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(new Date(step.actionedAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    )}
                                    {step.comments && (
                                        <p className="text-sm text-gray-600 mt-2 italic">
                                            "{step.comments}"
                                        </p>
                                    )}
                                </div>
                                
                                {/* Status Badge */}
                                <div>
                                    {step.status === ApprovalStatus.APPROVED && (
                                        <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-bold border-2 border-green-200">
                                            Approved
                                        </span>
                                    )}
                                    {step.status === ApprovalStatus.REJECTED && (
                                        <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-bold border-2 border-red-200">
                                            Rejected
                                        </span>
                                    )}
                                    {step.status === ApprovalStatus.PENDING && (
                                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border-2 border-yellow-200">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
