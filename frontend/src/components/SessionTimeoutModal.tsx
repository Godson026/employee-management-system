import { useEffect, useState } from 'react';

interface SessionTimeoutModalProps {
  timeLeft: number; // Time left in seconds
  onContinue: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  timeLeft,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeLeft);

  useEffect(() => {
    setSecondsLeft(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onLogout();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onLogout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 border-2 border-emerald-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Session Timeout Warning</h3>
              <p className="text-sm text-white/90">Your session is about to expire</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4">
              <div className="text-center">
                <div className="text-3xl font-black text-amber-600">
                  {formatTime(secondsLeft)}
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-2">
              You've been inactive for a while
            </p>
            <p className="text-gray-600 text-sm">
              Your session will expire in <span className="font-bold text-amber-600">{formatTime(secondsLeft)}</span>.
              <br />
              Click "Continue Session" to stay logged in.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${(secondsLeft / timeLeft) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContinue}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Continue Session
            </button>
            <button
              onClick={onLogout}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

