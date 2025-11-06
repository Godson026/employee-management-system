import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import the styles
import EditAttendanceModal from './EditAttendanceModal'; // Keep the edit modal

// Type definitions
interface AttendanceRecord {
    id: string;
    date: string;
    clock_in_time: string | null;
    clock_out_time: string | null;
    status: string;
    employee: {
        first_name: string;
        last_name: string;
    };
}

// Helper to format date to YYYY-MM-DD for the API
const toYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

export default function ManagerAttendanceView() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchRecords = () => {
        setLoading(true);
        const dateStr = toYyyyMmDd(selectedDate);
        const params = new URLSearchParams({ startDate: dateStr, endDate: dateStr }).toString();
        
        api.get(`/attendance/team-history?${params}`)
            .then(res => setRecords(res.data))
            .catch(() => toast.error(`Could not fetch attendance for ${selectedDate.toLocaleDateString()}`))
            .finally(() => setLoading(false));
    };

    // Re-fetch when the selectedDate changes
    useEffect(fetchRecords, [selectedDate]);
    
    const openEditModal = (record: AttendanceRecord) => {
        setEditingRecord(record);
        setIsEditModalOpen(true);
    };
    
    const handleSaveChanges = async (recordId: string, data: any) => {
        try {
            await api.patch(`/attendance/${recordId}`, data);
            toast.success("Attendance record updated!");
            setIsEditModalOpen(false);
            fetchRecords(); // Refresh the data
        } catch (e) {
            toast.error("Failed to update record.");
        }
    };

    // Create portal for date picker
    useEffect(() => {
        const portalDiv = document.createElement('div');
        portalDiv.id = 'datepicker-portal';
        document.body.appendChild(portalDiv);
        
        return () => {
            const existingPortal = document.getElementById('datepicker-portal');
            if (existingPortal) {
                document.body.removeChild(existingPortal);
            }
        };
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .react-datepicker-popper {
                        z-index: 9999 !important;
                        margin-top: 8px !important;
                    }
                    .react-datepicker {
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                        background: white;
                        margin-top: 8px;
                    }
                    .react-datepicker__header {
                        background: linear-gradient(135deg, #059669, #047857);
                        border-bottom: none;
                        border-radius: 12px 12px 0 0;
                        color: white;
                        padding: 12px 16px;
                    }
                    .react-datepicker__current-month {
                        color: white;
                        font-weight: 600;
                        font-size: 16px;
                        margin-bottom: 8px;
                    }
                    .react-datepicker__day-name {
                        color: white;
                        font-weight: 500;
                        font-size: 12px;
                        width: 32px;
                        line-height: 32px;
                    }
                    .react-datepicker__day {
                        border-radius: 8px;
                        margin: 2px;
                        transition: all 0.2s;
                        width: 32px;
                        height: 32px;
                        line-height: 32px;
                        font-size: 14px;
                    }
                    .react-datepicker__day:hover {
                        background-color: #10b981;
                        color: white;
                        transform: scale(1.05);
                    }
                    .react-datepicker__day--selected {
                        background-color: #10b981;
                        color: white;
                        font-weight: 600;
                    }
                    .react-datepicker__day--today {
                        background-color: #f0fdf4;
                        color: #059669;
                        font-weight: 600;
                        border: 1px solid #10b981;
                    }
                    .react-datepicker__day--outside-month {
                        color: #9ca3af;
                    }
                    .react-datepicker__navigation {
                        top: 12px;
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.1);
                        transition: all 0.2s;
                    }
                    .react-datepicker__navigation:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    .react-datepicker__navigation--previous {
                        left: 12px;
                    }
                    .react-datepicker__navigation--next {
                        right: 12px;
                    }
                    .react-datepicker__navigation-icon::before {
                        border-color: white;
                        border-width: 2px;
                    }
                    .react-datepicker__month {
                        margin: 8px;
                    }
                    .react-datepicker__week {
                        display: flex;
                        justify-content: space-between;
                    }
                `
            }} />
            <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                Team Attendance
                            </h1>
                            <p className="text-gray-600 mt-2">Review daily attendance for your team.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live Data</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 space-y-8">
                {/* Date Picker Section */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Select Date</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-semibold text-gray-700">Choose Date:</label>
                            <div className="relative">
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-lg"
                                    dateFormat="MM/dd/yyyy"
                                    popperClassName="react-datepicker-popper"
                                    popperPlacement="bottom-start"
                                    showPopperArrow={false}
                                    portalId="datepicker-portal"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="flex items-center p-6 border-b border-gray-200/50">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Team Attendance Records</h2>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading attendance records...</p>
                            </div>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No attendance records found</h3>
                            <p className="text-gray-500">No team members have recorded attendance for this date.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-In</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-Out</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((rec, index) => (
                                        <tr key={rec.id} className={`hover:bg-blue-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                                        {rec.employee.first_name?.charAt(0)}{rec.employee.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{rec.employee.first_name} {rec.employee.last_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {rec.clock_in_time ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {new Date(rec.clock_in_time).toLocaleTimeString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {rec.clock_out_time ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {new Date(rec.clock_out_time).toLocaleTimeString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md border-2 ${
                                                    rec.status?.toUpperCase() === 'PRESENT' ? 'bg-green-500 text-white border-green-600' :
                                                    rec.status?.toUpperCase() === 'LATE' ? 'bg-yellow-500 text-white border-yellow-600' :
                                                    rec.status?.toUpperCase() === 'ABSENT' ? 'bg-red-500 text-white border-red-600' :
                                                    rec.status?.toUpperCase() === 'ON LEAVE' || rec.status?.toUpperCase() === 'ON_LEAVE' ? 'bg-blue-500 text-white border-blue-600' :
                                                    'bg-gray-500 text-white border-gray-600'
                                                }`}>
                                                    {rec.status?.toUpperCase() || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => openEditModal(rec)} 
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Edit Modal */}
            <EditAttendanceModal
                record={editingRecord}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveChanges}
            />
            </div>
        </>
    );
}