import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api';
import { Notification, NotificationType, Announcement } from '../types';
import toast from 'react-hot-toast';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ClockIcon as ClockIconSolid,
  SpeakerWaveIcon,
  DocumentTextIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import {
  BellAlertIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const getNotificationIcon = (type: NotificationType) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case NotificationType.LEAVE_REQUEST:
      return <DocumentTextIcon className={iconClass} />;
    case NotificationType.LEAVE_SUBMITTED:
      return <ArrowUpTrayIcon className={iconClass} />;
    case NotificationType.LEAVE_APPROVED:
      return <CheckCircleIcon className={iconClass} />;
    case NotificationType.LEAVE_REJECTED:
      return <XCircleIcon className={iconClass} />;
    case NotificationType.ATTENDANCE_REMINDER:
      return <ClockIconSolid className={iconClass} />;
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return <SpeakerWaveIcon className={iconClass} />;
    default:
      return <BellIcon className={iconClass} />;
  }
};

const getNotificationIconBg = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LEAVE_REQUEST:
      return 'bg-gradient-to-br from-blue-500 to-indigo-600';
    case NotificationType.LEAVE_SUBMITTED:
      return 'bg-gradient-to-br from-indigo-500 to-purple-600';
    case NotificationType.LEAVE_APPROVED:
      return 'bg-gradient-to-br from-green-500 to-emerald-600';
    case NotificationType.LEAVE_REJECTED:
      return 'bg-gradient-to-br from-red-500 to-rose-600';
    case NotificationType.ATTENDANCE_REMINDER:
      return 'bg-gradient-to-br from-yellow-500 to-orange-600';
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return 'bg-gradient-to-br from-purple-500 to-pink-600';
    default:
      return 'bg-gradient-to-br from-gray-500 to-gray-600';
  }
};

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LEAVE_REQUEST:
      return 'Leave Request';
    case NotificationType.LEAVE_SUBMITTED:
      return 'Leave Submitted';
    case NotificationType.LEAVE_APPROVED:
      return 'Leave Approved';
    case NotificationType.LEAVE_REJECTED:
      return 'Leave Rejected';
    case NotificationType.ATTENDANCE_REMINDER:
      return 'Attendance Reminder';
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return 'System Announcement';
    default:
      return 'Notification';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchNotifications();
    
    // Listen for refresh events
    const handleRefresh = () => {
      fetchNotifications();
    };
    
    window.addEventListener('notification:refresh', handleRefresh);
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => {
      window.removeEventListener('notification:refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  // Load notification detail when ID is in URL
  useEffect(() => {
    const notificationId = searchParams.get('id');
    if (notificationId) {
      loadNotificationDetail(notificationId);
    } else {
      setSelectedNotification(null);
      setSelectedAnnouncement(null);
    }
  }, [searchParams]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filter, typeFilter, searchQuery]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/notifications?limit=100'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notificationsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Filter by read/unread status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
      toast.success('Notification marked as unread');
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setFilteredNotifications([]);
      setUnreadCount(0);
      setSelectedNotification(null);
      setSelectedAnnouncement(null);
      setSearchParams({});
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const loadNotificationDetail = async (notificationId: string) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/notifications/${notificationId}`);
      const notification = response.data;
      setSelectedNotification(notification);

      // If it's a system announcement, load the announcement details
      if (notification.type === NotificationType.SYSTEM_ANNOUNCEMENT && notification.metadata?.announcement_id) {
        try {
          const announcementResponse = await api.get(`/announcements/${notification.metadata.announcement_id}`);
          setSelectedAnnouncement(announcementResponse.data);
        } catch (error) {
          console.error('Error loading announcement:', error);
          // Don't show error - announcement might have been deleted
        }
      }

      // Mark as read if unread
      if (!notification.is_read) {
        await markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error loading notification detail:', error);
      toast.error('Failed to load notification details');
      setSelectedNotification(null);
      setSelectedAnnouncement(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Navigate to notification detail
    setSearchParams({ id: notification.id });
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const readNotifications = notifications.filter(n => n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* SIC Life Branded Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg ring-2 ring-white/30">
                <BellAlertIcon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Notifications</h1>
                <p className="text-green-100 text-sm md:text-base mt-1 font-medium">SIC Life Employee Management System</p>
                <p className="text-lg md:text-xl text-green-50 mt-2 max-w-3xl">
                  Stay updated with all your notifications and alerts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Notification Detail Panel */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Notification Details</h2>
                <button
                  onClick={() => {
                    setSearchParams({});
                    setSelectedNotification(null);
                    setSelectedAnnouncement(null);
                  }}
                  className="text-white hover:text-green-100 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Notification Info */}
                    <div className="flex items-start space-x-4">
                      <div className={`p-4 rounded-xl ${getNotificationIconBg(selectedNotification.type)} shadow-lg`}>
                        <div className="text-white">
                          {getNotificationIcon(selectedNotification.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedNotification.title}</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-4">
                          {selectedNotification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {format(new Date(selectedNotification.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(selectedNotification.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>•</span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">
                            {getNotificationTypeLabel(selectedNotification.type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Announcement Details (if applicable) */}
                    {selectedNotification.type === NotificationType.SYSTEM_ANNOUNCEMENT && (
                      <>
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Announcement Details</h4>
                          {selectedAnnouncement ? (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className={`p-2 rounded-xl ${
                                  selectedAnnouncement.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                  selectedAnnouncement.priority === 'important' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  <SpeakerWaveIcon className="w-5 h-5" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                                  selectedAnnouncement.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                                  selectedAnnouncement.priority === 'important' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                  {selectedAnnouncement.priority.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                                {selectedAnnouncement.message}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>
                                  Created by:{' '}
                                  <span className="font-semibold text-gray-700">
                                    {selectedAnnouncement.created_by.employee
                                      ? `${selectedAnnouncement.created_by.employee.first_name} ${selectedAnnouncement.created_by.employee.last_name}`
                                      : selectedAnnouncement.created_by.email}
                                  </span>
                                </span>
                                {selectedAnnouncement.expires_at && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Expires: {format(new Date(selectedAnnouncement.expires_at), 'MMM dd, yyyy HH:mm')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Announcement details not available</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-6 flex items-center space-x-4">
                      {!selectedNotification.is_read ? (
                        <button
                          onClick={() => markAsRead(selectedNotification.id)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          Mark as Read
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsUnread(selectedNotification.id)}
                          className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          Mark as Unread
                        </button>
                      )}
                      {selectedNotification.link && (
                        <button
                          onClick={() => {
                            if (selectedNotification.link) {
                              navigate(selectedNotification.link);
                            }
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          Go to Related Page
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  {notifications.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <BellIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Unread</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {unreadNotifications}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <BellAlertIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Read</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                  {readNotifications}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-md">
                <CheckIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 relative ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  filter === 'read'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read
              </button>
            </div>
          </div>

          {/* Type Filter */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filter by Type:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === 'all'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Types
              </button>
              {Object.values(NotificationType).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === type
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getNotificationTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Mark All as Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Clear All Notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                <BellAlertIcon className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">
                {searchQuery || filter !== 'all' || typeFilter !== 'all'
                  ? 'No notifications match your filters'
                  : 'No notifications yet'}
              </p>
              <p className="text-gray-500">
                {searchQuery || filter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You\'re all caught up! New notifications will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative px-6 py-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                    !notification.is_read
                      ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/30 border-l-4 border-green-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  } ${selectedNotification?.id === notification.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-3 rounded-xl ${getNotificationIconBg(notification.type)} shadow-lg`}>
                      <div className="text-white">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p
                              className={`text-base font-bold ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="font-medium">
                              {format(new Date(notification.created_at), 'MMM dd, yyyy')}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full font-semibold">
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {!notification.is_read ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsUnread(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          )}
                          {notification.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(notification.link!);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                              title="Go to related page"
                            >
                              Go to Page
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

