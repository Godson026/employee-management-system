import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import { Notification, NotificationType } from '../types';
import toast from 'react-hot-toast';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ClockIcon as ClockIconSolid,
  SpeakerWaveIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/solid';
import {
  BellAlertIcon,
} from '@heroicons/react/24/outline';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/notifications?limit=20'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notificationsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new notifications every 5 seconds for real-time updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Reduced from 30s to 5s
    return () => clearInterval(interval);
  }, []);

  // Listen for custom events to trigger immediate notification refresh
  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications();
    };
    
    // Listen for custom refresh events
    window.addEventListener('notification:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('notification:refresh', handleRefresh);
    };
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      
      if (isMobile) {
        // On mobile, use full-width with small margins and position from top
        const margin = 12; // 12px margin on each side
        setDropdownPosition({
          top: buttonRect.bottom + 8,
          left: margin,
        });
      } else {
        // On desktop, position below the button, aligned to the right edge of the button
        const dropdownWidth = 384; // w-96 = 384px (xl:w-96)
        const gap = 8; // Gap between button and dropdown
        
        // Calculate left position to align right edge of dropdown with right edge of button
        let left = buttonRect.right - dropdownWidth;
        
        // Ensure it doesn't go off the left edge of the screen
        const minLeft = 16; // Minimum margin from left edge
        if (left < minLeft) {
          left = minLeft;
        }
        
        // Ensure it doesn't go off the right edge of the screen
        const maxLeft = window.innerWidth - dropdownWidth - 16;
        if (left > maxLeft) {
          left = maxLeft;
        }
        
        setDropdownPosition({
          top: buttonRect.bottom + gap,
          left: left,
        });
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
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
      setUnreadCount(0);
      toast.success('All notifications cleared');
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          // Refresh notifications immediately when opening the dropdown
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2.5 md:p-3 rounded-2xl bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm border border-emerald-200/50 shadow-md hover:shadow-lg hover:from-white hover:to-emerald-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 group"
        aria-label="Notifications"
        type="button"
      >
        <div className="relative">
          <BellAlertIcon className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 transition-transform duration-200 group-hover:scale-110 group-hover:text-emerald-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-black leading-none text-white transform bg-gradient-to-br from-red-500 to-red-600 rounded-full min-w-[20px] h-5 shadow-lg ring-2 ring-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown - Fixed positioning to appear to the right of sidebar */}
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99] lg:hidden transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl border-t-2 lg:border-2 border-green-100 z-[100] max-h-[85vh] lg:max-h-[600px] flex flex-col overflow-hidden animate-slide-up backdrop-blur-xl
                       w-[calc(100vw-24px)] lg:w-80 xl:w-96"
            style={{ 
              top: `${dropdownPosition.top}px`, 
              left: `${dropdownPosition.left}px`,
            }}
          >
          {/* Header - SIC Life Branded */}
          <div className="px-4 py-3 lg:px-5 lg:py-4 bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
                <div className="p-1.5 lg:p-2 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
                  <BellAlertIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-bold text-white tracking-tight truncate">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-green-100 font-medium mt-0.5">{unreadCount} new</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 lg:space-x-2 flex-shrink-0 ml-2">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="px-2.5 py-1.5 lg:px-3 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm active:scale-95 touch-manipulation"
                  >
                    <span className="hidden sm:inline">Mark all read</span>
                    <span className="sm:hidden">Read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                    className="px-2.5 py-1.5 lg:px-3 text-xs font-semibold text-white bg-red-500/80 hover:bg-red-600/90 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation"
                  >
                    <span className="hidden sm:inline">Clear all</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar bg-gradient-to-b from-gray-50/50 via-white to-white">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 lg:py-12">
                <div className="flex flex-col items-center space-y-2 lg:space-y-3">
                  <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-2 border-green-600 border-t-transparent"></div>
                  <p className="text-xs lg:text-sm text-gray-500 font-medium">Loading notifications...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 lg:p-12 text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-3 lg:mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <BellAlertIcon className="w-8 h-8 lg:w-10 lg:h-10 text-green-500" />
                </div>
                <p className="text-sm lg:text-base font-semibold text-gray-700 mb-1">All caught up!</p>
                <p className="text-xs lg:text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/80">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      group relative px-4 py-3 lg:px-5 lg:py-4 transition-all duration-200 active:bg-gray-100/50
                      ${!notification.is_read 
                        ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/30 hover:from-green-100/70 hover:to-emerald-100/50 border-l-4 border-green-500' 
                        : 'hover:bg-gray-50/80 border-l-4 border-transparent hover:border-green-200'
                      }
                      ${notification.link ? 'cursor-pointer touch-manipulation' : 'cursor-default'}
                      animate-fade-in
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-3 lg:space-x-4">
                      {/* Icon with gradient background */}
                      <div className={`flex-shrink-0 p-2 lg:p-2.5 rounded-xl ${getNotificationIconBg(notification.type)} shadow-lg group-active:scale-95 lg:group-hover:scale-110 transition-transform duration-200`}>
                        <div className="text-white">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 lg:gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs lg:text-sm font-bold leading-tight ${
                                !notification.is_read 
                                  ? 'text-gray-900' 
                                  : 'text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-1 lg:mt-1.5 text-xs lg:text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-1.5 lg:mt-2 space-x-2">
                              <p className="text-xs font-medium text-gray-400">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-sm animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 lg:px-5 py-2.5 lg:py-3 border-t border-gray-200/80 bg-gradient-to-r from-green-50 to-emerald-50">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 lg:py-2 text-sm font-semibold text-green-700 hover:text-green-800 active:text-green-900 bg-white/80 hover:bg-white active:bg-white rounded-lg transition-all duration-200 active:scale-95 lg:hover:shadow-md lg:hover:scale-[1.02] border border-green-200/50 touch-manipulation"
              >
                <span className="text-xs lg:text-sm">View all notifications</span>
                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

