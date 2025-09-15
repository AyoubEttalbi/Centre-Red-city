import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { X, Loader2, Download, Search } from "lucide-react";

const TeacherEarningsDetailModal = ({ teacherId, teacherName, month, open, onClose }) => {
    const [data, setData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const modalRef = useRef();

    // Reset to first page when modal opens
    useEffect(() => {
        if (open) {
            setCurrentPage(1);
        }
    }, [open]);

    // Fetch data when page changes
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(null);
        
        // If month is "all", we need to fetch all months for this teacher
        const fetchParams = {
            teacher_id: teacherId, 
            page: currentPage,
            per_page: 10
        };
        
        // Only add month parameter if it's not "all"
        if (month && month !== "all") {
            fetchParams.month = month;
        }
        
        axios
            .get("/teacher-invoice-breakdown", {
                params: fetchParams,
            })
            .then((res) => {
                if (res.data && res.data.data) {
                    setData(res.data.data);
                    setPagination(res.data.pagination);
                } else {
                    setData(res.data);
                    setPagination({
                        current_page: 1,
                        last_page: 1,
                        per_page: 10,
                        total: res.data.length || 0,
                        from: 1,
                        to: res.data.length || 0
                    });
                }
            })
            .catch(() => setError("Erreur lors du chargement."))
            .finally(() => setLoading(false));
    }, [teacherId, month, open, currentPage]);

    // Fetch all data for export
    const fetchAllData = async () => {
        setExportLoading(true);
        try {
            const response = await axios.get("/teacher-invoice-breakdown", {
                params: { 
                    teacher_id: teacherId, 
                    month,
                    page: 1,
                    per_page: 1000 // Large number to get all data
                },
            });
            
            if (response.data && response.data.data) {
                setAllData(response.data.data);
            } else {
                setAllData(response.data);
            }
        } catch (error) {
            console.error('Error fetching all data for export:', error);
        } finally {
            setExportLoading(false);
        }
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, onClose]);

    // Auto-export when allData is fetched
    useEffect(() => {
        if (allData.length > 0 && exportLoading === false) {
            // Re-trigger export with the fetched data
            const header = "ID Facture,Date,Élève,Offre,Montant payé,Part enseignant\n";
            const rows = allData.map(
                (row) =>
                    `"${row.invoiceId}","${row.date}","${row.studentName}","${row.offerName}","${row.amountPaid} DH","${row.teacherShare} DH"`
            );
            const csv = header + rows.join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `detail_gains_${teacherName}_${month === "all" ? "tous_mois" : month}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [allData, exportLoading, teacherName, month]);

    // Filtered data (client-side filtering for search)
    const filtered = Array.isArray(data) ? data.filter(
        (row) =>
            row.studentName.toLowerCase().includes(search.toLowerCase()) ||
            row.offerName.toLowerCase().includes(search.toLowerCase())
    ) : [];

    // Show backend error if present
    if (data && !Array.isArray(data) && data.error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
                    <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-black"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold mb-2">Erreur</h2>
                    <div className="text-red-500 text-center py-4">{data.error}</div>
                </div>
            </div>
        );
    }

    // Export to CSV
    const handleExport = async () => {
        // If we don't have all data yet, fetch it first
        if (allData.length === 0) {
            await fetchAllData();
            return; // The function will be called again after data is fetched
        }
        
        const header = "ID Facture,Date,Élève,Offre,Montant payé,Part enseignant\n";
        const rows = allData.map(
            (row) =>
                `"${row.invoiceId}","${row.date}","${row.studentName}","${row.offerName}","${row.amountPaid} DH","${row.teacherShare} DH"`
        );
        const csv = header + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `detail_gains_${teacherName}_${month === "all" ? "tous_mois" : month}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-lg max-w-2xl w-full pt-2 px-6 pb-6 relative"
            >
                <button
                    className="absolute top-2 right-1 cursor-pointer text-gray-500 hover:text-black"
                    onClick={onClose}
                    aria-label="Fermer"
                >
                    <X className="cursor-pointer w-6 h-6 " />
                </button>
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold">
                        Détail des gains — {teacherName} {month === "all" ? "(Tous les mois)" : `(${month})`}
                    </h2>
                    {pagination.total > 0 && (
                        <div className="text-sm text-gray-500">
                            {pagination.total} facture{pagination.total !== 1 ? 's' : ''} au total
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        className="border rounded-md px-2 py-1 text-sm flex-1"
                        placeholder="Rechercher élève ou offre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleExport}
                        disabled={exportLoading}
                    >
                        {exportLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {exportLoading ? "Export en cours..." : "Exporter CSV"}
                    </button>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left w-12">N°</th>
                                        <th className="p-2 text-left">ID Facture</th>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Élève</th>
                                        <th className="p-2 text-left">Offre</th>
                                        <th className="p-2 text-right">Montant payé</th>
                                        <th className="p-2 text-right">Part enseignant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-gray-400">
                                                Aucun résultat trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((row, i) => {
                                            const globalIndex = (pagination.current_page - 1) * pagination.per_page + i + 1;
                                            return (
                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="p-2 text-sm font-medium text-gray-500">{globalIndex}</td>
                                                <td className="p-2">{row.invoiceId}</td>
                                                <td className="p-2">{row.date}</td>
                                                <td className="p-2">{row.studentName}</td>
                                                <td className="p-2">{row.offerName}</td>
                                                <td className="p-2 text-right">{row.amountPaid} DH</td>
                                                <td className="p-2 text-right text-blue-700 font-semibold">{Number(row.teacherShare).toFixed(2)} DH</td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {pagination.total > 0 && pagination.last_page > 1 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Affichage de <span className="font-medium">{pagination.from}</span> à{' '}
                                        <span className="font-medium">{pagination.to}</span> sur{' '}
                                        <span className="font-medium">{pagination.total}</span> résultats
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Première
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Précédent
                                        </button>
                                        
                                        {/* Page numbers */}
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.last_page <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= pagination.last_page - 2) {
                                                    pageNum = pagination.last_page - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-1 text-sm border rounded-md ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === pagination.last_page}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Suivant
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(pagination.last_page)}
                                            disabled={currentPage === pagination.last_page}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Dernière
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherEarningsDetailModal; 