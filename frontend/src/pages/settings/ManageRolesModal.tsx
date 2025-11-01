import { useState, useEffect } from 'react';

interface Role { id: string; name: string; }
interface User { id: string; email: string; roles: Role[]; }

interface ManageRolesModalProps {
  user: User | null;
  allRoles: Role[];
  onClose: () => void;
  onSave: (userId: string, roleIds: string[]) => Promise<void>; // Make it a promise
  isSaving: boolean;
}

export default function ManageRolesModal({ user, allRoles, onClose, onSave, isSaving }: ManageRolesModalProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedRoleIds(user.roles.map(r => r.id));
    } else {
      setSelectedRoleIds([]); // Reset when modal is closed/user is null
    }
  }, [user]);

  const handleCheckboxChange = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };
  
  const handleSave = async () => {
    if (user && !isSaving) {
        await onSave(user.id, selectedRoleIds);
    }
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold mb-4">Manage Roles for {user.email}</h2>
        
        <div className="space-y-2">
            {allRoles.map(role => (
                <div key={role.id} className="flex items-center">
                    <input type="checkbox" id={`role-${role.id}`} checked={selectedRoleIds.includes(role.id)} onChange={() => handleCheckboxChange(role.id)} className="h-4 w-4 text-green-600 rounded" />
                    <label htmlFor={`role-${role.id}`} className="ml-3 text-sm text-gray-700">{role.name}</label>
                </div>
            ))}
        </div>

        <div className="mt-6 flex justify-end space-x-2">
            {/* THIS BUTTON IS NOW FIXED */}
            <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md disabled:opacity-50">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-green-600 border rounded-md disabled:opacity-50 hover:shadow-lg transition-all">
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
}