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
        <div className="relative min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-auto">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-green-600 rounded-full opacity-10 blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-600 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Content - Responsive Layout */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 py-4 md:py-6 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="flex items-center space-x-3 md:space-x-4 bg-white/10 backdrop-blur-lg rounded-2xl px-4 md:px-6 py-2 md:py-3 border-2 border-white/20 shadow-xl">
                            <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-lg">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                    SIC <span className="text-green-300">Life</span>
                                </h1>
                                <p className="text-green-100 text-xs font-medium hidden md:block">Staff Portal</p>
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="text-center md:text-right">
                            <div className="text-3xl md:text-5xl font-bold text-white tracking-wider">
                                {formatTime(currentTime)}
                            </div>
                            <div className="text-sm md:text-lg text-green-100 font-medium mt-1">
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
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
                                
                                {/* QR Code Container */}
                                <div className="relative bg-white p-6 md:p-10 rounded-3xl shadow-2xl border-4 border-green-200">
                                    {kioskToken ? (
                                        <QRCodeSVG 
                                            value={kioskToken} 
                                            size={window.innerWidth < 768 ? 250 : 380}
                                            level="H"
                                            includeMargin={false}
                                            fgColor="#065f46"
                                            className="animate-fade-in"
                                        />
                                    ) : (
                                        <div className="w-[250px] h-[250px] md:w-[380px] md:h-[380px] flex flex-col items-center justify-center text-gray-400">
                                            <div className="relative">
                                                <div className="animate-spin rounded-full h-16 md:h-20 w-16 md:w-20 border-4 border-green-200"></div>
                                                <div className="animate-spin rounded-full h-16 md:h-20 w-16 md:w-20 border-t-4 border-green-600 absolute top-0 left-0"></div>
                                            </div>
                                            <p className="mt-4 md:mt-6 font-bold text-gray-500 text-sm md:text-lg">Generating QR Code...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Instructions */}
                        <div className="space-y-4 md:space-y-6 order-2 lg:order-2">
                            {/* Title - Dynamic based on mode */}
                            <div className="text-center mb-4 md:mb-8">
                                <div className={`inline-block px-6 py-2 rounded-full mb-4 ${
                                    kioskMode === 'CLOCK_IN' 
                                        ? 'bg-green-500/30 border-2 border-green-300' 
                                        : 'bg-orange-500/30 border-2 border-orange-300'
                                }`}>
                                    <p className={`text-sm md:text-base font-bold ${
                                        kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-100'
                                    }`}>
                                        {kioskMode === 'CLOCK_IN' ? '🌅 Morning Session' : '🌆 Evening Session'}
                                    </p>
                                </div>
                                <h2 className={`text-3xl md:text-5xl font-extrabold mb-2 md:mb-3 ${
                                    kioskMode === 'CLOCK_IN' ? 'text-white' : 'text-orange-100'
                                }`}>
                                    {kioskMode === 'CLOCK_IN' ? 'Clock-In Kiosk' : 'Clock-Out Kiosk'}
                                </h2>
                                <p className={`text-lg md:text-2xl font-medium ${
                                    kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-200'
                                }`}>
                                    {kioskMode === 'CLOCK_IN' 
                                        ? 'Scan the QR code to start your day' 
                                        : 'Scan the QR code to end your day'}
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3 md:p-4 flex items-center space-x-3 animate-pulse">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-red-800 font-semibold text-sm md:text-base">{error}</p>
                                </div>
                            )}

                            {/* Instructions - Dynamic based on mode */}
                            <div className="space-y-3 md:space-y-5">
                                <div className="flex items-start space-x-3 md:space-x-5 bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-5 border-2 border-white/20 hover:bg-white/20 transition-all">
                                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${
                                        kioskMode === 'CLOCK_IN' 
                                            ? 'from-green-500 to-emerald-600' 
                                            : 'from-orange-500 to-red-600'
                                    } text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-lg`}>
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-white text-base md:text-xl mb-1 md:mb-2">Log in to the Staff Portal</h3>
                                        <p className={`text-sm md:text-base ${
                                            kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-100'
                                        }`}>Open the SIC Life EMS application or web portal and sign in using your staff credentials</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 md:space-x-5 bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-5 border-2 border-white/20 hover:bg-white/20 transition-all">
                                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${
                                        kioskMode === 'CLOCK_IN' 
                                            ? 'from-green-500 to-emerald-600' 
                                            : 'from-orange-500 to-red-600'
                                    } text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-lg`}>
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-white text-base md:text-xl mb-1 md:mb-2">Access the Attendance Module</h3>
                                        <p className={`text-sm md:text-base ${
                                            kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-100'
                                        }`}>
                                            {kioskMode === 'CLOCK_IN' 
                                                ? 'From the dashboard, navigate to the "Attendance" tab to view clock-in options'
                                                : 'From the dashboard, navigate to the "Attendance" tab to view clock-out options'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 md:space-x-5 bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-5 border-2 border-white/20 hover:bg-white/20 transition-all">
                                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${
                                        kioskMode === 'CLOCK_IN' 
                                            ? 'from-green-500 to-emerald-600' 
                                            : 'from-orange-500 to-red-600'
                                    } text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-lg`}>
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-white text-base md:text-xl mb-1 md:mb-2">Record Your Attendance</h3>
                                        <p className={`text-sm md:text-base ${
                                            kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-100'
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
                                <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-4 border-2 border-blue-300/30">
                                    <div className="flex items-start space-x-3">
                                        <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-200 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-blue-100 mb-2 text-sm md:text-base">Attendance Rules</h4>
                                            <div className="space-y-1.5 text-xs md:text-sm text-blue-50">
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    <span><strong>On Time:</strong> Clock in before or at 8:00 AM</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                    <span><strong>Late:</strong> Clock in after 8:00 AM</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                                    <span><strong>Absent:</strong> No clock-in for the day</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Auto-refresh Notice */}
                            <div className={`flex items-center justify-center space-x-2 md:space-x-3 backdrop-blur-lg rounded-2xl p-3 md:p-4 border-2 mt-4 md:mt-8 ${
                                kioskMode === 'CLOCK_IN'
                                    ? 'bg-green-500/20 border-green-300/30'
                                    : 'bg-orange-500/20 border-orange-300/30'
                            }`}>
                                <svg className={`w-5 h-5 md:w-6 md:h-6 animate-pulse ${
                                    kioskMode === 'CLOCK_IN' ? 'text-green-200' : 'text-orange-200'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <p className={`font-bold text-sm md:text-base ${
                                    kioskMode === 'CLOCK_IN' ? 'text-green-100' : 'text-orange-100'
                                }`}>
                                    Mode changes automatically at 4:00 PM
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 py-3 md:py-4 text-center px-4">
                    <p className="text-green-100 text-xs md:text-sm font-medium">
                        Powered by SIC Life Staff Portal
                    </p>
                    <p className="text-green-200 text-xs mt-1 md:hidden">Absolute peace of mind</p>
                    <p className="text-green-100 text-xs md:text-sm font-medium hidden md:block">
                        Absolute peace of mind
                    </p>
                </div>
            </div>
        </div>
    );
}
