import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon,
  DocumentCheckIcon,
  BellIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  QrCodeIcon,
} from '@heroicons/react/24/solid';
import GenderRatioChart from '../components/GenderRatioChart';

interface DashboardStats {
    totalEmployees: number;
    totalDepartments: number;
    totalBranches: number;
    activeEmployees: number;
}

interface ExtendedDashboardStats extends DashboardStats {
    unreadNotifications: number;
    activeAnnouncements: number;
    pendingLeaveApprovals: number;
}

const StatCard = ({ 
    title, 
    value, 
    isLoading, 
    icon, 
    gradient,
    borderColor,
    link 
}: { 
    title: string, 
    value: number | undefined, 
    isLoading: boolean,
    icon: React.ReactNode,
    gradient: string,
    borderColor: string,
    link?: string
}) => {
    const cardContent = (
        <div className={`bg-white rounded-2xl shadow-lg border-2 ${borderColor} p-6 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-2">{title}</h3>
                    {isLoading ? (
                        <div className="h-10 bg-gray-200 rounded-xl w-20 animate-pulse mt-3"></div>
                    ) : (
                        <p className={`mt-2 text-4xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                            {value?.toLocaleString() || 0}
                        </p>
                    )}
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="w-8 h-8 text-white">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );

    if (link) {
        return (
            <Link to={link} className="block">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    link, 
    gradient,
    borderColor,
    badge
}: { 
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    link: string,
    gradient: string,
    borderColor: string,
    badge?: number
}) => (
    <Link to={link} className="block group">
        <div className={`bg-white rounded-2xl shadow-lg border-2 ${borderColor} p-6 hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1 relative`}>
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {badge}
                </div>
            )}
            <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0`}>
                    <div className="w-6 h-6 text-white">
                        {icon}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
                </div>
                <svg className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    </Link>
);

export default function AdminDashboard() {
    const { hasRole } = useAuth();
    const [stats, setStats] = useState<ExtendedDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Determine dashboard title and description based on role
    const isHRManager = hasRole(RoleName.HR_MANAGER);
    const dashboardTitle = isHRManager ? 'HR Manager Dashboard' : 'Admin Dashboard';
    const dashboardDescription = isHRManager 
        ? 'Manage human resources, employee data, and organizational policies.'
        : 'Comprehensive overview of your organization\'s performance, employee management, and operational insights.';

    const fetchDashboardData = async () => {
        try {
            const [statsRes, notificationsRes, announcementsRes, leavesRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
                api.get('/announcements/active').catch(() => ({ data: [] })),
                api.get('/leaves/pending-approval').catch(() => ({ data: [] }))
            ]);

            setStats({
                ...statsRes.data,
                unreadNotifications: notificationsRes.data.count || 0,
                activeAnnouncements: announcementsRes.data.length || 0,
                pendingLeaveApprovals: leavesRes.data.length || 0,
            });
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Listen for custom events to trigger immediate refresh
        const handleRefresh = () => {
            fetchDashboardData();
        };

        window.addEventListener('notification:refresh', handleRefresh);
        window.addEventListener('leave:refresh', handleRefresh);
        
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchDashboardData, 10000);

        return () => {
            window.removeEventListener('notification:refresh', handleRefresh);
            window.removeEventListener('leave:refresh', handleRefresh);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* SIC Life Branded Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 md:px-8 py-10 md:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                                    <ChartBarIcon className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">{dashboardTitle}</h1>
                                    <p className="text-emerald-600 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                                    <p className="text-lg md:text-xl text-gray-600 mt-2 max-w-3xl">
                                        {dashboardDescription}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-200">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-emerald-700">Live Data</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Statistics Grid */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center mb-6 md:mb-8">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <ChartBarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Organization Overview</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard 
                            title="Total Employees" 
                            value={stats?.totalEmployees} 
                            isLoading={loading}
                            icon={<UserGroupIcon />}
                            gradient="from-blue-500 to-indigo-600"
                            borderColor="border-blue-200"
                            link="/employees"
                        />
                        <StatCard 
                            title="Departments" 
                            value={stats?.totalDepartments} 
                            isLoading={loading}
                            icon={<BuildingOffice2Icon />}
                            gradient="from-green-500 to-emerald-600"
                            borderColor="border-green-200"
                            link="/departments"
                        />
                        <StatCard 
                            title="Branches" 
                            value={stats?.totalBranches} 
                            isLoading={loading}
                            icon={<MapPinIcon />}
                            gradient="from-purple-500 to-pink-600"
                            borderColor="border-purple-200"
                            link="/branches"
                        />
                        <StatCard 
                            title="Active Employees" 
                            value={stats?.activeEmployees} 
                            isLoading={loading}
                            icon={<CheckCircleIcon />}
                            gradient="from-orange-500 to-red-600"
                            borderColor="border-orange-200"
                        />
                    </div>
                </div>

                {/* Activity Metrics */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center mb-6 md:mb-8">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <BellIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Activity Metrics</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <StatCard 
                            title="Unread Notifications" 
                            value={stats?.unreadNotifications} 
                            isLoading={loading}
                            icon={<BellIcon />}
                            gradient="from-yellow-500 to-orange-600"
                            borderColor="border-yellow-200"
                            link="/notifications"
                        />
                        <StatCard 
                            title="Active Announcements" 
                            value={stats?.activeAnnouncements} 
                            isLoading={loading}
                            icon={<MegaphoneIcon />}
                            gradient="from-cyan-500 to-blue-600"
                            borderColor="border-cyan-200"
                            link="/announcements"
                        />
                        <StatCard 
                            title="Pending Approvals" 
                            value={stats?.pendingLeaveApprovals} 
                            isLoading={loading}
                            icon={<DocumentCheckIcon />}
                            gradient="from-pink-500 to-rose-600"
                            borderColor="border-pink-200"
                            link="/leave/approvals"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center mb-6 md:mb-8">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <PlusIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <QuickActionCard
                            title="Create Announcement"
                            description="Send company-wide announcements to all employees"
                            icon={<MegaphoneIcon />}
                            link="/announcements"
                            gradient="from-cyan-500 to-blue-600"
                            borderColor="border-cyan-200"
                        />
                        <QuickActionCard
                            title="View Notifications"
                            description="Check all your notifications and announcements"
                            icon={<BellIcon />}
                            link="/notifications"
                            gradient="from-yellow-500 to-orange-600"
                            borderColor="border-yellow-200"
                            badge={stats?.unreadNotifications}
                        />
                        <QuickActionCard
                            title="Leave Approvals"
                            description="Review and approve pending leave requests"
                            icon={<DocumentCheckIcon />}
                            link="/leave/approvals"
                            gradient="from-pink-500 to-rose-600"
                            borderColor="border-pink-200"
                            badge={stats?.pendingLeaveApprovals}
                        />
                        <QuickActionCard
                            title="Add New Employee"
                            description="Create a new employee profile and user account"
                            icon={<PlusIcon />}
                            link="/employees/new"
                            gradient="from-blue-500 to-indigo-600"
                            borderColor="border-blue-200"
                        />
                        <QuickActionCard
                            title="Create Department"
                            description="Set up a new organizational department"
                            icon={<BuildingOffice2Icon />}
                            link="/departments/new"
                            gradient="from-green-500 to-emerald-600"
                            borderColor="border-green-200"
                        />
                        <QuickActionCard
                            title="Add Branch Office"
                            description="Register a new office location"
                            icon={<MapPinIcon />}
                            link="/branches/new"
                            gradient="from-purple-500 to-pink-600"
                            borderColor="border-purple-200"
                        />
                        <QuickActionCard
                            title="User Management"
                            description="Manage user accounts and permissions"
                            icon={<ShieldCheckIcon />}
                            link="/settings"
                            gradient="from-indigo-500 to-purple-600"
                            borderColor="border-indigo-200"
                        />
                        <QuickActionCard
                            title="System Settings"
                            description="Configure system-wide settings and policies"
                            icon={<Cog6ToothIcon />}
                            link="/settings"
                            gradient="from-gray-500 to-slate-600"
                            borderColor="border-gray-200"
                        />
                        <QuickActionCard
                            title="Attendance Kiosk"
                            description="Generate QR code for employee clock-in/out kiosk"
                            icon={<QrCodeIcon />}
                            link="/kiosk"
                            gradient="from-emerald-500 to-teal-600"
                            borderColor="border-emerald-200"
                        />
                    </div>
                </div>

                {/* Gender Ratio Chart */}
                <div className="mb-8 md:mb-12">
                    <GenderRatioChart />
                </div>

                {/* System Overview */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <span className="text-gray-700 font-medium">Employee Growth Rate</span>
                                    <span className="font-bold text-green-600">+12.5%</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <span className="text-gray-700 font-medium">Department Efficiency</span>
                                    <span className="font-bold text-blue-600">94.2%</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                    <span className="text-gray-700 font-medium">Leave Approval Rate</span>
                                    <span className="font-bold text-purple-600">87.3%</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                                    <span className="text-gray-700 font-medium">Pending Approvals</span>
                                    <span className="font-bold text-orange-600">{stats?.pendingLeaveApprovals || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                                    <span className="text-gray-700 font-medium">Active Announcements</span>
                                    <span className="font-bold text-cyan-600">{stats?.activeAnnouncements || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <span className="text-gray-700 font-medium">System Health</span>
                                    <span className="font-bold text-green-600">Excellent</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
