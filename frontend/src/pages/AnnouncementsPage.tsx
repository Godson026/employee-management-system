import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../api';
import { Announcement, AnnouncementPriority } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import {
  MegaphoneIcon as MegaphoneIconOutline,
} from '@heroicons/react/24/outline';

const getPriorityIcon = (priority: AnnouncementPriority) => {
  switch (priority) {
    case AnnouncementPriority.URGENT:
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    case AnnouncementPriority.IMPORTANT:
      return <CheckCircleIcon className="w-5 h-5 text-yellow-500" />;
    case AnnouncementPriority.INFO:
    default:
      return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
  }
};

const getPriorityBadge = (priority: AnnouncementPriority) => {
  switch (priority) {
    case AnnouncementPriority.URGENT:
      return 'bg-red-100 text-red-800 border-red-200';
    case AnnouncementPriority.IMPORTANT:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case AnnouncementPriority.INFO:
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAnnouncement?: Announcement | null;
}

const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingAnnouncement,
}: CreateAnnouncementModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: AnnouncementPriority.INFO,
    expires_at: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingAnnouncement) {
      setFormData({
        title: editingAnnouncement.title,
        message: editingAnnouncement.message,
        priority: editingAnnouncement.priority,
        expires_at: editingAnnouncement.expires_at
          ? format(new Date(editingAnnouncement.expires_at), "yyyy-MM-dd'T'HH:mm")
          : '',
        is_active: editingAnnouncement.is_active,
      });
    } else {
      setFormData({
        title: '',
        message: '',
        priority: AnnouncementPriority.INFO,
        expires_at: '',
        is_active: true,
      });
    }
  }, [editingAnnouncement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAnnouncement) {
        await api.patch(`/announcements/${editingAnnouncement.id}`, formData);
        toast.success('Announcement updated successfully');
      } else {
        await api.post('/announcements', formData);
        toast.success('Announcement created and sent to all users!');
        
        // Trigger notification refresh
        window.dispatchEvent(new CustomEvent('notification:refresh'));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="Enter announcement title..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none"
              placeholder="Enter announcement message..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              >
                <option value={AnnouncementPriority.INFO}>Info</option>
                <option value={AnnouncementPriority.IMPORTANT}>Important</option>
                <option value={AnnouncementPriority.URGENT}>Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (announcement will be visible to users)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AnnouncementsPage() {
  const { hasRole } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const isAdminOrHR = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);

  useEffect(() => {
    fetchAnnouncements();
    
    // Listen for refresh events
    const handleRefresh = () => {
      fetchAnnouncements();
    };
    
    window.addEventListener('announcement:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('announcement:refresh', handleRefresh);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === 'active') return announcement.is_active;
    if (filter === 'inactive') return !announcement.is_active;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* SIC Life Branded Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                  <MegaphoneIconOutline className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Company Announcements</h1>
                  <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                  <p className="text-lg md:text-xl text-green-50 mt-2 max-w-3xl">
                    {isAdminOrHR
                      ? 'Create and manage company-wide announcements'
                      : 'Stay informed with the latest company updates'}
                  </p>
                </div>
              </div>
              {isAdminOrHR && (
                <button
                  onClick={handleCreate}
                  className="hidden md:flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>New Announcement</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Mobile Create Button */}
        {isAdminOrHR && (
          <div className="md:hidden mb-6">
            <button
              onClick={handleCreate}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Announcement</span>
            </button>
          </div>
        )}

        {/* Filters - Only for Admin/HR */}
        {isAdminOrHR && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-4 mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  filter === 'inactive'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading announcements...</p>
              </div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                <MegaphoneIconOutline className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">No announcements found</p>
              <p className="text-gray-500">
                {filter !== 'all'
                  ? 'No announcements match your filter criteria'
                  : isAdminOrHR
                  ? 'Create your first announcement to notify all employees'
                  : 'No announcements at this time'}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-2xl shadow-xl border-2 ${
                  announcement.is_active ? 'border-green-200' : 'border-gray-200'
                } overflow-hidden`}
              >
                <div className={`p-6 ${announcement.is_active ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-xl ${getPriorityBadge(announcement.priority)}`}>
                          {getPriorityIcon(announcement.priority)}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{announcement.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getPriorityBadge(announcement.priority)}`}>
                          {announcement.priority.toUpperCase()}
                        </span>
                        {!announcement.is_active && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border-2 border-gray-300">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Created by:{' '}
                          <span className="font-semibold text-gray-700">
                            {announcement.created_by.employee
                              ? `${announcement.created_by.employee.first_name} ${announcement.created_by.employee.last_name}`
                              : announcement.created_by.email}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {announcement.expires_at && (
                          <>
                            <span>•</span>
                            <span>
                              Expires: {format(new Date(announcement.expires_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isAdminOrHR && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSuccess={fetchAnnouncements}
        editingAnnouncement={editingAnnouncement}
      />
    </div>
  );
}

