import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import api from '../../api';
import { ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface AttendanceOverviewCardProps {
    teamType: 'Branch' | 'Department';
}

const COLORS = {
    PRESENT: '#10b981', // green-500
    LATE: '#eab308',    // yellow-500
    ABSENT: '#ef4444',  // red-500
    ON_LEAVE: '#3b82f6' // blue-500
};

export default function AttendanceOverviewCard({ teamType }: AttendanceOverviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<Array<{ name: string; value: number; color: string }>>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            setLoading(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                
                // Fetch today's attendance records (already filtered by role)
                const attendanceResponse = await api.get(`/attendance/team-history?startDate=${today}&endDate=${today}`);
                const attendanceRecords = attendanceResponse.data || [];
                
                // Fetch employees on leave today (already filtered by role)
                let employeesOnLeave: any[] = [];
                try {
                    const leaveResponse = await api.get(`/leaves/on-leave?date=${today}`);
                    employeesOnLeave = leaveResponse.data || [];
                } catch (err) {
                    console.warn('Could not fetch employees on leave:', err);
                }
                
                // Fetch all employees to get total count
                const employeesResponse = await api.get(`/employees?limit=1000`);
                const allEmployees = employeesResponse.data.data || employeesResponse.data || [];
                
                // Create a map of employee IDs to attendance status
                const statusMap = new Map<string, string>();
                
                // Process attendance records
                attendanceRecords.forEach((record: any) => {
                    if (record.employee?.id) {
                        const status = (record.status || '').toUpperCase();
                        // Don't overwrite if already marked as LATE (more specific)
                        if (!statusMap.has(record.employee.id) || statusMap.get(record.employee.id) !== 'LATE') {
                            statusMap.set(record.employee.id, status);
                        }
                    }
                });
                
                // Process employees on leave (they take priority - if on leave, they're not absent)
                const onLeaveEmployeeIds = new Set(employeesOnLeave.map((leave: any) => leave.employee?.id).filter(Boolean));
                
                // Calculate counts
                let present = 0;
                let late = 0;
                let absent = 0;
                let onLeave = onLeaveEmployeeIds.size;
                
                allEmployees.forEach((employee: any) => {
                    const employeeId = employee.id;
                    const status = statusMap.get(employeeId);
                    
                    if (onLeaveEmployeeIds.has(employeeId)) {
                        // Employee is on leave - already counted
                        return;
                    } else if (status === 'PRESENT') {
                        present++;
                    } else if (status === 'LATE') {
                        late++;
                    } else {
                        // No attendance record and not on leave = absent
                        absent++;
                    }
                });
                
                // Prepare chart data
                const data = [];
                if (present > 0) {
                    data.push({ name: 'Present', value: present, color: COLORS.PRESENT });
                }
                if (late > 0) {
                    data.push({ name: 'Late', value: late, color: COLORS.LATE });
                }
                if (absent > 0) {
                    data.push({ name: 'Absent', value: absent, color: COLORS.ABSENT });
                }
                if (onLeave > 0) {
                    data.push({ name: 'On Leave', value: onLeave, color: COLORS.ON_LEAVE });
                }
                
                setChartData(data);
                setTotal(allEmployees.length);
            } catch (err) {
                console.error('Error fetching attendance overview:', err);
                setChartData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAttendanceData();
        
        // Refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchAttendanceData, 30000);
        
        return () => clearInterval(interval);
    }, [teamType]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-gray-200">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-600">
                        <span className="font-bold">{data.value}</span> employee{data.value !== 1 ? 's' : ''} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                className="text-sm font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-green-200 p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                        <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Today's Attendance Overview</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200"></div>
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 absolute top-0 left-0"></div>
                            </div>
                            <span className="text-green-800 font-semibold">Loading attendance data...</span>
                        </div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                            <ClockIcon className="w-8 h-8 text-green-700" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Data Available</h3>
                        <p className="text-gray-600">No attendance data for today.</p>
                    </div>
                ) : (
                    <div>
                        {/* Pie Chart */}
                        <div className="h-80 mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={CustomLabel}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => {
                                            const data = chartData.find(d => d.name === value);
                                            return `${value}: ${data?.value || 0}`;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t-2 border-gray-100">
                            {chartData.map((item) => (
                                <div key={item.name} className="text-center">
                                    <div 
                                        className="w-4 h-4 rounded-full mx-auto mb-2"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                    <p className="text-sm text-gray-600 font-medium">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

