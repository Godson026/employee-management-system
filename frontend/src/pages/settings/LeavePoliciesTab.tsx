import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  leave_balance: number;
  department?: {
    name: string;
  };
  branch?: {
    name: string;
  };
}

interface LeaveBalanceSummary {
  totalEmployees: number;
  averageBalance: number;
  totalDays: number;
  employees: Employee[];
}

export default function LeavePoliciesTab() {
  const [summary, setSummary] = useState<LeaveBalanceSummary | null>(null);
  const [balances, setBalances] = useState<{ [employeeId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/employees/leave-balance-summary');
      setSummary(response.data);
      
      // Initialize balances from the fetched data
      const initialBalances = response.data.employees.reduce((acc: { [key: string]: number }, emp: Employee) => {
        acc[emp.id] = emp.leave_balance;
        return acc;
      }, {});
      setBalances(initialBalances);
    } catch (err) {
      toast.error("Could not fetch leave balance data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBalanceChange = (employeeId: string, value: string) => {
    const newBalance = parseInt(value, 10);
    if (!isNaN(newBalance) || value === '') {
        setBalances(prev => ({ ...prev, [employeeId]: isNaN(newBalance) ? 0 : newBalance }));
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const updates = Object.entries(balances).map(([employeeId, leave_balance]) => ({
        employeeId,
        leave_balance
    }));
    try {
        await api.patch('/employees/balances', { updates });
        toast.success("Leave balances updated successfully!");
        fetchData(); // Refresh data after successful update
    } catch {
        toast.error("Failed to save changes.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="text-slate-600 font-medium">Loading leave balance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Employee Leave Balances</h2>
            <p className="text-green-100 text-lg">Manage and update leave entitlements for all employees</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-green-200 text-sm">Last Updated</p>
              <p className="text-white font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
            <button 
              onClick={handleSaveChanges} 
              disabled={isSaving} 
              className="bg-white text-green-700 font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Employees</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{summary?.totalEmployees || 0}</p>
              <p className="text-blue-600 text-sm mt-1">Active workforce</p>
            </div>
            <div className="p-4 bg-blue-200 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Average Balance</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{summary?.averageBalance || 0}</p>
              <p className="text-green-600 text-sm mt-1">Days per employee</p>
            </div>
            <div className="p-4 bg-green-200 rounded-xl">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Total Days</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">{summary?.totalDays || 0}</p>
              <p className="text-purple-600 text-sm mt-1">Combined balance</p>
            </div>
            <div className="p-4 bg-purple-200 rounded-xl">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Employee Leave Balances</h3>
              <p className="text-slate-600 mt-2">Click on any balance to edit. Changes are saved when you click "Save Changes".</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-slate-500 text-sm">Showing</p>
                <p className="text-slate-900 font-semibold">{summary?.employees.length || 0} employees</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200">
          {summary?.employees.map((employee) => (
            <div key={employee.id} className="p-6 hover:bg-slate-50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900">
                      {employee.first_name} {employee.last_name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">ID:</span> {employee.id.slice(0, 8)}...
                      </p>
                      {employee.department && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Dept:</span> {employee.department.name}
                        </p>
                      )}
                      {employee.branch && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Branch:</span> {employee.branch.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <label htmlFor={`balance-${employee.id}`} className="block text-sm font-medium text-slate-700 mb-2">
                      Current Balance
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        id={`balance-${employee.id}`}
                        type="number"
                        min="0"
                        max="365"
                        value={balances[employee.id] || 0}
                        onChange={(e) => handleBalanceChange(employee.id, e.target.value)}
                        className="w-28 px-4 py-3 border-2 border-slate-300 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      />
                      <span className="text-slate-600 font-medium">days</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Previous Balance</p>
                    <p className="text-lg font-semibold text-slate-400 line-through">
                      {employee.leave_balance}
                    </p>
                    <p className="text-xs text-slate-500">days</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Change</p>
                    <p className={`text-lg font-semibold ${
                      (balances[employee.id] || 0) > employee.leave_balance 
                        ? 'text-green-600' 
                        : (balances[employee.id] || 0) < employee.leave_balance 
                        ? 'text-red-600' 
                        : 'text-slate-400'
                    }`}>
                      {((balances[employee.id] || 0) - employee.leave_balance) > 0 ? '+' : ''}
                      {(balances[employee.id] || 0) - employee.leave_balance}
                    </p>
                    <p className="text-xs text-slate-500">days</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(!summary?.employees || summary.employees.length === 0) && (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No employees found</h3>
            <p className="text-slate-600 mb-6">Add some employees to start managing leave balances.</p>
            <button 
              onClick={() => window.location.href = '/employees'} 
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition-colors duration-200"
            >
              Go to Employees
            </button>
          </div>
        )}
      </div>
    </div>
  );
}