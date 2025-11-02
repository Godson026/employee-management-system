import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import EditAttendanceModal from './EditAttendanceModal';
import DepartmentalOverviewTab from './DepartmentalOverviewTab';
import AttendanceAnalyticsTab from './AttendanceAnalyticsTab'; // Import our new component

// Simple KPI Stat Card with SIC Life branding - removed unused component

// Daily Logs View Component
const DailyLogsView = ({ records, loading, openEditModal }: { records: any[]; loading: boolean; openEditModal: (record: any) => void }) => (
	<div className="overflow-hidden">
		{loading ? (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading attendance records...</p>
				</div>
			</div>
		) : records.length === 0 ? (
			<div className="text-center py-12">
				<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
				<p className="text-gray-500">Try adjusting your filters to see more results.</p>
			</div>
		) : (
			<div className="overflow-x-auto">
				<table className="min-w-full">
					<thead>
						<tr className="border-b border-gray-200">
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-Out</th>
							<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
							<th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{records.map((rec: any, index: number) => (
							<tr key={rec.id} className={`hover:bg-gray-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
								<td className="px-6 py-4">
									<div className="flex items-center">
										<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
											{rec.employee.first_name?.charAt(0)}{rec.employee.last_name?.charAt(0)}
										</div>
										<div>
											<div className="font-medium text-gray-900">{rec.employee.first_name} {rec.employee.last_name}</div>
										</div>
									</div>
								</td>
								<td className="px-6 py-4">
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{rec.employee.department?.name || 'N/A'}
									</span>
								</td>
								<td className="px-6 py-4 text-sm text-gray-900">{rec.employee.branch?.name || 'N/A'}</td>
								<td className="px-6 py-4 text-sm text-gray-900">
									{rec.clock_in_time ? (
										<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
											{new Date(rec.clock_in_time).toLocaleTimeString()}
										</span>
									) : (
										<span className="text-gray-400">-</span>
									)}
								</td>
								<td className="px-6 py-4 text-sm text-gray-900">
									{rec.clock_out_time ? (
										<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
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
								<td className="px-6 py-4 text-right">
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
);

export default function AdminAttendanceView() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<any>(null);
	const [editingRecord, setEditingRecord] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('Daily Logs');
	const [allFilteredRecords, setAllFilteredRecords] = useState<any[]>([]); // A new state to hold ALL data for analytics

	// Filter states
	const [departments, setDepartments] = useState<any[]>([]);
	const [branches, setBranches] = useState<any[]>([]);
	const [filters, setFilters] = useState({
		startDate: new Date().toISOString().split('T')[0], // Default to today
		endDate: new Date().toISOString().split('T')[0],
		branchId: '',
		departmentId: ''
	});

	useEffect(() => {
		// Fetch data for dropdown filters
		api.get('/departments').then(res => setDepartments(res.data));
		api.get('/branches').then(res => setBranches(res.data));
	}, []);

	// Update the main data fetching useEffect
	useEffect(() => {
		const fetchAllData = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (filters.startDate) params.append('startDate', filters.startDate);
				if (filters.endDate) params.append('endDate', filters.endDate);
				if (filters.branchId) params.append('branchId', filters.branchId);
				if (filters.departmentId) params.append('departmentId', filters.departmentId);

				// We now fetch ALL records for the filter to pass to analytics, and handle pagination on the frontend for the daily log view
				const [recordsRes, statsRes] = await Promise.all([
					api.get(`/attendance?${params.toString()}`), // Fetch all records for analytics
					api.get(`/attendance/summary-stats?${params.toString()}`)
				]);
				
				setAllFilteredRecords(recordsRes.data);
				setStats(statsRes.data);
			} catch (e) {
				toast.error('Failed to load attendance data.');
			} finally {
				setLoading(false);
			}
		};
		fetchAllData();
	}, [filters]);

	const handleFilterChange = (e: any) => {
		setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const openEditModal = (record: any) => {
		setEditingRecord(record);
		setIsEditModalOpen(true);
	};
	
	const handleSaveChanges = async (recordId: string, data: any) => {
		try {
			await api.patch(`/attendance/${recordId}`, data);
			toast.success("Attendance record updated!");
			setIsEditModalOpen(false);
			// Refresh the data
			const params = new URLSearchParams();
			if (filters.startDate) params.append('startDate', filters.startDate);
			if (filters.endDate) params.append('endDate', filters.endDate);
			if (filters.branchId) params.append('branchId', filters.branchId);
			if (filters.departmentId) params.append('departmentId', filters.departmentId);

			const [recordsRes, statsRes] = await Promise.all([
				api.get(`/attendance?${params.toString()}`),
				api.get(`/attendance/summary-stats?${params.toString()}`)
			]);
			setAllFilteredRecords(recordsRes.data);
			setStats(statsRes.data);
		} catch (e) {
			toast.error("Failed to update record.");
		}
	};

	const renderActiveTab = () => {
		switch(activeTab) {
			case 'Daily Logs':
				// Pass all records to the daily log view (it can handle its own pagination internally if needed)
				return <DailyLogsView records={allFilteredRecords} loading={loading} openEditModal={openEditModal} />;
			case 'Departmental Overview':
				return <DepartmentalOverviewTab filters={filters} />;
			case 'Analytics': // THE NEW CASE
				return <AttendanceAnalyticsTab records={allFilteredRecords} loading={loading} />;
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
			{/* Header Section */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
				<div className="px-6 py-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
								Company Attendance Overview
							</h1>
							<p className="text-gray-600 mt-2">Monitor and analyze company-wide attendance patterns</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
							<span className="text-sm text-gray-600">Live Data</span>
						</div>
					</div>
				</div>
			</div>

			<div className="px-6 py-8 space-y-8">
				{/* Modern Filter Bar */}
				<div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
					<div className="flex items-center space-x-4 mb-4">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Start Date</label>
							<input 
								type="date" 
								name="startDate" 
								value={filters.startDate} 
								onChange={handleFilterChange} 
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm" 
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">End Date</label>
							<input 
								type="date" 
								name="endDate" 
								value={filters.endDate} 
								onChange={handleFilterChange} 
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm" 
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Branch</label>
							<select 
								name="branchId" 
								value={filters.branchId} 
								onChange={handleFilterChange} 
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
							>
								<option value="">All Branches</option>
								{branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
							</select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Department</label>
							<select 
								name="departmentId" 
								value={filters.departmentId} 
								onChange={handleFilterChange} 
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
							>
								<option value="">All Departments</option>
								{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
							</select>
						</div>
					</div>
				</div>

				{/* Enhanced KPI Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-100 text-sm font-medium">Total Employees</p>
								<p className="text-3xl font-bold mt-2">{loading ? '...' : stats?.totalEmployees || 0}</p>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-green-100 text-sm font-medium">Present Today</p>
								<p className="text-3xl font-bold mt-2">{loading ? '...' : stats?.present || 0}</p>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-red-100 text-sm font-medium">Absent Today</p>
								<p className="text-3xl font-bold mt-2">{loading ? '...' : stats?.absent || 0}</p>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-yellow-100 text-sm font-medium">Late Arrivals</p>
								<p className="text-3xl font-bold mt-2">{loading ? '...' : stats?.late || 0}</p>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Modern Tab Navigation */}
				<div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
					<div className="border-b border-gray-200/50">
						<nav className="flex space-x-0">
        {['Daily Logs', 'Departmental Overview', 'Analytics'].map((tab) => (
								<button 
									key={tab} 
									onClick={() => setActiveTab(tab)}
									className={`relative px-8 py-4 font-medium text-sm transition-all duration-300 ${
										activeTab === tab 
											? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-500' 
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
									}`}
								>
									{tab}
									{activeTab === tab && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
									)}
								</button>
							))}
						</nav>
					</div>
					
					{/* Tab Content */}
					<div className="p-6">
						{renderActiveTab()}
					</div>
				</div>
			</div>

			<EditAttendanceModal
				record={editingRecord}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSave={handleSaveChanges}
			/>
		</div>
	);
}
