import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const formInitialState = {
    name: '',
    code: '',
    region: '',
    address: '',
};

export default function AddNewBranchPage() {
  const [formData, setFormData] = useState(formInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await axios.post('http://localhost:3000/branches', formData);
      navigate('/branches'); // Redirect to the branch list on success
    } catch (err) {
      setError('Failed to create branch. Please check the data.');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add New Branch</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Branch Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">Branch Code</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
          <input type="text" name="region" value={formData.region} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
        </div>
         <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="pt-4">
          <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {submitting ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  );
}