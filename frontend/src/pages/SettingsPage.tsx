import { useSearchParams } from 'react-router-dom';
import UserManagementTab from './settings/UserManagementTab';
import LeavePoliciesTab from './settings/LeavePoliciesTab';

// Enhanced placeholder components for future tabs
const PlaceholderTab = ({ title }: { title: string }) => (
  <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-600 text-lg">This feature is coming soon. We're working hard to bring you the best experience.</p>
  </div>
);

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'User Management';


  const renderTabContent = () => {
    switch(activeTab) {
      case 'User Management':
        return <UserManagementTab />;
      case 'Leave & Attendance':
        return <LeavePoliciesTab />;
      default:
        return <PlaceholderTab title={activeTab} />;
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white">
        <div className="px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">⚙️ Company Settings</h1>
            <p className="text-xl text-green-100 max-w-2xl">
              Manage your organization's configuration, user accounts, and system policies from one central location.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Now Full Width */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}