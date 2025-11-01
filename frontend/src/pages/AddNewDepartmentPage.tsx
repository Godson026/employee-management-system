import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function AddNewDepartmentPage() {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        department_head_id: '',
    });
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch employees for the dropdown
    useEffect(() => {
        api.get('/employees?limit=1000')
            .then(res => {
                setAllEmployees(res.data.data);
            })
            .catch(() => {
                toast.error("Failed to load list of potential department heads.");
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submissionData = {
                ...formData,
                department_head_id: formData.department_head_id || null
            };
            await api.post('/departments', submissionData);
            toast.success("Department created successfully!");
            navigate('/departments');
        } catch {
            toast.error("Failed to create department.");
        } finally {
            setLoading(false);
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
                                <h1 className="text-4xl font-bold mb-4">Add New Department</h1>
                                <p className="text-xl text-blue-100 max-w-2xl">
                                    Create a new organizational department to structure your team and define clear responsibilities.
                                </p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
                        {/* Department Information Section */}
                        <div className="p-8">
                            <div className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Department Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Department Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        id="name" 
                                        value={formData.name}
                                        onChange={handleChange} 
                                        required 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg" 
                                        placeholder="Enter department name"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="code" className="block text-sm font-semibold text-slate-700">Department Code</label>
                                    <input 
                                        type="text" 
                                        name="code" 
                                        id="code" 
                                        value={formData.code}
                                        onChange={handleChange} 
                                        required 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg" 
                                        placeholder="e.g., HR, IT, SALES"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700">Description</label>
                                    <textarea 
                                        name="description" 
                                        id="description" 
                                        rows={4} 
                                        value={formData.description}
                                        onChange={handleChange} 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white resize-none text-lg" 
                                        placeholder="Describe the department's purpose and responsibilities"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="department_head_id" className="block text-sm font-semibold text-slate-700">Department Head (Optional)</label>
                                    <select 
                                        name="department_head_id" 
                                        id="department_head_id" 
                                        value={formData.department_head_id} 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg"
                                    >
                                        <option value="">-- Select Department Head (Optional) --</option>
                                        {allEmployees.map((emp: any) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-slate-500">Choose an employee to lead this department</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
                            <div className="flex items-center justify-end space-x-4">
                                <Link 
                                    to="/departments" 
                                    className="px-8 py-3 text-lg font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                                >
                                    Cancel
                                </Link>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                            Creating Department...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Create Department
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