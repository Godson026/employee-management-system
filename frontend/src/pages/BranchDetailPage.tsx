import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  MapPinIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  UsersIcon,
  IdentificationIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/solid';

interface BranchDetails {
  id: string;
  name: string;
  code: string;
  region: string;
  address: string;
  branch_manager: { first_name: string; last_name: string; } | null;
  employees: { id: string; first_name: string; last_name: string; job_title: string }[];
}

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [branch, setBranch] = useState<BranchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/branches/${id}`)
        .then(res => setBranch(res.data))
        .catch(() => toast.error('Failed to fetch branch details.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading branch details...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-bold text-lg">Branch not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SIC Life Branded Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Link
                  to="/branches"
                  className="p-2 bg-white/20 backdrop-blur-lg rounded-xl hover:bg-white/30 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                    <MapPinIcon className="w-10 h-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{branch.name}</h1>
                    <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                    <p className="text-lg md:text-xl text-green-50 mt-2">Branch Code: {branch.code}</p>
                  </div>
                </div>
              </div>
              <Link
                to={`/branches/${branch.id}/edit`}
                className="inline-flex items-center px-5 py-2.5 bg-white/20 backdrop-blur-lg rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Branch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Details Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BuildingOffice2Icon className="w-7 h-7 text-green-600 mr-3" />
                Branch Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                  <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                    <UserCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                    Branch Manager
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {branch.branch_manager 
                      ? `${branch.branch_manager.first_name} ${branch.branch_manager.last_name}`
                      : <span className="text-gray-400 italic">Unassigned</span>
                    }
                  </dd>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                  <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-green-600" />
                    Region
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">{branch.region}</dd>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200 md:col-span-2">
                  <dt className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center">
                    <IdentificationIcon className="w-5 h-5 mr-2 text-green-600" />
                    Address
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">{branch.address}</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                  <UsersIcon className="w-10 h-10" />
                </div>
                <p className="text-green-100 text-sm font-bold uppercase tracking-wide mb-2">Total Employees</p>
                <p className="text-5xl font-extrabold">{branch.employees.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="mt-6 md:mt-8 bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 md:px-8 py-5 border-b-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="w-7 h-7 text-green-600 mr-3" />
              Employees in this Branch ({branch.employees.length})
            </h2>
          </div>
          {branch.employees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No employees assigned to this branch</p>
            </div>
          ) : (
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branch.employees.map((emp) => (
                  <Link
                    key={emp.id}
                    to={`/employees/${emp.id}`}
                    className="group bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <BriefcaseIcon className="w-4 h-4 mr-1 text-green-600" />
                            {emp.job_title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
