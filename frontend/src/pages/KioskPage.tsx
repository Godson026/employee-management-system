import { useState, useEffect } from 'react';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';

type KioskMode = 'CLOCK_IN' | 'CLOCK_OUT';

export default function KioskPage() {
    const [kioskToken, setKioskToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [kioskMode, setKioskMode] = useState<KioskMode>('CLOCK_IN');

    const fetchKioskData = () => {
        Promise.all([
            api.get('/kiosk/generate-token'),
            api.get('/kiosk/mode')
        ])
            .then(([tokenRes, modeRes]) => {
                setKioskToken(tokenRes.data.kiosk_token);
                setKioskMode(modeRes.data.mode);
                setError('');
            })
            .catch(() => setError('Could not generate QR Code. Please ensure you are logged in as an admin.'));
    };

    // Fetch the token and mode when the page loads, and then every minute
    useEffect(() => {
        fetchKioskData();
        const interval = setInterval(fetchKioskData, 60 * 1000); // Refresh every 60 seconds
        return () => clearInterval(interval); // Clean up on component unmount
    }, []);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 overflow-auto">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content - Responsive Layout */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 py-6 md:py-8 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex items-center space-x-4 md:space-x-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl px-6 md:px-8 py-3 md:py-4 border border-white/20 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-400/30 rounded-2xl blur-xl"></div>
                                <div className="relative p-2.5 md:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                                    <svg className="w-7 h-7 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-emerald-50 to-teal-50 bg-clip-text text-transparent">
                                    SIC <span className="text-emerald-300">Life</span>
                                </h1>
                                <p className="text-emerald-100/90 text-sm font-semibold hidden md:block tracking-wide">Staff Portal</p>
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="text-center md:text-right bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl px-6 md:px-8 py-4 md:py-5 border border-white/20 shadow-2xl">
                            <div className="text-4xl md:text-6xl font-black text-white tracking-tight mb-1 drop-shadow-lg">
                                {formatTime(currentTime)}
                            </div>
                            <div className="text-base md:text-xl text-emerald-100 font-semibold tracking-wide">
                                {formatDate(currentTime)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Responsive Two Column/Single Column */}
                <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-4 md:pb-8">
                    <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
                        {/* Left Column - QR Code */}
                        <div className="flex items-center justify-center order-1 lg:order-1">
                            <div className="relative">
                                {/* QR Code Border Animation */}
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 rounded-[2.5rem] blur-3xl opacity-50 animate-pulse"></div>
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 rounded-[2.5rem] blur-xl"></div>
                                
                                {/* QR Code Container */}
                                <div className="relative bg-gradient-to-br from-white to-emerald-50/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border-2 border-emerald-200/50 backdrop-blur-sm">
                                    <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                    {kioskToken ? (
                                        <div className="relative">
                                            <QRCodeSVG 
                                                value={kioskToken} 
                                                size={window.innerWidth < 768 ? 280 : 420}
                                                level="H"
                                                includeMargin={false}
                                                fgColor="#059669"
                                                className="drop-shadow-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-[280px] h-[280px] md:w-[420px] md:h-[420px] flex flex-col items-center justify-center">
                                            <div className="relative">
                                                <div className="animate-spin rounded-full h-20 md:h-24 w-20 md:w-24 border-4 border-emerald-200/50"></div>
                                                <div className="animate-spin rounded-full h-20 md:h-24 w-20 md:w-24 border-t-4 border-emerald-600 absolute top-0 left-0"></div>
                                            </div>
                                            <p className="mt-6 md:mt-8 font-bold text-emerald-700 text-base md:text-lg">Generating QR Code...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Instructions */}
                        <div className="space-y-4 md:space-y-6 order-2 lg:order-2">
                            {/* Title - Dynamic based on mode */}
                            <div className="text-center mb-6 md:mb-10">
                                <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full mb-5 backdrop-blur-xl border ${
                                    kioskMode === 'CLOCK_IN' 
                                        ? 'bg-emerald-500/20 border-emerald-300/40 shadow-lg shadow-emerald-500/10' 
                                        : 'bg-teal-500/20 border-teal-300/40 shadow-lg shadow-teal-500/10'
                                }`}>
                                    <span className="text-lg">{kioskMode === 'CLOCK_IN' ? '🌅' : '🌆'}</span>
                                    <p className={`text-sm md:text-base font-bold ${
                                        kioskMode === 'CLOCK_IN' ? 'text-emerald-100' : 'text-teal-100'
                                    }`}>
                                        {kioskMode === 'CLOCK_IN' ? 'Morning Session' : 'Evening Session'}
                                    </p>
                                </div>
                                <h2 className={`text-4xl md:text-6xl font-black mb-3 md:mb-4 tracking-tight drop-shadow-lg ${
                                    kioskMode === 'CLOCK_IN' 
                                        ? 'bg-gradient-to-r from-white via-emerald-50 to-teal-50 bg-clip-text text-transparent' 
                                        : 'bg-gradient-to-r from-white via-teal-50 to-cyan-50 bg-clip-text text-transparent'
                                }`}>
                                    {kioskMode === 'CLOCK_IN' ? 'Clock-In Kiosk' : 'Clock-Out Kiosk'}
                                </h2>
                                <p className={`text-xl md:text-2xl font-semibold ${
                                    kioskMode === 'CLOCK_IN' ? 'text-emerald-100' : 'text-teal-100'
                                }`}>
                                    {kioskMode === 'CLOCK_IN' 
                                        ? 'Use the Staff Portal to start your day' 
                                        : 'Use the Staff Portal to end your day'}
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-gradient-to-br from-rose-500/20 to-red-500/20 backdrop-blur-xl border border-rose-300/40 rounded-3xl p-4 md:p-5 flex items-center space-x-4 shadow-xl animate-pulse">
                                    <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-rose-400/30 rounded-lg blur-lg"></div>
                                        <div className="relative p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg">
                                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-rose-50 font-bold text-sm md:text-base">{error}</p>
                                </div>
                            )}

                            {/* Instructions - Dynamic based on mode */}
                            <div className="space-y-4 md:space-y-5">
                                <div className="group flex items-start space-x-4 md:space-x-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-[1.02]">
                                    <div className="relative flex-shrink-0">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-400/50 to-teal-500/50' 
                                                : 'from-teal-400/50 to-cyan-500/50'
                                        } rounded-2xl blur-lg group-hover:blur-xl transition-all`}></div>
                                        <div className={`relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-500 to-teal-600' 
                                                : 'from-teal-500 to-cyan-600'
                                        } text-white rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg`}>
                                            1
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="font-black text-white text-lg md:text-xl mb-2 tracking-tight">Log in to the Staff Portal</h3>
                                        <p className={`text-sm md:text-base leading-relaxed ${
                                            kioskMode === 'CLOCK_IN' ? 'text-emerald-50/90' : 'text-teal-50/90'
                                        }`}>Open the SIC Life EMS application or web portal and sign in using your staff credentials</p>
                                    </div>
                                </div>

                                <div className="group flex items-start space-x-4 md:space-x-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-[1.02]">
                                    <div className="relative flex-shrink-0">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-400/50 to-teal-500/50' 
                                                : 'from-teal-400/50 to-cyan-500/50'
                                        } rounded-2xl blur-lg group-hover:blur-xl transition-all`}></div>
                                        <div className={`relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-500 to-teal-600' 
                                                : 'from-teal-500 to-cyan-600'
                                        } text-white rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg`}>
                                            2
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="font-black text-white text-lg md:text-xl mb-2 tracking-tight">Access the Attendance Module</h3>
                                        <p className={`text-sm md:text-base leading-relaxed ${
                                            kioskMode === 'CLOCK_IN' ? 'text-emerald-50/90' : 'text-teal-50/90'
                                        }`}>
                                            {kioskMode === 'CLOCK_IN' 
                                                ? 'From the dashboard, navigate to the "Attendance" tab to view clock-in options'
                                                : 'From the dashboard, navigate to the "Attendance" tab to view clock-out options'}
                                        </p>
                                    </div>
                                </div>

                                <div className="group flex items-start space-x-4 md:space-x-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-[1.02]">
                                    <div className="relative flex-shrink-0">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-400/50 to-teal-500/50' 
                                                : 'from-teal-400/50 to-cyan-500/50'
                                        } rounded-2xl blur-lg group-hover:blur-xl transition-all`}></div>
                                        <div className={`relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${
                                            kioskMode === 'CLOCK_IN' 
                                                ? 'from-emerald-500 to-teal-600' 
                                                : 'from-teal-500 to-cyan-600'
                                        } text-white rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg`}>
                                            3
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="font-black text-white text-lg md:text-xl mb-2 tracking-tight">Record Your Attendance</h3>
                                        <p className={`text-sm md:text-base leading-relaxed ${
                                            kioskMode === 'CLOCK_IN' ? 'text-emerald-50/90' : 'text-teal-50/90'
                                        }`}>
                                            {kioskMode === 'CLOCK_IN' 
                                                ? 'Click the "Clock In" button to register your attendance for the day. A confirmation message will appear once your clock-in is successfully recorded' 
                                                : 'Click the "Clock Out" button to register your clock-out time. A confirmation message will appear once your clock-out is successfully recorded'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Rules Card - Only show in Clock-In mode */}
                            {kioskMode === 'CLOCK_IN' && (
                                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-emerald-300/30 shadow-xl">
                                    <div className="flex items-start space-x-4">
                                        <div className="relative flex-shrink-0">
                                            <div className="absolute inset-0 bg-emerald-400/30 rounded-xl blur-lg"></div>
                                            <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-emerald-50 mb-3 text-base md:text-lg tracking-tight">Attendance Rules</h4>
                                            <div className="space-y-2.5 text-sm md:text-base text-emerald-50/90">
                                                <div className="flex items-center space-x-3">
                                                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></span>
                                                    <span><strong className="font-bold">On Time:</strong> Clock in before or at 8:00 AM</span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"></span>
                                                    <span><strong className="font-bold">Late:</strong> Clock in after 8:00 AM</span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="w-2.5 h-2.5 bg-rose-400 rounded-full shadow-lg shadow-rose-400/50"></span>
                                                    <span><strong className="font-bold">Absent:</strong> No clock-in for the day</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Auto-refresh Notice */}
                            <div className={`flex items-center justify-center space-x-3 md:space-x-4 backdrop-blur-xl rounded-3xl p-4 md:p-5 border mt-6 md:mt-8 shadow-lg ${
                                kioskMode === 'CLOCK_IN'
                                    ? 'bg-emerald-500/20 border-emerald-300/30'
                                    : 'bg-teal-500/20 border-teal-300/30'
                            }`}>
                                <svg className={`w-5 h-5 md:w-6 md:h-6 animate-pulse ${
                                    kioskMode === 'CLOCK_IN' ? 'text-emerald-200' : 'text-teal-200'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <p className={`font-bold text-sm md:text-base ${
                                    kioskMode === 'CLOCK_IN' ? 'text-emerald-100' : 'text-teal-100'
                                }`}>
                                    Mode changes automatically at 4:00 PM
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 py-4 md:py-6 text-center px-4">
                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20 shadow-lg max-w-2xl mx-auto">
                        <p className="text-emerald-100 text-sm md:text-base font-semibold tracking-wide">
                            Powered by <span className="text-white font-bold">SIC Life</span> Staff Portal
                        </p>
                        <p className="text-emerald-200/80 text-xs md:text-sm mt-1.5 font-medium italic">
                            Absolute peace of mind
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
