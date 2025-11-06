import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import LeaveHistoryTab from './profile-tabs/LeaveHistoryTab';
import AttendanceHistoryTab from './profile-tabs/AttendanceHistoryTab';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  MapPinIcon,
  IdentificationIcon,
  CakeIcon,
  UserIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';

interface Employee {
  id: string;
  employee_id_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  job_title: string;
  employment_type: string;
  start_date: string;
  status: string;
  photo_url: string | null;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  bank_name: string;
  bank_account_number: string;
  ssnit_number: string;
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has permission to edit/delete employees
  const canEditDelete = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/employees/${id}`);
        setEmployee(response.data);
      } catch (err) {
        setError('Failed to load employee data.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        await api.delete(`/employees/${id}`);
        navigate('/employees');
      } catch (err) {
        setError('Failed to delete employee.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <TrashIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-bold text-lg">{error || 'Employee not found'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const employeeInitials = `${employee.first_name?.charAt(0) || ''}${employee.last_name?.charAt(0) || ''}`;
  
  // Check if user can view attendance history (Admin or HR Manager)
  const canViewAttendanceHistory = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);
  
  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserCircleIcon },
    { id: 'personal', name: 'Personal Information', icon: IdentificationIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'leave', name: 'Leave History', icon: CalendarDaysIcon },
    ...(canViewAttendanceHistory ? [{ id: 'attendance', name: 'Attendance History', icon: ClockIcon }] : []),
    { id: 'performance', name: 'Performance', icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* SIC Life Branded Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Link
                  to="/employees"
                  className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </Link>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Employee Profile</h1>
                  <p className="text-emerald-600 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                </div>
              </div>
              {canEditDelete && (
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/employees/${employee.id}/edit`}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 bg-red-500 rounded-xl text-white font-semibold hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 md:px-8 py-6 md:py-8 border-b-2 border-green-200">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {employee.photo_url ? (
                  <img
                    className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-green-200"
                    src={employee.photo_url}
                    alt={`${employee.first_name} ${employee.last_name}`}
                  />
                ) : (
                  <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 border-white shadow-2xl ring-4 ring-green-200">
                    <span className="text-white font-bold text-4xl md:text-5xl">{employeeInitials}</span>
                  </div>
                )}
              </div>

              {/* Employee Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                      {employee.first_name} {employee.last_name}
                    </h2>
                    <div className="flex items-center space-x-3 mb-3">
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {employee.job_title}
                      </p>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                        {employee.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <BuildingOffice2Icon className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{employee.department?.name || 'N/A'}</span>
                      </div>
                      {employee.branch && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="w-5 h-5 text-green-600" />
                          <span className="font-medium">{employee.branch.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${employee.email}`}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    Email
                  </a>
                  <a
                    href={`tel:${employee.phone_number}`}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
                      isActive
                        ? 'border-green-600 text-green-700 bg-white'
                        : 'border-transparent text-gray-600 hover:text-green-600 hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                    <UserCircleIcon className="w-6 h-6 text-blue-600 mr-2" />
                    Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {employee.first_name} is a skilled {employee.job_title} with expertise in their field.
                    They have been with the company since <span className="font-semibold">{formatDate(employee.start_date)}</span> and
                    currently work in the <span className="font-semibold">{employee.department?.name || 'N/A'}</span> department.
                  </p>
                </div>

                {/* Job Information */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <BriefcaseIcon className="w-6 h-6 text-green-600 mr-2" />
                    Job Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <IdentificationIcon className="w-4 h-4 mr-2 text-green-600" />
                        Employee ID
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.employee_id_code}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <BuildingOffice2Icon className="w-4 h-4 mr-2 text-green-600" />
                        Department
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.department?.name || 'N/A'}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Job Title</dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.job_title}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <CalendarDaysIcon className="w-4 h-4 mr-2 text-green-600" />
                        Start Date
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{formatDate(employee.start_date)}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Employment Type</dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.employment_type}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2 text-green-600" />
                        Branch
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.branch?.name || 'N/A'}</dd>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <PhoneIcon className="w-6 h-6 text-green-600 mr-2" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <EnvelopeIcon className="w-4 h-4 mr-2 text-green-600" />
                        Email
                      </dt>
                      <dd className="text-lg font-bold text-gray-900 break-all">{employee.email}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-2 text-green-600" />
                        Phone
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.phone_number}</dd>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200 md:col-span-2">
                      <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2 text-green-600" />
                        Address
                      </dt>
                      <dd className="text-lg font-bold text-gray-900">{employee.address}</dd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <UserIcon className="w-6 h-6 text-green-600 mr-2" />
                      Personal Details
                    </h3>
                    <dl className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                          <CakeIcon className="w-4 h-4 mr-2 text-green-600" />
                          Date of Birth
                        </dt>
                        <dd className="text-lg font-bold text-gray-900">{formatDate(employee.date_of_birth)}</dd>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Gender</dt>
                        <dd className="text-lg font-bold text-gray-900">{employee.gender}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <ShieldCheckIcon className="w-6 h-6 text-green-600 mr-2" />
                      Emergency Contact
                    </h3>
                    <dl className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Contact Name</dt>
                        <dd className="text-lg font-bold text-gray-900">{employee.emergency_contact_name}</dd>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-2 text-green-600" />
                          Contact Phone
                        </dt>
                        <dd className="text-lg font-bold text-gray-900">{employee.emergency_contact_phone}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Financial Information */}
                  {(employee.bank_name || employee.bank_account_number || employee.ssnit_number) && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <BanknotesIcon className="w-6 h-6 text-green-600 mr-2" />
                        Financial Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {employee.bank_name && (
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                            <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Bank Name</dt>
                            <dd className="text-lg font-bold text-gray-900">{employee.bank_name}</dd>
                          </div>
                        )}
                        {employee.bank_account_number && (
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                            <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Account Number</dt>
                            <dd className="text-lg font-bold text-gray-900">{employee.bank_account_number}</dd>
                          </div>
                        )}
                        {employee.ssnit_number && (
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                            <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">SSNIT Number</dt>
                            <dd className="text-lg font-bold text-gray-900">{employee.ssnit_number}</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No documents uploaded yet.</p>
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                {employee && <LeaveHistoryTab employeeId={employee.id} />}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                {employee && <AttendanceHistoryTab employeeId={employee.id} />}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No performance data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
