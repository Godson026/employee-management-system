import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import api from '../api';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface GenderStats {
  male: number;
  female: number;
  other: number;
  total: number;
  percentages: {
    male: string;
    female: string;
    other: string;
  };
}

const COLORS = {
  male: '#3b82f6', // blue
  female: '#ec4899', // pink
  other: '#10b981', // green
};

export default function GenderRatioChart() {
  const [stats, setStats] = useState<GenderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenderStats = async () => {
      try {
        const response = await api.get('/dashboard/gender-stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch gender stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenderStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Gender Ratio</h2>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Gender Ratio</h2>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Male', value: stats.male, percentage: stats.percentages.male, color: COLORS.male },
    { name: 'Female', value: stats.female, percentage: stats.percentages.female, color: COLORS.female },
    { name: 'Other', value: stats.other, percentage: stats.percentages.other, color: COLORS.other },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-bold">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-bold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {entry.value}: {entry.payload.percentage}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gender Ratio</h2>
            <p className="text-sm text-gray-500">Total Active Employees: {stats.total}</p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        {chartData.map((item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-600">{item.name}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

