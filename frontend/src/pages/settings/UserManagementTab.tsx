import { useState, useEffect } from 'react';
import api from '../../api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import ManageRolesModal from './ManageRolesModal';
import CreateUserModal from './CreateUserModal';
import { useAuth } from '../../contexts/AuthContext';
import { RoleName } from '../../roles';

interface Role { 
  id: string; 
  name: string; 
}

interface User { 
  id: string; 
  email: string; 
  roles: Role[]; 
}

interface Employee {
  id: string;
  employee_id_code: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  photo_url: string | null;
  start_date: string;
  status: string;
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

// This is our new, unified data structure
interface EmployeeWithUser extends Employee { 
  user: User | null; 
}

export default function UserManagementTab() {
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithUser | null>(null);
  const { hasRole } = useAuth();

  const fetchEmployeeUsers = async () => {
    try {
        const res = await api.get('/users/all-employees');
        setEmployees(res.data);
    } catch {
        toast.error('Could not fetch employee and user list.');
    }
  };

  useEffect(() => {
    // Only allow Admins and HR Managers to fetch data
    if (hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER)) {
        fetchEmployeeUsers();

        api.get('/roles')
        .then(res => setAllRoles(res.data))
        .catch(() => toast.error('Could not fetch roles.'));
    }
  }, [hasRole]);
  
  const openModalForUser = (user: User) => {
    setSelectedUser(user);
    // setIsModalOpen(true);
  };
  
  const closeModal = () => {
      // setIsModalOpen(false);
      setSelectedUser(null);
  }

  const openCreateUserModal = (employee: EmployeeWithUser) => {
      setSelectedEmployee(employee);
      setIsCreateUserModalOpen(true);
  };

  const closeCreateUserModal = () => {
      setIsCreateUserModalOpen(false);
      setSelectedEmployee(null);
  };

  const handleCreateUser = async (password: string) => {
      if (!selectedEmployee) return;
      
      try {
          await api.post(`/users/create-for-employee/${selectedEmployee.id}`, { password: password });
          toast.success(`User account created for ${selectedEmployee.email}`);
          fetchEmployeeUsers(); // Refresh the list
          closeCreateUserModal();
      } catch (err) {
          toast.error("Failed to create user account.");
      }
  }

  const handleSaveRoles = async (userId: string, roleIds: string[]) => {
    setIsSaving(true);
    try {
        await api.patch(`/users/${userId}/roles`, { roleIds });
        toast.success("User roles updated successfully!");
        fetchEmployeeUsers();
        closeModal(); // THIS IS THE KEY CHANGE
    } catch (err) {
        const error = err as AxiosError<{ message: string | string[] }>;
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
             backendMessage.forEach(msg => toast.error(msg));
        } else if (backendMessage) {
            toast.error(backendMessage);
        } else {
            toast.error("Failed to update roles.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage User Accounts</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roles</th>
              {hasRole(RoleName.SYSTEM_ADMIN) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="px-6 py-4">{emp.first_name} {emp.last_name}</td>
                <td className="px-6 py-4">{emp.email}</td>
                <td className="px-6 py-4">
                  {emp.user ? (
                    emp.user.roles.map(r => r.name).join(', ')
                  ) : (
                    <span className="text-gray-400 italic">No User Account</span>
                  )}
                </td>
                {hasRole(RoleName.SYSTEM_ADMIN) && (
                  <td className="px-6 py-4 text-right">
                    {emp.user ? (
                      <button onClick={() => emp.user && openModalForUser(emp.user)} className="text-green-600 hover:text-green-900 font-medium">
                        Manage Roles
                      </button>
                    ) : (
                      <button onClick={() => openCreateUserModal(emp)} className="text-green-600 hover:text-green-900 font-medium">
                        Create User
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasRole(RoleName.SYSTEM_ADMIN) && (
          <ManageRolesModal
            user={selectedUser}
            allRoles={allRoles}
            onClose={closeModal} // Pass the close function
            onSave={handleSaveRoles}
            isSaving={isSaving} // Pass the saving state
          />
      )}

      {hasRole(RoleName.SYSTEM_ADMIN) && (
          <CreateUserModal
            isOpen={isCreateUserModalOpen}
            onClose={closeCreateUserModal}
            onSubmit={handleCreateUser}
            email={selectedEmployee?.email || ''}
          />
      )}
    </div>
  );
}