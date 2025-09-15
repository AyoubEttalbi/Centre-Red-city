import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AbsenceLogTable from '../../Components/AbsenceLogTable';
import DashboardLayout from '@/Layouts/DashboardLayout';
import TextInput from '@/Components/TextInput';

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const AbsenceLog = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ date: getToday() });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

    const fetchData = async (page = 1, filterParams = filters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ ...filterParams, page });
            const res = await fetch(`/api/absence-log?${params.toString()}`);
            if (!res.ok) throw new Error('Erreur lors du chargement des absences');
            const json = await res.json();
            setData(json.data.data); // <-- Only the array of records
            setPagination({
                current_page: json.data.current_page,
                last_page: json.data.last_page,
                per_page: json.data.per_page,
                total: json.data.total,
            });

        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1, filters);
        // eslint-disable-next-line
    }, []);

    // When date changes, auto-filter
    useEffect(() => {
        if (filters.date) fetchData(1, filters);
    }, [filters.date]);

    const handleDateChange = (e) => {
        setFilters((prev) => ({ ...prev, date: e.target.value }));
    };

    const handlePageChange = (page) => {
        fetchData(page, filters);
    };

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 lg:px-12">
            <Head title="Absence Log" />
            <div className="flex items-center justify-between mb-4 " >
                <h1 className="text-lg font-semibold">Journal des absences et retards</h1>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <TextInput
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleDateChange}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm px-2 py-1"
                        />
                    </div>
                </div>
            </div>
            {loading ? (
                <div>Chargement...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <AbsenceLogTable
                    absences={data}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

AbsenceLog.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default AbsenceLog; 