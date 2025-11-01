import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  region: string;
  address: string;
  branch_manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function BranchEditPage() {
    const { id } = useParams<{ id: string }>();
    const [formData, setFormData] = useState({ 
        name: '', 
        code: '', 
        region: '', 
        address: '',
        branch_manager_id: '' 
    });
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        const fetchInitialData = async () => {
            try {
                const [branchRes, empRes] = await Promise.all([
                    axios.get(`http://localhost:3000/branches/${id}`),
                    axios.get('http://localhost:3000/employees')
                ]);
                const branch: Branch = branchRes.data;
                setFormData({
                    name: branch.name,
                    code: branch.code,
                    region: branch.region,
                    address: branch.address,
                    branch_manager_id: branch.branch_manager?.id || ''
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
            await axios.patch(`http://localhost:3000/branches/${id}`, formData);
            toast.success("Branch updated successfully!");
            navigate('/branches');
        } catch {
            toast.error("Failed to update branch.");
        }
    };
    
    if(loading) return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;

    return (
        <div className="bg-gray-50 p-6 sm:p-8 min-h-full">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Edit Branch</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Branch Name</label>
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
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Branch Code</label>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
                            <input 
                                type="text" 
                                name="region" 
                                id="region"
                                value={formData.region} 
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <input 
                                type="text" 
                                name="address" 
                                id="address"
                                value={formData.address} 
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="branch_manager_id" className="block text-sm font-medium text-gray-700">Branch Manager</label>
                        <select 
                            name="branch_manager_id" 
                            id="branch_manager_id"
                            value={formData.branch_manager_id} 
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
                            onClick={() => navigate('/branches')}
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
