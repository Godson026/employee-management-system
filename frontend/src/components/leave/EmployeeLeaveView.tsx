import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { LeaveRequest } from '../../types';
import LeaveRequestList from '../LeaveRequestList';
import RequestLeaveModal from '../RequestLeaveModal';

const StatCard = ({ title, value, isLoading }: any) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    {isLoading ? (
        <div className="h-8 bg-gray-200 rounded-md w-12 animate-pulse mt-1"></div>
    ) : (
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    )}
  </div>
);

export default function EmployeeLeaveView() {
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [employeeProfile, setEmployeeProfile] = useState<any>(null); // State for the employee profile
    const [, setAllEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Add aggressive cache-busting with timestamp parameter
            const timestamp = Date.now();
            const profilePromise = api.get(`/employees/my-profile?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            const requestsPromise = api.get('/leaves/my-requests');

            const [profileRes, requestsRes] = await Promise.all([
                profilePromise,
                requestsPromise
            ]);
            
            console.log('=== EMPLOYEE PROFILE DEBUG ===');
            console.log('Full profile response:', profileRes.data);
            console.log('Leave balance value:', profileRes.data?.leave_balance);
            console.log('Leave balance type:', typeof profileRes.data?.leave_balance);
            console.log('All profile keys:', Object.keys(profileRes.data || {}));
            console.log('=============================');
            
            console.log('=== LEAVE REQUESTS DEBUG ===');
            console.log('All requests:', requestsRes.data);
            console.log('Number of requests:', requestsRes.data?.length);
            console.log('Request statuses:', requestsRes.data?.map((r: any) => ({ id: r.id, status: r.status, type: typeof r.status })));
            console.log('=============================');
            
            setEmployeeProfile(profileRes.data);
            setMyRequests(requestsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err); // Debug log
            toast.error("Could not load your leave information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Force refresh on component mount
        fetchData();
        // This is for the 'select approver' dropdown in the modal
        api.get('/employees?limit=1000').then(res => setAllEmployees(res.data.data));
        
        // Listen for custom events to trigger immediate refresh
        const handleRefresh = () => {
            fetchData();
        };
        
        window.addEventListener('leave:refresh', handleRefresh);
        
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchData, 10000);
        
        return () => {
            window.removeEventListener('leave:refresh', handleRefresh);
            clearInterval(interval);
        };
    }, []);

    // Force refresh when component becomes visible (handles browser back/forward)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchData();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const leaveBalance = employeeProfile?.leave_balance;
    const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
    
    console.log('=== PENDING COUNT CALCULATION ===');
    console.log('Total requests:', myRequests.length);
    console.log('Pending requests:', pendingRequests);
    console.log('All statuses:', myRequests.map(r => r.status));
    console.log('=================================');

    return (
        <div className="bg-gray-50 p-6 sm:p-8 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">My Leave</h1>
                    <p className="text-gray-600 mt-1">Manage your leave requests and balances.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    + Request Leave
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <StatCard title="Available Balance" value={`${leaveBalance ?? '...'} days`} isLoading={loading} />
                <StatCard title="Pending Requests" value={pendingRequests} isLoading={loading} />
                <StatCard title="Request History" value={`${myRequests.length} total`} isLoading={loading} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Your Leave History</h2>
                {!loading && myRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">You haven't submitted any leave requests yet.</p>
                        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
                            + Submit Your First Request
                        </button>
                    </div>
                ) : (
                    <LeaveRequestList requests={myRequests} />
                )}
            </div>
            
            <RequestLeaveModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}