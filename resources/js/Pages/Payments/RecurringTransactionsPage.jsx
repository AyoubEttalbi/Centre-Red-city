import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import PageHeader from "@/Components/PaymentsAndTransactions/PageHeader";
import Alert from "@/Components/PaymentsAndTransactions/Alert";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";
import {
    Calendar,
    Filter,
    CheckCircle,
    ChevronLeft,
    CreditCard,
    ArrowRight,
} from "lucide-react";
const RecurringTransactionsPage = ({
    recurringTransactions = [],
    selectedMonth,
    availableMonths = {},
    flash,
    errors,
    isEmbedded = false,
}) => {
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [month, setMonth] = useState(() => {
        if (selectedMonth) return selectedMonth;
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

    // If recurringTransactions or month changes, reset selections
    useEffect(() => {
        setSelectedTransactions([]);
    }, [recurringTransactions, month]);

    // Load data with current month when component mounts
    useEffect(() => {
        if (!selectedMonth) {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            router.get(
                route("transactions.recurring", { month: currentMonth }),
                {},
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, [selectedMonth]);

    // Toggle all transactions selection
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const visibleTransactions = getFilteredTransactions().map(
                (transaction) => transaction.id,
            );
            setSelectedTransactions(visibleTransactions);
        } else {
            setSelectedTransactions([]);
        }
    };

    // Toggle individual transaction selection
    const toggleSelect = (id) => {
        if (selectedTransactions.includes(id)) {
            setSelectedTransactions(
                selectedTransactions.filter(
                    (transactionId) => transactionId !== id,
                ),
            );
        } else {
            setSelectedTransactions([...selectedTransactions, id]);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Get more descriptive month label based on current date
    const getMonthDescription = (monthStr) => {
        if (!monthStr) return "Tous les mois";

        const selectedDate = new Date(`${monthStr}-01`);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const monthNames = [
            "Janvier",
            "Février",
            "Mars",
            "Avril",
            "Mai",
            "Juin",
            "Juillet",
            "Août",
            "Septembre",
            "Octobre",
            "Novembre",
            "Décembre",
        ];

        const monthName = monthNames[selectedDate.getMonth()];
        const yearValue = selectedDate.getFullYear();

        // Determine if it's past, current or future month
        if (
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear
        ) {
            return `Mois en cours (${monthName} ${yearValue})`;
        } else if (selectedDate < new Date(currentYear, currentMonth, 1)) {
            return `Mois passé (${monthName} ${yearValue})`;
        } else {
            return `Mois à venir (${monthName} ${yearValue})`;
        }
    };

    // Handle month selection change
    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setMonth(newMonth);

        // Reset selected transactions
        setSelectedTransactions([]);

        // Reload data with the new month
        router.get(
            route("transactions.recurring", { month: newMonth }),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Clear the month filter
    const clearMonthFilter = () => {
        // Reset to current month instead of clearing
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        setMonth(currentMonth);
        router.get(
            route("transactions.recurring", { month: currentMonth }),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Enhanced MonthFilter component
    const MonthFilter = () => (
        <div className="w-full sm:w-64">
            <label
                htmlFor="month-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                Période de transaction
            </label>
            <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                    id="month-filter"
                    type="month"
                    className="block w-full pl-10 pr-10 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={month}
                    onChange={handleMonthChange}
                    aria-label="Sélectionner le mois pour filtrer les transactions"
                />
                {month && (
                    <button
                        onClick={clearMonthFilter}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label="Effacer le filtre du mois"
                    >
                        <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </button>
                )}
            </div>
            {month && (
                <p className="mt-1 text-xs text-gray-500">
                    {getMonthDescription(month)}
                </p>
            )}
        </div>
    );

    // Process single transaction
    const handleProcessTransaction = (id) => {
        setIsProcessing(true);
        router.post(
            route("transactions.process-single-recurring", {
                id: id,
                month: month,
            }),
            {},
            {
                onSuccess: () => {
                    setSuccessMessage(
                        `Transaction #${id} traitée avec succès`,
                    );
                    setIsProcessing(false);
                    setTimeout(() => setSuccessMessage(""), 3000);
                    router.reload();
                },
                onError: (errors) => {
                    setErrorMessage(
                        errors.message || "Erreur lors du traitement de la transaction",
                    );
                    setIsProcessing(false);
                    setTimeout(() => setErrorMessage(""), 3000);
                },
            },
        );
    };

    // Handle batch processing of selected transactions
    const handleProcessSelected = () => {
        if (selectedTransactions.length === 0) {
            setErrorMessage(
                "Veuillez sélectionner au moins une transaction à traiter",
            );
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        setIsProcessing(true);
        router.post(
            route("transactions.process-selected-recurring"),
            {
                transactions: selectedTransactions,
                month: month,
            },
            {
                onSuccess: () => {
                    setSuccessMessage(
                        `${selectedTransactions.length} transaction(s) traitée(s) avec succès`,
                    );
                    setSelectedTransactions([]);
                    setIsProcessing(false);
                    setTimeout(() => setSuccessMessage(""), 3000);
                    router.reload();
                },
                onError: (errors) => {
                    setErrorMessage(
                        errors.message || "Erreur lors du traitement des transactions",
                    );
                    setIsProcessing(false);
                    setTimeout(() => setErrorMessage(""), 3000);
                },
            },
        );
    };

    // Handle processing all recurring transactions
    const handleProcessAll = () => {
        setIsProcessing(true);
        router.post(
            route("transactions.process-all-recurring"),
            {},
            {
                onSuccess: () => {
                    setSuccessMessage(
                        "Toutes les transactions récurrentes ont été traitées avec succès",
                    );
                    setIsProcessing(false);
                    setTimeout(() => setSuccessMessage(""), 3000);
                    router.reload();
                },
                onError: (errors) => {
                    setErrorMessage(
                        errors.message || "Erreur lors du traitement des transactions",
                    );
                    setIsProcessing(false);
                    setTimeout(() => setErrorMessage(""), 3000);
                },
            },
        );
    };

    // Handle processing all month's recurring transactions
    const handleProcessMonth = () => {
        setIsProcessing(true);
        router.post(
            route("transactions.process-month-recurring"),
            { month },
            {
                onSuccess: () => {
                    setSuccessMessage(
                        `Toutes les transactions pour ${getMonthDescription(month)} traitées avec succès`,
                    );
                    setIsProcessing(false);
                    setTimeout(() => setSuccessMessage(""), 3000);
                    router.reload();
                },
                onError: (errors) => {
                    setErrorMessage(
                        errors.message || "Erreur lors du traitement des transactions",
                    );
                    setIsProcessing(false);
                    setTimeout(() => setErrorMessage(""), 3000);
                },
            },
        );
    };

    // Handle cancel/back navigation
    const handleCancel = () => {
        router.get(route("transactions.index"));
    };

    // Get transaction status based on next payment date
    const getTransactionStatus = (nextPaymentDate) => {
        if (!nextPaymentDate) return "N/A";

        const today = new Date();
        const paymentDate = new Date(nextPaymentDate);

        if (paymentDate < today) {
            return "Overdue";
        } else {
            const diffTime = Math.abs(paymentDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) {
                return "Due Soon";
            } else {
                return "Scheduled";
            }
        }
    };

    // Get status color class
    const getStatusColorClass = (status) => {
        switch (status) {
            case "Overdue":
                return "text-red-600";
            case "Due Soon":
                return "text-orange-500";
            case "Scheduled":
                return "text-green-600";
            default:
                return "text-gray-500";
        }
    };

    // Determine payment status based on available data
    const getPaymentStatus = (transaction) => {
        // Use backend-provided paid_this_period for accuracy
        if (transaction.paid_this_period) {
            return "Paid";
        }
        return "Unpaid";
    };

    // Get payment status color class
    const getPaymentStatusColorClass = (status) => {
        switch (status) {
            case "Paid":
                return "bg-green-100 text-green-800 border border-green-200";
            case "User Already Paid":
                return "bg-blue-100 text-blue-800 border border-blue-200";
            case "Unpaid":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    // Filter transactions based on date criteria
    const getFilteredTransactions = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Parse selected month if available
        let selectedMonth, selectedYear, selectedDate;
        if (month) {
            selectedDate = new Date(`${month}-01`);
            selectedMonth = selectedDate.getMonth();
            selectedYear = selectedDate.getFullYear();
        }

        return recurringTransactions.filter((transaction) => {
            // Get dates we'll need for comparisons
            const nextPaymentDate = transaction.next_payment_date
                ? new Date(transaction.next_payment_date)
                : null;
            const lastPaymentDate = transaction.payment_date
                ? new Date(transaction.payment_date)
                : null;
            const paymentStatus = getPaymentStatus(transaction);
            const isRecurring = transaction.is_recurring;

            // Apply "show unpaid only" filter if enabled
            if (showUnpaidOnly && paymentStatus === "Paid") {
                return false;
            }

            // If no month filter is applied, show all transactions
            if (!month) {
                return true;
            }

            // Check if this transaction should appear for the selected month based on frequency
            const shouldShowForMonth = checkIfTransactionShouldShowForMonth(
                transaction,
                selectedMonth,
                selectedYear,
            );

            // Always include transactions that should show for this month
            if (shouldShowForMonth) {
                return true;
            }

            // Also include unpaid recurring transactions regardless of month (for overdue payments)
            const isUnpaidRecurring = isRecurring && paymentStatus !== "Paid";
            return isUnpaidRecurring;
        });
    };

    // Helper function to determine if a transaction should show for a specific month based on frequency
    const checkIfTransactionShouldShowForMonth = (
        transaction,
        targetMonth,
        targetYear,
    ) => {
        if (!transaction.is_recurring) {
            return false;
        }

        const frequency = transaction.frequency;
        const startDate = transaction.payment_date
            ? new Date(transaction.payment_date)
            : new Date(transaction.created_at);
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();

        // Calculate how many months/years have passed since the start date
        const monthsDiff =
            (targetYear - startYear) * 12 + (targetMonth - startMonth);

        switch (frequency) {
            case "daily":
                // Show for all months after start date
                return monthsDiff >= 0;

            case "weekly":
                // Show for all months after start date (weekly transactions appear monthly)
                return monthsDiff >= 0;

            case "biweekly":
                // Show for all months after start date (biweekly transactions appear monthly)
                return monthsDiff >= 0;

            case "monthly":
                // Show for all months after start date
                return monthsDiff >= 0;

            case "quarterly":
                // Show every 3 months
                return monthsDiff >= 0 && monthsDiff % 3 === 0;

            case "semiannually":
            case "biannually":
                // Show every 6 months
                return monthsDiff >= 0 && monthsDiff % 6 === 0;

            case "annually":
            case "yearly":
                // Show every 12 months
                return monthsDiff >= 0 && monthsDiff % 12 === 0;

            case "termly":
                // Show every 4 months (approximate school term)
                return monthsDiff >= 0 && monthsDiff % 4 === 0;

            case "semester":
                // Show every 6 months
                return monthsDiff >= 0 && monthsDiff % 6 === 0;

            default:
                // Default to monthly
                return monthsDiff >= 0;
        }
    };

    const [showFilters, setShowFilters] = useState(false);
    // The content to be rendered
    const content = (
        <>
            {!isEmbedded && (
                <PageHeader
                    title="Transactions récurrentes"
                    description="Consultez et traitez vos transactions récurrentes"
                >
                    <div className="flex flex-col space-y-4 w-full">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md ml-auto"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filtres
                            {showFilters ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                        </button>

                        {showFilters && (
                            <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <MonthFilter />

                                <div className="flex items-center">
                                    <input
                                        id="unpaid-only"
                                        type="checkbox"
                                        checked={showUnpaidOnly}
                                        onChange={() =>
                                            setShowUnpaidOnly(!showUnpaidOnly)
                                        }
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label
                                        htmlFor="unpaid-only"
                                        className="ml-2 text-sm font-medium text-gray-700"
                                    >
                                        Afficher uniquement les impayés
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                            <button
                                onClick={handleProcessSelected}
                                disabled={
                                    isProcessing ||
                                    selectedTransactions.length === 0
                                }
                                className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Traiter la sélection ({selectedTransactions.length})
                            </button>

                            <button
                                onClick={handleProcessMonth}
                                disabled={
                                    isProcessing ||
                                    getFilteredTransactions().length === 0
                                }
                                className={`flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Traiter les transactions du {getMonthDescription(month).split(" ")[2]} {getMonthDescription(month).split(" ")[3]}
                            </button>

                            <button
                                onClick={handleProcessAll}
                                disabled={
                                    isProcessing ||
                                    recurringTransactions.length === 0
                                }
                                className={`flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Traiter tout ce qui est dû
                            </button>

                            <button
                                onClick={handleCancel}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Retour
                            </button>
                        </div>
                    </div>
                </PageHeader>
            )}

            {(flash?.success || successMessage) && (
                <Alert
                    type="success"
                    message={flash?.success || successMessage}
                    className="mb-6"
                />
            )}

            {(errors?.message || errorMessage) && (
                <Alert
                    type="error"
                    message={errors?.message || errorMessage}
                    className="mb-6"
                />
            )}

            <div
                className={isEmbedded ? "" : "bg-white shadow-sm sm:rounded-lg"}
            >
                <div
                    className={
                        isEmbedded
                            ? ""
                            : "p-6 bg-white border-b border-gray-200"
                    }
                >
                    {isProcessing && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <p className="text-lg font-semibold">
                                    Traitement des transactions...
                                </p>
                                <div className="mt-4 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {getFilteredTransactions().length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedTransactions.length ===
                                                        getFilteredTransactions()
                                                            .length &&
                                                    getFilteredTransactions()
                                                        .length > 0
                                                }
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            ID
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Utilisateur
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Type
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Montant
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Description
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Fréquence
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Dernier paiement
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Prochain paiement
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Statut du paiement
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Statut
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(() => {
                                        const filteredTransactions =
                                            getFilteredTransactions();
                                        return filteredTransactions.map(
                                            (transaction) => {
                                                const status =
                                                    getTransactionStatus(
                                                        transaction.next_payment_date,
                                                    );
                                                const statusColorClass =
                                                    getStatusColorClass(status);
                                                const paymentStatus =
                                                    getPaymentStatus(
                                                        transaction,
                                                    );
                                                const paymentStatusColorClass =
                                                    getPaymentStatusColorClass(
                                                        paymentStatus,
                                                    );
                                                return (
                                                    <tr key={transaction.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTransactions.includes(
                                                                    transaction.id,
                                                                )}
                                                                onChange={() =>
                                                                    toggleSelect(
                                                                        transaction.id,
                                                                    )
                                                                }
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {transaction.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {transaction.user_name ||
                                                                `Utilisateur #${transaction.user_id}`}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    transaction.type ===
                                                                    "payment"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {transaction.type === "payment"
                                                                    ? "Paiement"
                                                                    : "Dépense"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {parseFloat(
                                                                transaction.amount,
                                                            ).toFixed(2)}{" "}
                                                            DH
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                            {
                                                                transaction.description
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {(() => {
                                                                switch (transaction.frequency) {
                                                                    case "daily":
                                                                        return "Quotidien";
                                                                    case "weekly":
                                                                        return "Hebdomadaire";
                                                                    case "biweekly":
                                                                        return "Bihebdomadaire";
                                                                    case "monthly":
                                                                        return "Mensuel";
                                                                    case "quarterly":
                                                                        return "Trimestriel";
                                                                    case "semiannually":
                                                                    case "biannually":
                                                                    case "semester":
                                                                        return "Semestriel";
                                                                    case "annually":
                                                                    case "yearly":
                                                                        return "Annuel";
                                                                    case "termly":
                                                                        return "Par trimestre scolaire";
                                                                    default:
                                                                        return transaction.frequency;
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(
                                                                transaction.payment_date,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(
                                                                transaction.next_payment_date,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColorClass}`}
                                                            >
                                                                {paymentStatus === "Paid"
                                                                    ? "Payé"
                                                                    : paymentStatus === "User Already Paid"
                                                                    ? "Utilisateur déjà payé"
                                                                    : "Impayé"}
                                                            </span>
                                                            {paymentStatus ===
                                                                "User Already Paid" && (
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    Même utilisateur déjà payé
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={`font-medium ${statusColorClass}`}
                                                            >
                                                                {status === "Overdue"
                                                                    ? "En retard"
                                                                    : status === "Due Soon"
                                                                    ? "À venir bientôt"
                                                                    : status === "Scheduled"
                                                                    ? "Planifié"
                                                                    : status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() =>
                                                                    handleProcessTransaction(
                                                                        transaction.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing ||
                                                                    paymentStatus ===
                                                                        "Paid" ||
                                                                    paymentStatus ===
                                                                        "User Already Paid"
                                                                }
                                                                className={`text-blue-600 hover:text-blue-900 mr-4 ${
                                                                    isProcessing ||
                                                                    paymentStatus ===
                                                                        "Paid" ||
                                                                    paymentStatus ===
                                                                        "User Already Paid"
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {paymentStatus === "Paid"
                                                                    ? "Déjà traité"
                                                                    : paymentStatus === "User Already Paid"
                                                                    ? "Utilisateur déjà payé"
                                                                    : "Traiter maintenant"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">
                                {showUnpaidOnly
                                    ? "Aucune transaction récurrente impayée trouvée pour cette période."
                                    : month
                                    ? `Aucune transaction récurrente trouvée pour ${getMonthDescription(month)}.`
                                    : "Aucune transaction récurrente trouvée."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // Return different layouts based on whether the component is embedded or standalone
    if (isEmbedded) {
        return content;
    }

    return (
        <div className="py-6">
            <div className="mx-20 sm:px-6 lg:px-8">{content}</div>
        </div>
    );
};

RecurringTransactionsPage.layout = (page) => (
    <DashboardLayout>{page}</DashboardLayout>
);

export default RecurringTransactionsPage;
