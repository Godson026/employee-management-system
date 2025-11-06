import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  department_head?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function EditDepartmentPage() {
    const { id } = useParams<{ id: string }>();
    const [formData, setFormData] = useState({ 
        name: '', 
        code: '', 
        description: '', 
        department_head_id: '' 
    });
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        const fetchInitialData = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    api.get(`/departments/${id}`),
                    api.get('/employees?limit=1000')
                ]);
                const dept: Department = deptRes.data;
                setFormData({
                    name: dept.name,
                    code: dept.code,
                    description: dept.description || '',
                    department_head_id: dept.department_head?.id || ''
                });
                setAllEmployees(empRes.data.data || empRes.data);
            } catch {
                toast.error("Failed to load data for editing.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            // Prepare submission data - convert empty string to null for department_head_id
            const submissionData = {
                ...formData,
                department_head_id: formData.department_head_id === '' ? null : formData.department_head_id
            };
            await api.patch(`/departments/${id}`, submissionData);
            toast.success("Department updated successfully!");
            navigate('/departments');
        } catch {
            toast.error("Failed to update department.");
        }
    };
    
    if(loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading department data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 md:px-8 py-8 md:py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/departments"
                                    className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                                >
                                    <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Edit Department</h1>
                                    <p className="text-base md:text-lg text-gray-600 mt-1">
                                        Update department information and leadership details
                                    </p>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg hidden md:flex">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* Department Information Section */}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center mb-6 md:mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Department Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Department Name *</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        id="name"
                                        value={formData.name} 
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white text-base font-medium"
                                        placeholder="Enter department name"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700">Department Code *</label>
                                    <input 
                                        type="text" 
                                        name="code" 
                                        id="code"
                                        value={formData.code} 
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white text-base font-medium"
                                        placeholder="e.g., ADMIN"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700">Description</label>
                                    <textarea 
                                        name="description" 
                                        id="description"
                                        value={formData.description} 
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-base font-medium"
                                        placeholder="Describe the department's purpose and responsibilities"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="department_head_id" className="block text-sm font-semibold text-gray-700">Department Head</label>
                                    <select 
                                        name="department_head_id" 
                                        id="department_head_id"
                                        value={formData.department_head_id} 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white text-base font-medium"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {allEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">Choose an employee to lead this department</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-6 md:px-8 py-4 md:py-6 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => navigate('/departments')}
                                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}