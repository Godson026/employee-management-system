import { useState, useEffect } from 'react';
import axios from 'axios';
// import { Link } from 'react-router-dom';
import LeaveApprovalsPage from './LeaveApprovalsPage'; // We'll reuse our approvals list component

// A Reusable Stat Card component
const StatCard = ({ title, value, isLoading }: { title: string, value: number, isLoading: boolean }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    {isLoading ? (
        <div className="h-8 bg-gray-200 rounded w-12 animate-pulse mt-1"></div>
    ) : (
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    )}
  </div>
);

export default function HRLeavePage() {
    const [stats, setStats] = useState({ pending: 0, approvedThisMonth: 0, rejectedThisMonth: 0, upcoming: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending Approvals');
    
    useEffect(() => {
        axios.get('http://localhost:3000/leaves/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error("Failed to load stats", err))
            .finally(() => setLoadingStats(false));
    }, []);

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'Pending Approvals':
                return <LeaveApprovalsPage />; // Reuse the component we already built!
            case 'Approved Requests':
                return <p>Approved Requests List will go here.</p>; // Placeholder
            case 'Rejected Requests':
                return <p>Rejected Requests List will go here.</p>; // Placeholder
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 p-6 sm:p-8 min-h-full">
            <h1 className="text-3xl font-bold mb-6">Leave Management</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Pending Approvals" value={stats.pending} isLoading={loadingStats} />
                <StatCard title="Approved This Month" value={stats.approvedThisMonth} isLoading={loadingStats} />
                <StatCard title="Rejected This Month" value={stats.rejectedThisMonth} isLoading={loadingStats} />
                <StatCard title="Upcoming Leaves" value={stats.upcoming} isLoading={loadingStats} />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['Pending Approvals', 'Approved Requests', 'Rejected Requests'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Active Tab Content */}
            <div className="mt-6">
                {renderActiveTab()}
            </div>
        </div>
    );
}


