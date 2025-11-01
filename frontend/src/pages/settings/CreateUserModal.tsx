import { useState } from 'react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  email: string;
}

export default function CreateUserModal({ isOpen, onClose, onSubmit, email }: CreateUserModalProps) {
  const [password, setPassword] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Create User for {email}</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Temporary Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            minLength={8}
            required
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-green-600 text-white rounded hover:shadow-lg transition-all">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
