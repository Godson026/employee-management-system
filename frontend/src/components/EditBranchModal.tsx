import { useState, useEffect } from 'react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
  branch_manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface EditBranchModalProps {
  branch: Branch | null;
  allEmployees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; branch_manager_id: string | null }) => void;
}

export default function EditBranchModal({ branch, allEmployees, isOpen, onClose, onSave }: EditBranchModalProps) {
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  
  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setManagerId(branch.branch_manager?.id || '');
    }
  }, [branch]);
  
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(branch!.id, { name, branch_manager_id: managerId || null });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Branch</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Branch Manager</label>
                    <select 
                        value={managerId} 
                        onChange={e => setManagerId(e.target.value)} 
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
