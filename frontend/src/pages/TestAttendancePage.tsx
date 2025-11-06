import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function TestAttendancePage() {
    const [kioskToken, setKioskToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<any[]>([]);

    const addResult = (message: string, data?: any, type: 'success' | 'error' | 'info' = 'info') => {
        const result = {
            timestamp: new Date().toLocaleTimeString(),
            message,
            data,
            type
        };
        setTestResults(prev => [...prev, result]);
    };

    const getKioskToken = async () => {
        try {
            setLoading(true);
            const response = await api.get('/kiosk/generate-token');
            setKioskToken(response.data.kiosk_token);
            addResult('✅ Kiosk token generated successfully', response.data, 'success');
            toast.success('Kiosk token generated!');
        } catch (error: any) {
            addResult('❌ Failed to get kiosk token', error.response?.data, 'error');
            toast.error('Failed to get kiosk token. Make sure you\'re logged in as Admin/HR/Branch Manager');
        } finally {
            setLoading(false);
        }
    };

    const getKioskMode = async () => {
        try {
            setLoading(true);
            const response = await api.get('/kiosk/mode');
            addResult('✅ Kiosk mode retrieved', response.data, 'success');
            toast.success(`Current mode: ${response.data.mode}`);
        } catch (error: any) {
            addResult('❌ Failed to get kiosk mode', error.response?.data, 'error');
            toast.error('Failed to get kiosk mode');
        } finally {
            setLoading(false);
        }
    };

    const testClockIn = async () => {
        if (!kioskToken) {
            toast.error('Please generate a kiosk token first');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/attendance/clock-in', {
                kiosk_token: kioskToken
            });
            addResult('✅ Clock-in successful!', response.data, 'success');
            
            const status = response.data.status;
            const statusMessage = status === 'Present' 
                ? '🟢 ON TIME!' 
                : status === 'Late' 
                    ? '🟡 LATE (after 8:00 AM)' 
                    : status;
            
            toast.success(`Clocked in! Status: ${statusMessage}`);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Unknown error';
            addResult('❌ Clock-in failed', error.response?.data, 'error');
            toast.error(`Clock-in failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const testClockOut = async () => {
        if (!kioskToken) {
            toast.error('Please generate a kiosk token first');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/attendance/clock-out', {
                kiosk_token: kioskToken
            });
            addResult('✅ Clock-out successful!', response.data, 'success');
            toast.success('Clocked out successfully!');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Unknown error';
            addResult('❌ Clock-out failed', error.response?.data, 'error');
            toast.error(`Clock-out failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const getMyAttendance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/my-history');
            const todayRecord = response.data.find((r: any) => 
                r.date === new Date().toISOString().split('T')[0]
            );
            
            if (todayRecord) {
                addResult('✅ Today\'s attendance record found', todayRecord, 'success');
                toast.success('Attendance record retrieved!');
            } else {
                addResult('ℹ️ No attendance record for today yet', null, 'info');
                toast('No attendance record for today');
            }
        } catch (error: any) {
            addResult('❌ Failed to get attendance', error.response?.data, 'error');
            toast.error('Failed to get attendance records');
        } finally {
            setLoading(false);
        }
    };

    const runFullTest = async () => {
        setTestResults([]);
        addResult('🚀 Starting full test sequence...', null, 'info');
        
        await getKioskMode();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await getKioskToken();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await testClockIn();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await getMyAttendance();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testClockOut();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await getMyAttendance();
        
        addResult('✅ Full test sequence completed!', null, 'success');
    };

    const clearResults = () => {
        setTestResults([]);
        setKioskToken('');
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-8 mb-8">
                    <h1 className="text-4xl font-extrabold mb-2">🧪 Attendance System Tester</h1>
                    <p className="text-blue-100">Test clock-in/clock-out functionality and verify smart status detection</p>
                </div>

                {/* Current Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-green-200">
                        <p className="text-sm text-gray-600 font-semibold">Current Time</p>
                        <p className="text-2xl font-bold text-green-700">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-200">
                        <p className="text-sm text-gray-600 font-semibold">Expected Status</p>
                        <p className="text-2xl font-bold text-blue-700">
                            {new Date().getHours() < 8 ? '🟢 PRESENT' : '🟡 LATE'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-200">
                        <p className="text-sm text-gray-600 font-semibold">Kiosk Mode</p>
                        <p className="text-2xl font-bold text-purple-700">
                            {new Date().getHours() < 16 ? '🌅 Clock-In' : '🌆 Clock-Out'}
                        </p>
                    </div>
                </div>

                {/* Kiosk Token Display */}
                {kioskToken && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
                        <p className="text-sm text-green-800 font-semibold mb-2">🔑 Kiosk Token (Valid for 60s):</p>
                        <code className="text-xs bg-white px-3 py-2 rounded border border-green-200 block overflow-x-auto">
                            {kioskToken}
                        </code>
                    </div>
                )}

                {/* Test Controls */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">🎮 Test Controls</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={getKioskMode}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            📡 Get Kiosk Mode
                        </button>
                        
                        <button
                            onClick={getKioskToken}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            🔑 Generate Token
                        </button>
                        
                        <button
                            onClick={testClockIn}
                            disabled={loading || !kioskToken}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            ⏰ Clock In
                        </button>
                        
                        <button
                            onClick={testClockOut}
                            disabled={loading || !kioskToken}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            🏁 Clock Out
                        </button>
                        
                        <button
                            onClick={getMyAttendance}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            📊 Get Records
                        </button>
                        
                        <button
                            onClick={clearResults}
                            disabled={loading}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    <button
                        onClick={runFullTest}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50"
                    >
                        🚀 Run Full Test Sequence
                    </button>
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">📋 Test Results</h2>
                        <span className="text-sm text-gray-600">{testResults.length} results</span>
                    </div>
                    
                    {testResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-lg font-semibold mb-2">No test results yet</p>
                            <p className="text-sm">Click a button above to start testing</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {testResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border-l-4 ${
                                        result.type === 'success'
                                            ? 'bg-green-50 border-green-500'
                                            : result.type === 'error'
                                            ? 'bg-red-50 border-red-500'
                                            : 'bg-blue-50 border-blue-500'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-semibold text-gray-800">{result.message}</p>
                                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                                    </div>
                                    {result.data && (
                                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mt-8">
                    <h3 className="text-lg font-bold text-yellow-900 mb-3">ℹ️ Testing Instructions</h3>
                    <ol className="space-y-2 text-sm text-yellow-800">
                        <li><strong>1.</strong> Make sure you're logged in as an employee account</li>
                        <li><strong>2.</strong> Click "Generate Token" to get a kiosk QR code token</li>
                        <li><strong>3.</strong> Click "Clock In" to test the clock-in functionality</li>
                        <li><strong>4.</strong> Check the status in the results (should be LATE since it's after 8 AM)</li>
                        <li><strong>5.</strong> Click "Clock Out" to test clock-out</li>
                        <li><strong>6.</strong> Use "Run Full Test Sequence" to test everything automatically</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

