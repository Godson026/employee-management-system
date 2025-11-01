import { Link } from 'react-router-dom';

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-4 text-lg text-gray-700">You do not have the necessary permissions to view this page.</p>
      <p className="mt-2 text-gray-500">Please contact your administrator if you believe this is an error.</p>
      <Link to="/" className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md">
        Return to Safety
      </Link>
    </div>
  );
}
