import { useState, useEffect } from 'react';
import { AttendanceStatus } from '../../types/index';

const toIsoDateString = (date: any) => {
    if(!date) return '';
    const d = new Date(date);
    // This is a helper to format the date-time correctly for the input field
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
};

interface EditAttendanceModalProps {
    record: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, formData: any) => void;
}

export default function EditAttendanceModal({ record, isOpen, onClose, onSave }: EditAttendanceModalProps) {
    const [formData, setFormData] = useState({ clock_in_time: '', clock_out_time: '', status: '' });

    useEffect(() => {
        if (record) {
            setFormData({
                clock_in_time: toIsoDateString(record.clock_in_time),
                clock_out_time: toIsoDateString(record.clock_out_time),
                status: record.status,
            });
        }
    }, [record]);
    
    if (!isOpen) return null;

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        onSave(record.id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Attendance for {record.employee.first_name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label>Clock-In Time</label>
                        <input type="datetime-local" name="clock_in_time" value={formData.clock_in_time} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/>
                    </div>
                     <div>
                        <label>Clock-Out Time</label>
                        <input type="datetime-local" name="clock_out_time" value={formData.clock_out_time} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/>
                    </div>
                    <div>
                         <label>Status</label>
                         <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 p-2 border rounded">
                             {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                    </div>
                           <div className="flex justify-end space-x-2 pt-4">
                               <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                               <button type="submit" className="bg-gradient-to-r from-yellow-400 to-green-600 text-white px-4 py-2 rounded hover:shadow-lg transition-all">Save Changes</button>
                           </div>
                </form>
            </div>
        </div>
    );
}
