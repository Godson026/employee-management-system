import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { SearchIcon } from './icons';
// Simple debounce implementation
const debounce = (func: Function, wait: number) => {
  let timeout: number;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Define all the necessary types
interface Department {
  id: string;
  name: string;
}
interface Branch {
  id: string;
  name: string;
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

const PAGE_LIMIT = 6; // How many employees to show per page

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // State for all our filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch departments and branches for the dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
        try {
            const [deptRes, branchRes] = await Promise.all([
                api.get('/departments'),
                api.get('/branches')
            ]);
            setDepartments(deptRes.data);
            setBranches(branchRes.data);
        } catch (err) {
            setError('Could not fetch filter data');
        }
    };
    fetchDropdownData();
  }, []);

  // Fetch employees whenever a filter or the page changes
  useEffect(() => {
    const fetchEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (departmentId) params.append('departmentId', departmentId);
            if (branchId) params.append('branchId', branchId);
            if (showActiveOnly) params.append('status', 'active');
            params.append('page', currentPage.toString());
            params.append('limit', PAGE_LIMIT.toString());
            
            const response = await api.get(`/employees`, { params });
            
            // Handle both array and object responses
            if (Array.isArray(response.data)) {
                // Backend returned array directly
                setEmployees(response.data);
                setTotalEmployees(response.data.length);
            } else {
                // Backend returned { data: [...], count: ... }
                setEmployees(response.data.data || []);
                setTotalEmployees(response.data.count || 0);
            }
        } catch (err) {
            setError('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };
    fetchEmployees();
  }, [searchTerm, departmentId, branchId, showActiveOnly, currentPage]);

  // Debounce handler for search input to avoid API calls on every keystroke
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setCurrentPage(1); // Reset to first page on new search
    }, 500),
    [],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleDelete = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        await api.delete(`/employees/${employeeId}`);
        // Refresh the employee list
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (departmentId) params.append('departmentId', departmentId);
        if (branchId) params.append('branchId', branchId);
        if (showActiveOnly) params.append('status', 'active');
        params.append('page', currentPage.toString());
        params.append('limit', PAGE_LIMIT.toString());
        
        const response = await api.get(`/employees`, { params });
        
        if (Array.isArray(response.data)) {
          setEmployees(response.data);
          setTotalEmployees(response.data.length);
        } else {
          setEmployees(response.data.data || []);
          setTotalEmployees(response.data.count || 0);
        }
      } catch (err) {
        setError('Failed to delete employee.');
      }
    }
  };
    
  const totalPages = Math.max(1, Math.ceil((totalEmployees || 0) / PAGE_LIMIT));

  // Enhanced Status Pill Component
  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        status === 'active' 
          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
      }`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        status === 'active' ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      {status}
    </span>
  );

  // Enhanced Employee Card Component
  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div className="group bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
      {/* Card Header with Gradient Background */}
      <div className="relative p-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div>
              {employee.photo_url ? (
                <img 
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform duration-300" 
                  src={employee.photo_url} 
                  alt={`${employee.first_name} ${employee.last_name}`} 
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {employee.first_name} {employee.last_name}
                </h3>
                <StatusPill status={employee.status} />
              </div>
              <p className="text-sm text-slate-500 truncate">{employee.email}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1 bg-slate-100 px-3 py-1 rounded-full inline-block">
                {employee.job_title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body with Enhanced Details */}
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Department</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{employee.department?.name || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Start Date</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{employee.start_date}</span>
          </div>
          
          {employee.branch && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-600">Branch</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">{employee.branch.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Card Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Link 
              to={`/employees/${employee.id}`} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Link>
            <Link 
              to={`/employees/${employee.id}/edit`} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          </div>
          <button 
            onClick={() => handleDelete(employee.id)} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-200 group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section - Mobile Responsive */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white">
        <div className="px-4 sm:px-8 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Employee Directory</h1>
                <p className="text-base sm:text-xl text-blue-100 max-w-2xl">
                  Manage your team members, track their information, and maintain organizational structure.
                </p>
              </div>
              <Link
                to="/employees/new"
                className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl hover:bg-white/30 transform hover:-translate-y-1 transition-all duration-300 border border-white/20 whitespace-nowrap"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Employee
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Enhanced Filter Bar - Mobile Responsive */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 sm:gap-6">
            {/* Enhanced Search Input - Full width on mobile */}
            <div className="relative flex-1 w-full sm:min-w-[20rem]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                onChange={handleSearchChange} 
                type="text" 
                placeholder="Search employees..." 
                className="w-full pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-base sm:text-lg"
              />
            </div>

            {/* Enhanced Department Filter - Full width on mobile */}
            <div className="w-full sm:w-auto sm:min-w-[14rem]">
              <select 
                onChange={e => { setDepartmentId(e.target.value); setCurrentPage(1); }} 
                className="w-full px-4 py-3 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-base sm:text-lg"
              >
                <option value="">All Departments</option>
                {departments && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Enhanced Branch Filter - Full width on mobile */}
            <div className="w-full sm:w-auto sm:min-w-[14rem]">
              <select 
                onChange={e => { setBranchId(e.target.value); setCurrentPage(1); }} 
                className="w-full px-4 py-3 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-base sm:text-lg"
              >
                <option value="">All Locations</option>
                {branches && branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Enhanced Active Toggle */}
            <div className="flex items-center justify-between sm:justify-start space-x-4">
              <span className="text-base sm:text-lg font-semibold text-slate-700">Active Only</span>
              <button 
                onClick={() => {setShowActiveOnly(!showActiveOnly); setCurrentPage(1);}} 
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showActiveOnly ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showActiveOnly ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Employee Cards Grid */}
        <div className="space-y-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="text-xl text-slate-600 font-medium">Loading employees...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-red-600 font-semibold text-lg">{error}</div>
            </div>
          )}
          
          {!loading && !error && employees && employees.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}

          {!loading && !error && (!employees || employees.length === 0) && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">No employees found</h3>
              <p className="text-slate-600 text-lg mb-8">Get started by adding your first team member to the organization.</p>
              <Link
                to="/employees/new"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Employee
              </Link>
            </div>
          )}
        </div>
      
        {/* Enhanced Pagination - Mobile Responsive */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 sm:mt-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm sm:text-lg text-slate-600 text-center sm:text-left">
                Showing <span className="font-bold text-slate-800">{Math.max(1, ((currentPage || 1) - 1) * PAGE_LIMIT + 1)}</span> to{' '}
                <span className="font-bold text-slate-800">{Math.min((currentPage || 1) * PAGE_LIMIT, Math.max(0, totalEmployees || 0))}</span> of{' '}
                <span className="font-bold text-slate-800">{Math.max(0, totalEmployees || 0)}</span> results
              </div>
              
              <nav className="flex items-center space-x-2 sm:space-x-3">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                  disabled={currentPage === 1} 
                  className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="flex space-x-1 sm:space-x-2">
                  {totalPages > 0 && [...Array(Math.min(totalPages, 5)).keys()].map(num => (
                    <button 
                      key={num + 1} 
                      onClick={() => setCurrentPage(num + 1)} 
                      className={`inline-flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg font-semibold rounded-xl transition-all duration-200 ${
                        currentPage === num + 1 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                          : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 hover:scale-105'
                      }`}
                    >
                      {num + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                  disabled={currentPage === totalPages} 
                  className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}