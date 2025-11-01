import { useState, useEffect } from 'react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Department {
  id: string;
  name: string;
  department_head?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface EditDepartmentModalProps {
  department: Department | null;
  allEmployees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; department_head_id: string | null }) => void;
}

export default function EditDepartmentModal({ department, allEmployees, isOpen, onClose, onSave }: EditDepartmentModalProps) {
  const [name, setName] = useState('');
  const [headId, setHeadId] = useState('');
  
  useEffect(() => {
    if (department) {
      setName(department.name);
      setHeadId(department.department_head?.id || '');
    }
  }, [department]);
  
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(department!.id, { name, department_head_id: headId || null });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Department</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Department Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Department Head</label>
                    <select 
                        value={headId} 
                        onChange={e => setHeadId(e.target.value)} 
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
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Save Changes
                </button>
            </div>
        </div>
    </div>
  );
}
