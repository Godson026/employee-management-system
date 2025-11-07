import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

const formInitialState = {
  employee_id_code: '',
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  date_of_birth: '',
  gender: 'Male',
  address: '',
  phone_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  bank_name: '',
  bank_account_number: '',
  ssnit_number: '',
  employment_type: 'Permanent',
  start_date: '',
  departmentId: '',
  branchId: '',
};

export default function AddNewEmployeePage() {
  const [formData, setFormData] = useState(formInitialState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptRes = await api.get('/departments');
        const branchRes = await api.get('/branches');
        setDepartments(deptRes.data);
        setBranches(branchRes.data);
      } catch (err) {
        console.error('Could not fetch required data for the form.');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setPhoto(file);
      } else {
        alert('Please select an image file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.departmentId) {
      toast.error('Please select a department.');
      setSubmitting(false);
      return;
    }
    
    // Clean up the data - remove empty strings and convert to proper format
    const submissionData: any = {
        employee_id_code: formData.employee_id_code.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        job_title: formData.job_title.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address.trim(),
        phone_number: formData.phone_number.trim(),
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        bank_name: formData.bank_name.trim(),
        bank_account_number: formData.bank_account_number.trim(),
        ssnit_number: formData.ssnit_number.trim(),
        employment_type: formData.employment_type,
        start_date: formData.start_date,
        departmentId: formData.departmentId,
    };
    
    // Only include branchId if it's not empty
    if (formData.branchId && formData.branchId.trim()) {
        submissionData.branchId = formData.branchId.trim();
    }

    try {
      // STEP 1: Create the employee with text data
      const createEmployeeResponse = await api.post('/employees', submissionData);
      
      const newEmployee = createEmployeeResponse.data;

      // STEP 2: If a photo exists, upload it
      if (photo && newEmployee.id) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photo);

        await api.post(
            `/employees/${newEmployee.id}/photo`, 
            photoFormData, 
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      navigate('/employees'); // Redirect only after everything is successful

    } catch (err: any) {
      console.error('Error creating employee:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error('Failed to create employee. Please check all fields.');
      }
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4 text-gray-900">Add New Employee</h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Create a new employee profile with all necessary information including personal details, employment information, and contact information.
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
        
          {/* Personal Details */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Personal Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input 
                  type="text" 
                  name="phone_number" 
                  value={formData.phone_number} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  name="date_of_birth" 
                  value={formData.date_of_birth} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="col-span-full">
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
          
              {/* Photo Upload */}
              <div className="col-span-full">
                <label htmlFor="photo" className="block text-sm font-medium text-slate-700 mb-2">Employee Photo</label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {photo ? (
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-lg"/>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <svg className="h-8 w-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.993A2 2 0 002 18h20a2 2 0 002 2.993zM16 12a4 4 0 10-8 0 4 4 0 008 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      name="photo" 
                      id="photo" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200" 
                    />
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          {/* Employment Details */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Employment Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employee_id_code" className="block text-sm font-medium text-slate-700 mb-2">Employee ID Code</label>
                <input 
                  type="text" 
                  name="employee_id_code" 
                  value={formData.employee_id_code} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="job_title" className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
                <input 
                  type="text" 
                  name="job_title" 
                  value={formData.job_title} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="employment_type" className="block text-sm font-medium text-slate-700 mb-2">Employment Type</label>
                <select 
                  name="employment_type" 
                  value={formData.employment_type} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                >
                  <option>Permanent</option>
                  <option>Contract</option>
                  <option>Intern</option>
                </select>
              </div>
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select 
                  name="departmentId" 
                  value={formData.departmentId} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                >
                  <option value="">Select a Department</option>
                  {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="branchId" className="block text-sm font-medium text-slate-700 mb-2">Branch (Optional)</label>
                <select 
                  name="branchId" 
                  value={formData.branchId} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                >
                  <option value="">Select a Branch</option>
                  {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          {/* Financial & Legal */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Financial & Legal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                <input 
                  type="text" 
                  name="bank_name" 
                  value={formData.bank_name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="bank_account_number" className="block text-sm font-medium text-slate-700 mb-2">Bank Account Number</label>
                <input 
                  type="text" 
                  name="bank_account_number" 
                  value={formData.bank_account_number} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div className="col-span-full">
                <label htmlFor="ssnit_number" className="block text-sm font-medium text-slate-700 mb-2">SSNIT Number</label>
                <input 
                  type="text" 
                  name="ssnit_number" 
                  value={formData.ssnit_number} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Emergency Contact</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Name</label>
                <input 
                  type="text" 
                  name="emergency_contact_name" 
                  value={formData.emergency_contact_name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Phone</label>
                <input 
                  type="text" 
                  name="emergency_contact_phone" 
                  value={formData.emergency_contact_phone} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white" 
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-end space-x-4">
              <button 
                type="button" 
                onClick={() => navigate('/employees')} 
                className="px-6 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Employee...
                  </div>
                ) : (
                  'Create Employee'
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