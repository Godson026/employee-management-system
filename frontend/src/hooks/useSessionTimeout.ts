import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  onTimeout: () => void;
  onWarning?: (timeLeft: number) => void;
  timeoutMinutes?: number; // Total inactivity timeout in minutes (default: 30)
  warningMinutes?: number; // Show warning X minutes before timeout (default: 1)
  activityEvents?: string[]; // Events to track as activity
}

const DEFAULT_TIMEOUT_MINUTES = 30;
const DEFAULT_WARNING_MINUTES = 1;
const DEFAULT_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

export function useSessionTimeout({
  onTimeout,
  onWarning,
  timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
  warningMinutes = DEFAULT_WARNING_MINUTES,
  activityEvents = DEFAULT_ACTIVITY_EVENTS,
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    lastActivityRef.current = Date.now();
    isWarningShownRef.current = false;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Set warning timeout
    if (onWarning && warningMs > 0) {
      warningRef.current = setTimeout(() => {
        isWarningShownRef.current = true;
        const timeLeft = warningMinutes * 60; // seconds
        onWarning(timeLeft);
      }, warningMs);
    }

    // Set actual timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMinutes, warningMinutes, onTimeout, onWarning]);

  const handleActivity = useCallback(() => {
    // Only reset if user is active (not already timed out)
    if (!isWarningShownRef.current || Date.now() - lastActivityRef.current < 1000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    // Initialize timeout on mount
    resetTimeout();

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Also track visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check if we should reset timeout
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        const maxInactiveTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
        
        if (timeSinceLastActivity < maxInactiveTime) {
          resetTimeout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [activityEvents, handleActivity, resetTimeout, timeoutMinutes, warningMinutes]);

  // Expose reset function for manual refresh (e.g., after warning acknowledged)
  return {
    resetTimeout,
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
  };
}

