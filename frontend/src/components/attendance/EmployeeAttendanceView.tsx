import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { format } from 'date-fns';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  QrCodeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';

// Modern ScannerModal with SIC Life branding
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <QrCodeIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scanner */}
        <div className="p-6">
          <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border-4 border-green-200 shadow-lg">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-green-500 rounded-xl shadow-lg animate-pulse"></div>
              </div>
            )}
          </div>
          <p className="text-center text-gray-600 mt-4 font-medium">
            {isScanning ? 'Point your camera at the QR code on the office kiosk' : 'Initializing camera...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function EmployeeAttendanceView() {
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [actionType, setActionType] = useState<'clock-in' | 'clock-out'>('clock-in');
  const [history, setHistory] = useState<any[]>([]);
  const [todaysRecord, setTodaysRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchHistory = () => {
      setLoading(true);
      api.get('/attendance/my-history')
          .then(res => {
              setHistory(res.data);
              // Find today's record from the history to determine status
              const todayStr = new Date().toISOString().split('T')[0];
              const today = res.data.find((r: any) => r.date === todayStr);
              setTodaysRecord(today);
          })
          .catch(err => {
              console.error('Failed to fetch attendance history:', err);
              toast.error('Failed to load attendance history');
          })
          .finally(() => setLoading(false));
  };

  useEffect(fetchHistory, []);

  const onScanSuccess = async (kioskToken: string) => {
    setScannerOpen(false);
    try {
        toast.loading(`Processing ${actionType}...`);
        await api.post(`/attendance/${actionType}`, { kiosk_token: kioskToken });
        toast.dismiss();
        toast.success(`Successfully ${actionType === 'clock-in' ? 'Clocked In' : 'Clocked Out'}!`);
        fetchHistory(); // Refresh history and status
    } catch (err) {
        toast.dismiss();
        const errorMsg = (err as any).response?.data?.message || `Failed to ${actionType}.`;
        toast.error(errorMsg);
    }
  };
  
  // Logic to determine current status
  const isClockedIn = todaysRecord?.clock_in_time && !todaysRecord?.clock_out_time;
  const statusText = isClockedIn ? "You're Clocked In" : "You're Clocked Out";
  const statusColor = isClockedIn ? "text-green-600" : "text-red-600";
  const statusBg = isClockedIn ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

  // Calculate stats - use case-insensitive comparison
  const totalDays = history.length;
  const presentDays = history.filter(r => {
    const status = (r.status || '').toUpperCase();
    return status === 'PRESENT' || status === 'LATE';
  }).length;
  const absentDays = history.filter(r => {
    const status = (r.status || '').toUpperCase();
    return status === 'ABSENT';
  }).length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'PRESENT':
        return <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-green-600">PRESENT</span>;
      case 'LATE':
        return <span className="px-3 py-1.5 bg-yellow-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-yellow-600">LATE</span>;
      case 'ABSENT':
        return <span className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-red-600">ABSENT</span>;
      default:
        return <span className="px-3 py-1.5 bg-gray-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-gray-600">{status || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {isScannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} onScanSuccess={onScanSuccess} />}
      
      {/* SIC Life Branded Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <ClockIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">My Attendance</h1>
                <p className="text-emerald-600 text-sm md:text-base mt-1 font-medium">SIC Life Staff Portal</p>
                <p className="text-lg md:text-xl text-gray-600 mt-2">
                  Today: {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Days</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  {totalDays}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Present</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {presentDays}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <CheckCircleIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Absent</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {absentDays}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                <XCircleIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Rate</p>
                <p className="text-4xl font-extrabold mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {attendanceRate}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <ArrowPathIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Clock In/Out Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden mb-8">
          <div className={`p-8 ${statusBg} border-b-4 ${isClockedIn ? 'border-green-500' : 'border-red-500'}`}>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className={`p-4 rounded-2xl ${isClockedIn ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}>
                  <ClockIcon className={`w-8 h-8 ${isClockedIn ? 'text-white' : 'text-white'}`} />
                </div>
                <div className="text-center">
                  <h2 className={`text-3xl font-bold ${statusColor} mb-2`}>{statusText}</h2>
                  {todaysRecord?.clock_in_time && (
                    <p className="text-gray-600">
                      Clocked in at: {new Date(todaysRecord.clock_in_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-center text-gray-600 mb-6 font-medium">
                Use the buttons below to scan the office QR code
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setActionType('clock-in');
                    setScannerOpen(true);
                  }}
                  disabled={isClockedIn}
                  className="group relative px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="w-6 h-6" />
                  <span>Clock In</span>
                </button>
                
                <button
                  onClick={() => {
                    setActionType('clock-out');
                    setScannerOpen(true);
                  }}
                  disabled={!isClockedIn}
                  className="group relative px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  <XCircleIcon className="w-6 h-6" />
                  <span>Clock Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <CalendarDaysIcon className="w-6 h-6 text-green-600" />
                <span>Attendance History</span>
              </h2>
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading attendance history...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                <CalendarDaysIcon className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">No attendance records yet</p>
              <p className="text-gray-500">Your attendance history will appear here once you start clocking in and out</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Clock-In</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Clock-Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-green-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(record.date), 'EEEE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
