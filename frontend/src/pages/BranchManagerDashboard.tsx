import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CalendarDaysIcon,
  UserMinusIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

const KpiCard = ({ title, value, isLoading, icon: Icon, borderColor, iconGradient, onClick }: any) => (
  <div 
    className={`bg-white p-6 rounded-2xl border-2 ${borderColor} shadow-lg transition-all ${onClick ? 'hover:shadow-xl hover:scale-105 cursor-pointer' : 'hover:shadow-xl hover:scale-105'}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-700">{title}</p>
        <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
          {isLoading ? '...' : value}
        </p>
      </div>
      <div className={`p-3 bg-gradient-to-br ${iconGradient} rounded-xl shadow-md`}>
        <Icon className="h-7 w-7 text-white" />
      </div>
    </div>
  </div>
);

const PlaceholderCard = ({ title, description, icon: Icon }: any) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-green-200 p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center text-green-600 font-medium">
        <span className="text-sm font-semibold">Coming Soon</span>
        <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const LeaveRequestsCard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingRequests = () => {
    api.get('/leaves/pending-approval')
      .then(res => {
        // Get only the first 5 requests for the dashboard preview
        setRequests(res.data.slice(0, 5));
      })
      .catch(() => {
        // Silently fail - don't show error toast on every poll
        if (!loading) {
          console.error("Could not load pending leave requests");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingRequests();
    
    // Listen for custom events to trigger immediate refresh
    const handleRefresh = () => {
      fetchPendingRequests();
    };
    
    window.addEventListener('leave:refresh', handleRefresh);
    
    // Poll for updates every 10 seconds for real-time updates
    const interval = setInterval(fetchPendingRequests, 10000);
    
    return () => {
      window.removeEventListener('leave:refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const calculateDays = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const allDays = eachDayOfInterval({ start, end });
    const businessDays = allDays.filter(day => !isWeekend(day));
    return businessDays.length;
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: any = {
      'Annual': 'bg-blue-100 text-blue-700',
      'Sick': 'bg-red-100 text-red-700',
      'Maternity': 'bg-pink-100 text-pink-700',
      'Paternity': 'bg-purple-100 text-purple-700',
      'Casual': 'bg-yellow-100 text-yellow-700',
      'Compassionate': 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-green-200 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Leave Requests — Branch Staff</h2>
          </div>
          <button
            onClick={() => navigate('/leave/approvals')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span>View All</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-xl"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No pending leave requests</p>
            <p className="text-gray-400 text-sm mt-2">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request: any) => (
              <div
                key={request.id}
                onClick={() => navigate('/leave/approvals')}
                className="group/item flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] border border-gray-100 hover:border-green-300"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Employee Photo */}
                  <div className="flex-shrink-0">
                    {request.employee?.photo_url ? (
                      <img
                        src={request.employee.photo_url}
                        alt={`${request.employee.first_name} ${request.employee.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                      </div>
                    )}
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {request.employee?.first_name} {request.employee?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {request.employee?.job_title} • {request.employee?.department?.name || 'N/A'}
                    </p>
                  </div>

                  {/* Leave Details */}
                  <div className="hidden md:flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(request.leave_type)}`}>
                      {request.leave_type}
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">{calculateDays(request.start_date, request.end_date)} days</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(request.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover/item:text-green-600 group-hover/item:translate-x-1 transition-all duration-300 ml-4" />
              </div>
            ))}

            {/* Show more indicator if there are more than 5 requests */}
            {requests.length >= 5 && (
              <button
                onClick={() => navigate('/leave/approvals')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl font-semibold hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border-2 border-green-200 hover:border-green-300"
              >
                View All Pending Requests
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function BranchManagerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = () => {
      api.get('/dashboard/stats-for-branch-manager')
        .then(res => setStats(res.data))
        .catch(() => {
          if (loading) {
            toast.error("Could not load your branch dashboard data.");
          }
        })
        .finally(() => setLoading(false));
    };
    
    fetchDashboardStats();
    
    // Listen for custom events to refresh stats when leave requests change
    const handleRefresh = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('leave:refresh', handleRefresh);
    
    // Poll for stats updates every 10 seconds
    const interval = setInterval(fetchDashboardStats, 10000);
    
    return () => {
      window.removeEventListener('leave:refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* SIC Life Branded Hero Section */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                <BuildingOfficeIcon className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Branch Dashboard</h1>
                <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                <p className="text-lg md:text-xl text-green-50 mt-2 max-w-3xl">
                  Here's what's happening at your branch today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* KPI Cards Grid - SIC Life Branded */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8 animate-fade-in">
          <KpiCard 
            title="Total Employees" 
            value={stats?.totalEmployees} 
            isLoading={loading}
            icon={UsersIcon}
            borderColor="border-green-200"
            iconGradient="from-green-500 to-emerald-600"
          />
          <KpiCard 
            title="Attendance Rate Today" 
            value={`${stats?.attendanceRateToday ?? 0}%`} 
            isLoading={loading}
            icon={ChartBarIcon}
            borderColor="border-green-300"
            iconGradient="from-green-500 to-emerald-600"
          />
          <KpiCard 
            title="On Leave Today" 
            value={stats?.onLeaveToday ?? 0} 
            isLoading={loading}
            icon={CalendarDaysIcon}
            borderColor="border-green-200"
            iconGradient="from-green-500 to-emerald-600"
            onClick={() => navigate('/team-leave?view=on-leave&date=' + new Date().toISOString().split('T')[0])}
          />
          <KpiCard 
            title="Absent Today" 
            value={stats?.absentToday ?? 0} 
            isLoading={loading}
            icon={UserMinusIcon}
            borderColor="border-orange-200"
            iconGradient="from-orange-500 to-red-600"
          />
          <KpiCard 
            title="Active Departments" 
            value={stats?.activeDepartments ?? 0} 
            isLoading={loading}
            icon={BuildingOfficeIcon}
            borderColor="border-blue-200"
            iconGradient="from-blue-500 to-indigo-600"
          />
          <KpiCard 
            title="Pending Leave Requests" 
            value={stats?.pendingLeaveRequests ?? 0} 
            isLoading={loading}
            icon={DocumentTextIcon}
            borderColor="border-purple-200"
            iconGradient="from-purple-500 to-pink-600"
          />
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PlaceholderCard
            title="Today's Attendance Overview"
            description="A detailed table of attendance records from all departments in your branch will appear here. Track real-time attendance patterns and identify trends across your branch."
            icon={ClockIcon}
          />
          
          <LeaveRequestsCard />
        </div>
      </div>
    </div>
  );
}
