import { useState, useEffect } from 'react';
import api from '../../api';
import LeaveRequestList from '../../components/LeaveRequestList'; // Our reusable list component
import { LeaveRequest } from '../../types'; // Our shared type definition

export default function LeaveHistoryTab({ employeeId }: { employeeId: string }) {
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            api.get(`/employees/${employeeId}/leave-history`)
            .then(res => setHistory(res.data))
            .catch(err => console.error("Failed to fetch leave history", err))
            .finally(() => setLoading(false));
        }
    }, [employeeId]);
    
    if (loading) return <p>Loading leave history...</p>;

    return (
        <LeaveRequestList requests={history} />
    );
}
