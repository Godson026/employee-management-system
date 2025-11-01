import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../api';
import toast from 'react-hot-toast';

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
    // ... other dashboard state ...

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
            // You would re-fetch attendance status here to update the UI
        } catch (err) {
            toast.dismiss();
            const errorMsg = (err as any).response?.data?.message || `Failed to ${actionType}.`;
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {isScannerOpen && <ScannerModal onClose={() => setScannerOpen(false)} onScanSuccess={onScanSuccess} />}
            
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                My Dashboard
                            </h1>
                            <p className="text-gray-600 mt-2">Welcome to your personal workspace</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live Data</span>
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleActionClick('clock-in')} 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl w-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Clock In</span>
                        </button>
                        <button 
                            onClick={() => handleActionClick('clock-out')} 
                            className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl w-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Clock Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}