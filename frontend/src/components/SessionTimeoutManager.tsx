import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutModal from './SessionTimeoutModal';

export default function SessionTimeoutManager() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute default

  const handleTimeout = () => {
    logout();
    toast.error('Your session has expired due to inactivity. Please log in again.', {
      duration: 5000,
      icon: '⏱️',
    });
    navigate('/login');
  };

  const handleWarning = (timeLeftSeconds: number) => {
    setTimeLeft(timeLeftSeconds);
    setShowWarning(true);
  };

  const handleContinue = () => {
    setShowWarning(false);
    // Explicitly reset the timeout when user continues
    resetTimeout();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    handleTimeout();
  };

  const { resetTimeout } = useSessionTimeout({
    onTimeout: handleTimeout,
    onWarning: handleWarning,
    timeoutMinutes: 30, // 30 minutes of inactivity
    warningMinutes: 1, // Show warning 1 minute before timeout
  });

  // Only activate timeout when authenticated
  useEffect(() => {
    if (!isAuthenticated && showWarning) {
      setShowWarning(false);
    }
  }, [isAuthenticated, showWarning]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {showWarning && (
        <SessionTimeoutModal
          timeLeft={timeLeft}
          onContinue={handleContinue}
          onLogout={handleLogoutNow}
        />
      )}
    </>
  );
}

