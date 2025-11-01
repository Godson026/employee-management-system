import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// A simple helper function to process the raw data for our chart
const processDataForChart = (records: any[]) => {
    if (!records || records.length === 0) return [];
    
    const trendData = records.reduce((acc: any, rec: any) => {
        const date = new Date(rec.date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date, present: 0, absent: 0 };
        }
        if (rec.status === 'Present' || rec.status === 'Late') {
            acc[date].present++;
        } else {
            acc[date].absent++;
        }
        return acc;
    }, {});
    
    return Object.values(trendData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// A helper for the frequently late list
const getFrequentlyLate = (records: any[]) => {
     const lateCounts = records.reduce((acc: any, rec: any) => {
        if (rec.status === 'Late') {
            const empName = `${rec.employee.first_name} ${rec.employee.last_name}`;
            acc[empName] = (acc[empName] || 0) + 1;
        }
        return acc;
    }, {});
    return Object.entries(lateCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
}

interface AttendanceAnalyticsTabProps {
    records: any[];
    loading: boolean;
}

export default function AttendanceAnalyticsTab({ records, loading }: AttendanceAnalyticsTabProps) {

  // useMemo prevents re-calculating on every re-render
  const chartData = useMemo(() => processDataForChart(records), [records]);
  const frequentlyLate = useMemo(() => getFrequentlyLate(records), [records]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Daily Attendance Trend</h3>
                    <p className="text-gray-600 text-sm mt-1">Track attendance patterns over time</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Present</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                    <span className="text-sm text-gray-600">Absent</span>
                </div>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#6b7280"
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#6b7280"
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="present" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                            name="Present"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="absent" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            activeDot={{ r: 8, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                            name="Absent"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Side Widget */}
        <div className="lg:col-span-1 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Frequently Late</h3>
                    <p className="text-gray-600 text-sm">Employees with most late arrivals</p>
                </div>
            </div>
            
            {frequentlyLate.length > 0 ? (
                <div className="space-y-4">
                    {frequentlyLate.map(([name, count], index) => (
                        <div key={name} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 text-sm">{name}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    {String(count)} times
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Excellent Attendance!</h4>
                    <p className="text-gray-500 text-sm">No late arrivals in this period.</p>
                </div>
            )}
        </div>

    </div>
  );
}
