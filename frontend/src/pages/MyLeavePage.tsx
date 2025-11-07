import { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../contexts/SocketContext';
import LeaveRequestList from '../components/LeaveRequestList';
import RequestLeaveModal from '../components/RequestLeaveModal';

export default function MyLeavePage() {
    const [myRequests, setMyRequests] = useState([]);
    const [employeeProfile, setEmployeeProfile] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const [profileRes, requestsRes] = await Promise.all([
                api.get('/employees/my-profile'),
                api.get('/leaves/my-requests')
            ]);
            
            console.log('Employee profile loaded:', profileRes.data);
            console.log('Leave balance:', profileRes.data?.leave_balance);
            
            setEmployeeProfile(profileRes.data);
            setMyRequests(requestsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, []);

    // Socket.IO real-time updates
    const { socket } = useSocket();
    useEffect(() => {
        if (socket) {
            socket.on('leave:update', () => {
                fetchMyRequests();
            });
            
            return () => {
                socket.off('leave:update');
            };
        }
    }, [socket]);

    return (
        <div className="min-h-screen">
            {/* Enhanced Hero Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-8 py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold mb-4 text-gray-900">My Leave Requests</h1>
                                <p className="text-xl text-gray-600 max-w-2xl">
                                    Manage your time off, track leave balances, and submit new leave requests for approval.
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)} 
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                                <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Request Leave
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Leave Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-semibold">Available Balance</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {loading ? '...' : (employeeProfile?.leave_balance ?? '21')}
                                </p>
                                <p className="text-sm text-green-700">days remaining</p>
                            </div>
                            <div className="p-3 bg-green-200 rounded-xl">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-semibold">Pending Requests</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    {myRequests.filter((req: any) => req.status === 'PENDING').length}
                                </p>
                                <p className="text-sm text-blue-700">awaiting approval</p>
                            </div>
                            <div className="p-3 bg-blue-200 rounded-xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-semibold">Total Requests</p>
                                <p className="text-3xl font-bold text-purple-900">{myRequests.length}</p>
                                <p className="text-sm text-purple-700">all time</p>
                            </div>
                            <div className="p-3 bg-purple-200 rounded-xl">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leave Requests Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">Your Leave History</h2>
                        <p className="text-slate-600 mt-2">Track all your leave requests and their current status</p>
                    </div>
                    
                    <div className="p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center space-x-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="text-slate-600 font-medium">Loading your leave requests...</span>
                                </div>
                            </div>
                        ) : myRequests.length > 0 ? (
                            <LeaveRequestList requests={myRequests} />
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">No leave requests yet</h3>
                                <p className="text-slate-600 mb-6">You haven't submitted any leave requests. Click the button above to get started.</p>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Submit Your First Request
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <RequestLeaveModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchMyRequests}
            />
        </div>
    );
}