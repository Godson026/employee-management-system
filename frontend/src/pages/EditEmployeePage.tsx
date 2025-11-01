import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// It's better to move these to a shared types file in a real project
interface Department { id: string; name: string; }
interface Branch { id: string; name: string; }

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<any>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [employeeRes, deptRes, branchRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get('/departments'),
          api.get('/branches'),
        ]);
        
        const empData = employeeRes.data;
        const formattedData = {
          ...empData,
          departmentId: empData.department?.id || '',
          branchId: empData.branch?.id || '',
          date_of_birth: empData.date_of_birth ? new Date(empData.date_of_birth).toISOString().split('T')[0] : '',
          start_date: empData.start_date ? new Date(empData.start_date).toISOString().split('T')[0] : '',
        };
        setFormData(formattedData);
        setPhotoPreview(empData.photo_url);

        setDepartments(deptRes.data);
        setBranches(branchRes.data);
      } catch (err) {
        setError('Failed to load employee data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        alert('Please select an image file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    // Create a clean object for submission by copying formData and removing read-only fields
    const submissionData = { ...formData };
    
    // Remove properties that the backend DTO doesn't expect or shouldn't receive
    delete submissionData.id;
    delete submissionData.leave_balance;
    delete submissionData.created_at;
    delete submissionData.updated_at;
    delete submissionData.user;
    delete submissionData.token_version;
    delete submissionData.supervisor;
    // Department and branch objects are handled by their IDs
    delete submissionData.department;
    delete submissionData.branch;
    
    // Ensure dates are properly formatted for the backend
    if (submissionData.date_of_birth) {
      submissionData.date_of_birth = new Date(submissionData.date_of_birth).toISOString();
    }
    if (submissionData.start_date) {
      submissionData.start_date = new Date(submissionData.start_date).toISOString();
    }
    
    try {
      await api.patch(`/employees/${id}`, submissionData);
      toast.success("Employee updated successfully!");
      
      // Upload photo if one was selected
      if (photo) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photo);
        await api.post(`/employees/${id}/photo`, photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      navigate('/employees');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update employee.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
        setSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
        try {
            await api.delete(`/employees/${id}`);
            navigate('/employees');
        } catch (err) {
            setError('Failed to delete employee.');
        }
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error && !formData.first_name) return <div>{error}</div>; // Show fatal error only if form can't load

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Employee: {formData.first_name} {formData.last_name}</h1>
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Delete Employee
          </button>
        </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <h2 className="col-span-full font-semibold text-lg">Personal Details</h2>
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" value={formData.gender || 'Male'} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option>Male</option>
                <option>Female</option>
            </select>
          </div>
          <div className="col-span-full">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" name="address" value={formData.address || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          
          {/* Photo Upload Field */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700">Employee Photo</label>
            <div className="mt-1 flex items-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover"/>
              ) : (
                <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300">
                    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.993A2 2 0 002 18h20a2 2 0 002 2.993zM16 12a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
                </span>
              )}
              <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>
        
        {/* Employment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <h2 className="col-span-full font-semibold text-lg">Employment Details</h2>
            <div>
              <label htmlFor="employee_id_code" className="block text-sm font-medium text-gray-700">Employee ID Code</label>
              <input type="text" name="employee_id_code" value={formData.employee_id_code || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">Job Title</label>
              <input type="text" name="job_title" value={formData.job_title || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
             <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">Employment Type</label>
              <select name="employment_type" value={formData.employment_type || 'Permanent'} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <option>Permanent</option>
                  <option>Contract</option>
                  <option>Intern</option>
              </select>
            </div>
             <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="start_date" value={formData.start_date || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
             <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">Department</label>
              <select name="departmentId" value={formData.departmentId || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <option value="">Select a Department</option>
                  {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">Branch (Optional)</label>
              <select name="branchId" value={formData.branchId || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <option value="">Select a Branch</option>
                  {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </div>
        </div>
        
        {/* Financial & Emergency */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <h2 className="col-span-full font-semibold text-lg">Financial & Legal</h2>
             <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">Bank Account Number</label>
              <input type="text" name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
             <div>
              <label htmlFor="ssnit_number" className="block text-sm font-medium text-gray-700">SSNIT Number</label>
              <input type="text" name="ssnit_number" value={formData.ssnit_number || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
             <h2 className="col-span-full font-semibold text-lg">Emergency Contact</h2>
              <div>
              <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
              <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
              <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
        </div>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

        <div className="pt-5">
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                {submitting ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
}