import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ScannerModal = ({ onClose, onScanSuccess }: { onClose: () => void; onScanSuccess: (result: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const startScanning = async () => {
            try {
                readerRef.current = new BrowserMultiFormatReader();
                setIsScanning(true);
                
                await readerRef.current.decodeFromVideoDevice(
                    null,
                    videoRef.current,
                    (result: any, err: any) => {
                        if (result) {
                            onScanSuccess(result.getText());
                        }
                        if (err && !err.name.includes('NotFoundException')) {
                            console.error('Scan error:', err);
                        }
                    }
                );
            } catch (error) {
                console.error('Camera error:', error);
                toast.error("Could not access camera. Please check permissions.");
                onClose();
            }
        };

        startScanning();

        return () => {
            if (readerRef.current) {
                readerRef.current?.reset();
            }
        };
    }, [onScanSuccess, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <h2 className="text-white text-2xl mb-4">Scan QR Code on Office Kiosk</h2>
            <div className="w-80 h-80 bg-white rounded-lg overflow-hidden">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                />
            </div>
            <div className="mt-4 flex space-x-4">
                <button onClick={onClose} className="bg-white text-black py-2 px-4 rounded">Cancel</button>
                {isScanning && (
                    <div className="text-white text-sm">Point camera at QR code...</div>
                )}
            </div>
        </div>
    );
};


export default function EmployeeDashboard() {
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [actionType, setActionType] = useState<'clock-in' | 'clock-out' | null>(null);
    // Stats state
    const [loading, setLoading] = useState(true);
    const [todayStatus, setTodayStatus] = useState<'Present' | 'Late' | 'Absent' | 'On Leave' | 'Unknown'>('Unknown');
    const [presentDays, setPresentDays] = useState(0);
    const [lateDays, setLateDays] = useState(0);
    const [absentDays, setAbsentDays] = useState(0);
    const [totalDays, setTotalDays] = useState(0);
    const [last7, setLast7] = useState<any[]>([]);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState<Date | null>(null);
    const [elapsed, setElapsed] = useState<string>('');

    const handleActionClick = (type: 'clock-in' | 'clock-out') => {
        setActionType(type);
        setScannerOpen(true);
    };

    const onScanSuccess = async (kioskToken: string) => {
        setScannerOpen(false);
        try {
            toast.loading(`Processing ${actionType}...`);
            await api.post(`/attendance/${actionType}`, { kiosk_token: kioskToken });
            toast.dismiss();
            toast.success(`Successfully ${actionType === 'clock-in' ? 'Clocked In' : 'Clocked Out'}!`);
            // Refresh stats after successful action
            await loadMyAttendance();
        } catch (err) {
            toast.dismiss();
            const errorMsg = (err as any).response?.data?.message || `Failed to ${actionType}.`;
            toast.error(errorMsg);
        }
    };

    const loadMyAttendance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/attendance/my-history');
            const history = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            // Compute stats
            const upper = (s: string | undefined) => (s || '').toUpperCase();
            const presents = history.filter((r: any) => {
                const s = upper(r.status);
                return s === 'PRESENT' || s === 'LATE';
            }).length;
            const lates = history.filter((r: any) => upper(r.status) === 'LATE').length;
            const absents = history.filter((r: any) => upper(r.status) === 'ABSENT').length;
            setPresentDays(presents);
            setLateDays(lates);
            setAbsentDays(absents);
            setTotalDays(history.length);

            // Determine today's status
            const todayStr = new Date().toISOString().split('T')[0];
            const todayRec = history.find((r: any) => r.date === todayStr);
            setTodayStatus((todayRec?.status as any) || 'Absent');

            // Determine live clock-in state
            const clockedIn = Boolean(todayRec?.clock_in_time) && !todayRec?.clock_out_time;
            setIsClockedIn(clockedIn);
            setClockInTime(todayRec?.clock_in_time ? new Date(todayRec.clock_in_time) : null);

            // Recent 7 days
            const recent = history.slice(0, 7);
            setLast7(recent);
        } catch (e) {
            console.error('Failed to load my attendance', e);
            toast.error('Failed to load your attendance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyAttendance();
    }, []);

    // Live elapsed timer while clocked in
    useEffect(() => {
        if (!isClockedIn || !clockInTime) {
            setElapsed('');
            return;
        }
        const formatElapsed = () => {
            const diffMs = Date.now() - clockInTime.getTime();
            const totalSec = Math.floor(diffMs / 1000);
            const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };
        formatElapsed();
        const t = setInterval(formatElapsed, 1000);
        return () => clearInterval(t);
    }, [isClockedIn, clockInTime]);

    return (
        <div className="min-h-screen bg-white">
            {isScannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} onScanSuccess={onScanSuccess} />}

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-fuchsia-500/10" />
                <div className="absolute -top-20 -right-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-24 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
                <div className="relative px-6 py-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-emerald-900 bg-clip-text text-transparent">
                                    My Dashboard
                                </h1>
                                <p className="text-gray-600 mt-2 font-medium">
                                    {format(new Date(), 'EEEE, MMM d, yyyy')} • Welcome to your personal workspace
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-gray-600">Live Data</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 space-y-8">
                {/* Attendance Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Attendance Today</h3>
                        {isClockedIn && (
                            <div className="ml-auto flex items-center space-x-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Clocked in {clockInTime ? `at ${format(clockInTime, 'h:mm a')}` : ''}
                                </span>
                                {elapsed && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                        Time on clock: {elapsed}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleActionClick('clock-in')}
                            disabled={isClockedIn}
                            className={`bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl w-full transition-all duration-300 flex items-center justify-center space-x-2 ${isClockedIn ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 hover:scale-105'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>{isClockedIn ? 'Already Clocked In' : 'Clock In'}</span>
                        </button>
                        <button
                            onClick={() => handleActionClick('clock-out')}
                            disabled={!isClockedIn}
                            className={`bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl w-full transition-all duration-300 flex items-center justify-center space-x-2 ${!isClockedIn ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 hover:scale-105'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Clock Out</span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl shadow-md border p-6">
                        <p className="text-sm font-semibold text-gray-600">Today</p>
                        <p className={`mt-3 text-2xl font-extrabold ${todayStatus === 'Present' ? 'text-green-600' : todayStatus === 'Late' ? 'text-yellow-600' : todayStatus === 'On Leave' ? 'text-blue-600' : 'text-red-600'}`}>{todayStatus}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md border p-6">
                        <p className="text-sm font-semibold text-gray-600">Present Days</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{presentDays}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md border p-6">
                        <p className="text-sm font-semibold text-gray-600">Late Days</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{lateDays}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md border p-6">
                        <p className="text-sm font-semibold text-gray-600">Absent Days</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{absentDays}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md border p-6">
                        <p className="text-sm font-semibold text-gray-600">Attendance Rate</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{totalDays > 0 ? Math.round(((presentDays) / totalDays) * 100) : 0}%</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/80 rounded-2xl shadow-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Recent Attendance</h3>
                        <div className="flex items-center space-x-4">
                            {/* Tiny sparkline of last days */}
                            <div className="hidden md:flex items-end h-6 space-x-1">
                                {last7.slice().reverse().map((r: any, i: number) => {
                                    const color = r.status === 'Present' ? 'bg-emerald-500' : r.status === 'Late' ? 'bg-amber-500' : r.status === 'On Leave' ? 'bg-sky-500' : 'bg-rose-500';
                                    const h = r.status === 'Present' ? 'h-5' : r.status === 'Late' ? 'h-4' : r.status === 'On Leave' ? 'h-3' : 'h-2';
                                    return <span key={i} className={`${color} ${h} w-2 rounded-sm`} />
                                })}
                            </div>
                            <span className="text-sm text-gray-500">Last {last7.length} day(s)</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600">
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Clock In</th>
                                    <th className="py-2 pr-4">Clock Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {last7.map((r: any, idx: number) => (
                                    <tr key={idx} className="border-t">
                                        <td className="py-2 pr-4 text-gray-900">{format(new Date(r.date), 'EEE, MMM d')}</td>
                                        <td className="py-2 pr-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                (r.status || '') === 'Present' ? 'bg-green-100 text-green-700' :
                                                (r.status || '') === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                                (r.status || '') === 'On Leave' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>{r.status}</span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-700">{r.clock_in_time ? format(new Date(r.clock_in_time), 'h:mm a') : '-'}</td>
                                        <td className="py-2 pr-4 text-gray-700">{r.clock_out_time ? format(new Date(r.clock_out_time), 'h:mm a') : '-'}</td>
                                    </tr>
                                ))}
                                {!loading && last7.length === 0 && (
                                    <tr>
                                        <td className="py-4 text-gray-500" colSpan={4}>No recent attendance records.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}