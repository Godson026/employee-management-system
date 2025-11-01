import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const formInitialState = {
    name: '',
    code: '',
    region: '',
    address: '',
    branch_manager_id: '',
};

export default function AddNewBranchPage() {
  const [formData, setFormData] = useState(formInitialState);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees?limit=1000');
        setAllEmployees(response.data.data || response.data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        toast.error('Failed to load employee list');
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        branch_manager_id: formData.branch_manager_id || null
      };
      await api.post('/branches', submissionData);
      toast.success('Branch created successfully!');
      navigate('/branches');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create branch. Please check the data.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white">
        <div className="px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4">Add New Branch</h1>
                <p className="text-xl text-purple-100 max-w-2xl">
                  Create a new office location to expand your organizational presence and serve different regions.
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
            {/* Branch Information Section */}
            <div className="p-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Branch Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Branch Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg" 
                    placeholder="Enter branch name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="code" className="block text-sm font-semibold text-slate-700">Branch Code</label>
                  <input 
                    type="text" 
                    name="code" 
                    value={formData.code} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg" 
                    placeholder="e.g., NYC-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="region" className="block text-sm font-semibold text-slate-700">Region</label>
                  <input 
                    type="text" 
                    name="region" 
                    value={formData.region} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg" 
                    placeholder="e.g., North America"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="branch_manager_id" className="block text-sm font-semibold text-slate-700">Branch Manager (Optional)</label>
                  <select 
                    name="branch_manager_id" 
                    value={formData.branch_manager_id} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg"
                  >
                    <option value="">-- Select Branch Manager (Optional) --</option>
                    {allEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-slate-500">Choose an employee to manage this branch</p>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-slate-700">Complete Address</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange}
                    required 
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white resize-none text-lg" 
                    placeholder="Enter complete address including street, city, state, and postal code"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-8 py-6 bg-red-50 border-t border-red-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-semibold text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-end space-x-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/branches')} 
                  className="px-8 py-3 text-lg font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Branch...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Branch
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}