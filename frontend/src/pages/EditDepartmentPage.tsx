import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

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
    
    if(loading) return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;

    return (
        <div className="bg-gray-50 p-6 sm:p-8 min-h-full">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Edit Department</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Department Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                id="name"
                                value={formData.name} 
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Department Code</label>
                            <input 
                                type="text" 
                                name="code" 
                                id="code"
                                value={formData.code} 
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea 
                            name="description" 
                            id="description"
                            value={formData.description} 
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="department_head_id" className="block text-sm font-medium text-gray-700">Department Head</label>
                        <select 
                            name="department_head_id" 
                            id="department_head_id"
                            value={formData.department_head_id} 
                            onChange={handleChange} 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">-- Unassigned --</option>
                            {allEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/departments')}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}