import React, { useState, useMemo } from "react";
import Table from "@/Components/Table";
import TeacherInvoicesPagination from "@/Components/TeacherInvoicesPagination";
import {
    Eye,
    Download,
    Search,
    Calendar,
    FileText,
    ChevronDown,
    X,
    Filter,
} from "lucide-react";
import { Link, router } from "@inertiajs/react";

const TeacherInvoicesTable = ({ 
    invoices = [], 
    invoiceslinks = [], 
    filterOptions = {},
    filters = {},
    teacherId = null,
    invoiceStats = {}
}) => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];

    // Get initial filter values from props or use defaults
    const initialFilters = {
        search: filters.search || "",
        classFilter: filters.class_filter || "all",
        offerFilter: filters.offer_filter || "all",
        schoolFilter: filters.school_filter || "all",
        dateFilter: filters.date_filter || new Date().toISOString().slice(0, 7),
        membershipStatusFilter: filters.membership_status_filter || "all",
        paymentStatusFilter: filters.payment_status_filter || "all",
    };

    // Filters State
    const [search, setSearch] = useState(initialFilters.search);
    const [classFilter, setClassFilter] = useState(initialFilters.classFilter);
    const [offerFilter, setOfferFilter] = useState(initialFilters.offerFilter);
    const [schoolFilter, setSchoolFilter] = useState(initialFilters.schoolFilter);
    const [dateFilter, setDateFilter] = useState(initialFilters.dateFilter);
    const [membershipStatusFilter, setMembershipStatusFilter] = useState(initialFilters.membershipStatusFilter);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(initialFilters.paymentStatusFilter);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get unique classes, offers, and schools for dropdowns from backend
    const uniqueClasses = filterOptions.classes || [];
    const uniqueOffers = filterOptions.offers || [];
    const uniqueSchools = filterOptions.schools || [];



    // Backend filtering - no frontend filtering needed
    const filteredInvoices = safeInvoices;

    // Function to apply filters via backend
    const applyFilters = (newFilters = {}) => {
        setIsLoading(true);
        const filterParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            class_filter: newFilters.classFilter !== undefined ? newFilters.classFilter : classFilter,
            offer_filter: newFilters.offerFilter !== undefined ? newFilters.offerFilter : offerFilter,
            school_filter: newFilters.schoolFilter !== undefined ? newFilters.schoolFilter : schoolFilter,
            date_filter: newFilters.dateFilter !== undefined ? newFilters.dateFilter : dateFilter,
            membership_status_filter: newFilters.membershipStatusFilter !== undefined ? newFilters.membershipStatusFilter : membershipStatusFilter,
            payment_status_filter: newFilters.paymentStatusFilter !== undefined ? newFilters.paymentStatusFilter : paymentStatusFilter,
            page: 1, // Reset to first page when filters change
        };

        if (teacherId) {
            router.get(route('teachers.show', { teacher: teacherId }), filterParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsLoading(false),
            });
        }
    };

    // Apply filters when they change
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [search, classFilter, offerFilter, schoolFilter, dateFilter, membershipStatusFilter, paymentStatusFilter]);

    // Use backend pagination - no frontend pagination needed
    const paginatedInvoices = filteredInvoices;

    // Use backend-calculated stats instead of frontend calculation
    const totalInvoices = invoiceStats.total_invoices || 0;
    const totalAmount = invoiceStats.total_amount || 0;
    const uniqueStudents = invoiceStats.unique_students || 0;
    const bestOffer = invoiceStats.best_offer || { name: "N/A", amount: "0.00" };
    const totalAmountThisMonth = invoiceStats.current_month_amount || 0;
    const pendingMonths = invoiceStats.pending_months || 0;
    const activeMemberships = invoiceStats.active_memberships || 0;

    // Reset all filters
    const resetFilters = () => {
        setSearch("");
        setClassFilter("all");
        setOfferFilter("all");
        setSchoolFilter("all");
        setDateFilter("");
        setMembershipStatusFilter("all");
        setPaymentStatusFilter("all");
        
        // Apply reset filters via backend
        applyFilters({
            search: "",
            classFilter: "all",
            offerFilter: "all",
            schoolFilter: "all",
            dateFilter: "",
            membershipStatusFilter: "all",
            paymentStatusFilter: "all",
        });
    };

    // Note: Removed paginationFilters since we're using frontend pagination now

    // Handle invoice download
    const handleDownloadInvoice = (invoiceId) => {
        window.open(`/invoices/${invoiceId}/download`, "_blank");
    };

    const handleBulkDownload = () => {
        if (selectedInvoices.length === 0) {
            return;
        }
        
        // Calculate totals for selected invoices
        const selectedInvoiceData = filteredInvoices.filter(invoice => 
            selectedInvoices.includes(invoice.invoice_id)
        );
        
        const totalIncome = selectedInvoiceData.reduce(
            (sum, invoice) => sum + parseFloat(invoice?.teacher_amount || 0), 
            0
        );
        const totalInvoices = selectedInvoiceData.length;
        
        // Create URL with query parameters for GET request
        const params = new URLSearchParams({
            invoiceIds: JSON.stringify(selectedInvoices),
            totalIncome: totalIncome.toFixed(2),
            totalInvoices: totalInvoices,
            teacherName: "Teacher",
            dateRange: dateFilter ? `${dateFilter}` : "All time"
        });
        
        // Open in new tab to trigger download
        window.open(`/teacher-invoices/download-pdf?${params.toString()}`, '_blank');
    };
    // Toggle invoice selection
    const toggleInvoiceSelection = (invoiceId) => {
        if (selectedInvoices.includes(invoiceId)) {
            setSelectedInvoices(
                selectedInvoices.filter((id) => id !== invoiceId),
            );
        } else {
            setSelectedInvoices([...selectedInvoices, invoiceId]);
        }
    };

    // Select/deselect all invoices
    const toggleSelectAll = () => {
        if (selectedInvoices.length === filteredInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredInvoices.map((invoice) => invoice.invoice_id));
        }
    };

    // Define columns for the invoices table
    const columns = [
        {
            header: (
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2 rounded"
                        checked={
                            selectedInvoices.length ===
                                filteredInvoices.length &&
                            filteredInvoices.length > 0
                        }
                        onChange={toggleSelectAll}
                    />
                    <span className="hidden md:inline">ID Facture</span>
                </div>
            ),
            accessor: "invoice_id",
            className: "md:table-cell",
        },
        {
            header: "Élève",
            accessor: "student_name",
        },
        {
            header: "Classe",
            accessor: "student_class",
            className: "hidden md:table-cell",
        },
        {
            header: "École",
            accessor: "student_school",
            className: "hidden lg:table-cell",
        },
        {
            header: "Offre",
            accessor: "offer_name",
            className: "hidden lg:table-cell",
        },
        {
            header: "Statut",
            accessor: "membership_status",
            className: "hidden md:table-cell",
        },
        {
            header: "Date de facture",
            accessor: "billDate",
            className: "hidden md:table-cell",
        },
        {
            header: "Gains",
            accessor: "teacher_amount",
            className: "hidden md:table-cell",
        },
        {
            header: "Mois",
            accessor: "month_display",
            className: "hidden lg:table-cell",
        },
        { header: "Actions", accessor: "action" },
    ];

    // Render each row of the table
    const renderRow = (item) => {
        if (!item) return null;

        const billDate = item.billDate
            ? new Date(item.billDate).toLocaleDateString()
            : "N/A";
        const teacherAmount = Number(item.teacher_amount || 0).toFixed(2);

        return (
            <tr
                key={item.invoice_id + '_' + item.month_display}
                className={`border-b border-gray-200 text-sm hover:bg-gray-100 ${selectedInvoices.includes(item.invoice_id) ? "bg-blue-50" : "even:bg-gray-50"}`}
            >
                <td className="p-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2 rounded"
                            checked={selectedInvoices.includes(item.invoice_id)}
                            onChange={() => toggleInvoiceSelection(item.invoice_id)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="md:inline">{item.invoice_id}</span>
                    </div>
                </td>
                <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                        <span className={item.membership_deleted ? "line-through text-gray-500" : ""}>
                            {item.student_name || "Inconnu"}
                        </span>
                        {item.membership_deleted && (
                            <span className="text-xs text-red-600 bg-red-100 px-1 py-0.5 rounded">
                                Supprimé
                            </span>
                        )}
                    </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                    {item.student_class || "—"}
                </td>
                <td className="p-4 hidden lg:table-cell">
                    {item.student_school || "—"}
                </td>
                <td className="p-4 hidden lg:table-cell">
                    {item.offer_name || "—"}
                </td>
                <td className="p-4 hidden md:table-cell">
                    {item.membership_deleted ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                            Adhésion supprimée
                        </span>
                    ) : item.is_month_paid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            Actif
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                            En attente
                        </span>
                    )}
                </td>
                <td className="p-4 hidden md:table-cell">{billDate}</td>
                <td className="p-4 hidden md:table-cell font-semibold text-green-500">
                    + {teacherAmount} DH
                </td>
                <td className="p-4 hidden lg:table-cell text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.month_display || 'N/A'}
                    </span>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(item.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaBlue hover:bg-sky-800 transition duration-300 text-white tooltip"
                            data-tip="Télécharger"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-sm p-5 m-4 mt-0">
            {/* En-tête et statistiques */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="flex items-center mb-4 md:mb-0">
                        <FileText className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-xl font-bold text-gray-800">
                            Gains Mensuels Enseignant
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                className="border rounded-lg p-2 pl-8 text-sm w-full md:w-44"
                                placeholder="Rechercher un élève..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            />
                            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-2.5"
                                >
                                    <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setFiltersVisible(!filtersVisible)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm 
                ${filtersVisible ? "bg-blue-50 text-blue-600 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filtres
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${filtersVisible ? "transform rotate-180" : ""}`}
                            />
                        </button>

                        {        (search ||
            classFilter !== "all" ||
            offerFilter !== "all" ||
            dateFilter ||
            membershipStatusFilter !== "all" ||
            paymentStatusFilter !== "all") && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm hover:bg-red-100"
                            >
                                <X className="w-4 h-4" />
                                Effacer les filtres
                            </button>
                        )}

                        {selectedInvoices.length > 0 && (
                            <button
                                onClick={handleBulkDownload}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
                            >
                                <Download className="w-4 h-4" />
                                Rapport PDF ({selectedInvoices.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtres étendus */}
                {filtersVisible && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 mb-2 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                        {/* Filtre Classe */}
                        <div>
                            <label
                                htmlFor="class-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Classe
                            </label>
                            <select
                                id="class-filter"
                                className="border w-full rounded-lg p-2 text-sm"
                                value={classFilter}
                                onChange={(e) => {
                                    setClassFilter(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            >
                                <option value="all">Toutes les classes</option>
                                {uniqueClasses.map((className, index) => (
                                    <option key={index} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre Offre */}
                        <div>
                            <label
                                htmlFor="offer-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Offre
                            </label>
                            <select
                                id="offer-filter"
                                className="border w-full rounded-lg p-2 text-sm"
                                value={offerFilter}
                                onChange={(e) => {
                                    setOfferFilter(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            >
                                <option value="all">Toutes les offres</option>
                                {uniqueOffers.map((offerName, index) => (
                                    <option key={index} value={offerName}>
                                        {offerName || "Aucune offre"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre École */}
                        <div>
                            <label
                                htmlFor="school-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                École
                            </label>
                            <select
                                id="school-filter"
                                className="border w-full rounded-lg p-2 text-sm"
                                value={schoolFilter}
                                onChange={(e) => {
                                    setSchoolFilter(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            >
                                <option value="all">Toutes les écoles</option>
                                {uniqueSchools.map((schoolName, index) => (
                                    <option key={index} value={schoolName}>
                                        {schoolName || "Aucune école"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre Date */}
                        <div>
                            <label
                                htmlFor="date-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Mois
                            </label>
                            <div className="relative">
                                <input
                                    id="date-filter"
                                    type="month"
                                    className="border w-full rounded-lg p-2 pl-8 text-sm"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        // applyFilters will be called by useEffect
                                    }}
                                />
                                <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                                {/* {dateFilter && (
                                    <button
                                        onClick={() => setDateFilter("")}
                                        className>
                                        <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                    </button>
                                )} */}
                            </div>
                        </div>

                        {/* Filtre Statut d'adhésion */}
                        <div>
                            <label
                                htmlFor="membership-status-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Statut d'adhésion
                            </label>
                            <select
                                id="membership-status-filter"
                                className="border w-full rounded-lg p-2 text-sm"
                                value={membershipStatusFilter}
                                onChange={(e) => {
                                    setMembershipStatusFilter(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Adhésions actives</option>
                                <option value="deleted">Adhésions supprimées</option>
                            </select>
                        </div>

                        {/* Filtre Statut de paiement */}
                        <div>
                            <label
                                htmlFor="payment-status-filter"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Statut de paiement
                            </label>
                            <select
                                id="payment-status-filter"
                                className="border w-full rounded-lg p-2 text-sm"
                                value={paymentStatusFilter}
                                onChange={(e) => {
                                    setPaymentStatusFilter(e.target.value);
                                    // applyFilters will be called by useEffect
                                }}
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="paid">Mois payés</option>
                                <option value="pending">Mois en attente</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Cartes de résumé */}
            {safeInvoices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                            Mois de paiement
                            {dateFilter && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({dateFilter})
                                </span>
                            )}
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                            {totalInvoices}
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-sm border border-green-200">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                            Gains totaux
                            {dateFilter && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({dateFilter})
                                </span>
                            )}
                        </p>
                        <p className="text-2xl font-bold text-green-800">
                            {totalAmount.toFixed(1)} DH
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm border border-purple-200">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                            Meilleure offre
                            {dateFilter && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({dateFilter})
                                </span>
                            )}
                        </p>
                        <p className="text-xl font-bold text-purple-800">
                            {bestOffer.name}
                        </p>
                        <p className="text-lg text-purple-700">
                            {bestOffer.amount} DH
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg shadow-sm border border-orange-200">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                            Adhésions supprimées
                            {dateFilter && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({dateFilter})
                                </span>
                            )}
                        </p>
                        <p className="text-2xl font-bold text-orange-800">
                            {invoiceStats.deleted_memberships || 0}
                        </p>
                        <p className="text-sm text-orange-700">
                            sur {totalInvoices} total
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg shadow-sm border border-yellow-200">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                            Mois en attente
                            {dateFilter && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({dateFilter})
                                </span>
                            )}
                        </p>
                        <p className="text-2xl font-bold text-yellow-800">
                            {pendingMonths}
                        </p>
                        <p className="text-sm text-yellow-700">
                            sur {activeMemberships} actifs
                        </p>
                    </div>
                </div>
            )}

            {/* État vide */}
            {filteredInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">
                        Aucun gain mensuel trouvé
                    </h3>
                    <p className="text-gray-500">
                        {safeInvoices.length === 0
                            ? "Aucun gain mensuel disponible pour cet enseignant."
                            : "Essayez d'ajuster vos filtres ou critères de recherche"}
                    </p>
                    {safeInvoices.length > 0 && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Réinitialiser tous les filtres
                        </button>
                    )}
                </div>
            )}

            {/* Tableau des factures */}
            {filteredInvoices.length > 0 && (
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        renderRow={renderRow}
                        data={paginatedInvoices}
                    />
                </div>
            )}

            {/* Backend Pagination */}
            {invoiceslinks && invoiceslinks.length > 0 && (
                <div className="mt-6">
                    <TeacherInvoicesPagination links={invoiceslinks} />
                </div>
            )}
        </div>
    );
};

export default TeacherInvoicesTable;
