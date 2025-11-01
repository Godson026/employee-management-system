import { useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // A function to re-fetch the list
}

export default function RequestLeaveModal({ isOpen, onClose, onSuccess }: RequestLeaveModalProps) {
    const [leaveType, setLeaveType] = useState('Annual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // Calculate business days (excluding weekends)
    const businessDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        
        try {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            
            if (end < start) return 0;
            
            const allDays = eachDayOfInterval({ start, end });
            const workingDays = allDays.filter(day => !isWeekend(day));
            
            return workingDays.length;
        } catch (error) {
            return 0;
        }
    }, [startDate, endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/leaves', {
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason,
            });
            toast.success('Leave request submitted successfully!');
            
            // Trigger immediate notification refresh
            window.dispatchEvent(new Event('notification:refresh'));
            
            // Trigger immediate leave request list refresh
            window.dispatchEvent(new Event('leave:refresh'));
            
            // Wait a moment for the notification to be created on the backend
            setTimeout(() => {
                window.dispatchEvent(new Event('notification:refresh'));
                window.dispatchEvent(new Event('leave:refresh'));
            }, 1000);
            
            onSuccess(); // Tell the parent page to refresh its list
            onClose();
        } catch (err) {
            console.error('Error submitting leave request:', err); // Debug log
            toast.error('Failed to submit leave request.');
        }
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Request Leave</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                        <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full mt-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Annual</option>
                            <option>Sick</option>
                            <option>Maternity</option>
                            <option>Paternity</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full mt-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full mt-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                    </div>
                    
                    {/* Business Days Calculator */}
                    {startDate && endDate && businessDays > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-500 rounded-full p-2">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Total Leave Days</p>
                                        <p className="text-xs text-gray-500">(Weekends excluded)</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-blue-600">{businessDays}</p>
                                    <p className="text-xs text-gray-500">{businessDays === 1 ? 'day' : 'days'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {startDate && endDate && businessDays === 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-yellow-800 font-medium">
                                    {endDate < startDate ? 'End date must be after start date' : 'Selected dates are weekends only'}
                                </p>
                            </div>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full mt-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium">Cancel</button>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
