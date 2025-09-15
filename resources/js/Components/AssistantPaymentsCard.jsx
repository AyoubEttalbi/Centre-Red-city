import React, { useState, useEffect, useMemo } from "react";
import {
    CreditCard,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle,
    Repeat,
    BadgeCheck,
    BadgeDollarSign,
} from "lucide-react";
import { format } from "date-fns";
import PaymentsPagination from "./PaymentsPagination";

const PaymentTypeBadge = ({ type, isRecurring }) => {
    if (isRecurring) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 mr-2">
                <Repeat className="h-3 w-3 mr-1" /> Récurrent
            </span>
        );
    }
    if (type === "salary") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 mr-2">
                <BadgeCheck className="h-3 w-3 mr-1" /> Salaire
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 mr-2">
            <BadgeDollarSign className="h-3 w-3 mr-1" /> Paiement
        </span>
    );
};

const PaymentStatus = ({ transaction }) => {
    const currentDate = new Date();
    if (transaction.paid_this_month || transaction.status === "paid") {
        return (
            <span className="flex items-center text-green-600 text-xs font-medium">
                <CheckCircle className="h-4 w-4 mr-1" /> Payé
            </span>
        );
    }
    if (transaction.next_payment_date) {
        const nextPaymentDate = new Date(transaction.next_payment_date);
        if (nextPaymentDate < currentDate) {
            return (
                <span className="flex items-center text-red-600 text-xs font-medium">
                    <AlertCircle className="h-4 w-4 mr-1" /> En retard
                </span>
            );
        }
        const diffTime = Math.abs(nextPaymentDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            return (
                <span className="flex items-center text-amber-600 text-xs font-medium">
                    <Clock className="h-4 w-4 mr-1" /> Échéance proche
                </span>
            );
        }
        return (
            <span className="flex items-center text-blue-600 text-xs font-medium">
                <Calendar className="h-4 w-4 mr-1" /> À venir
            </span>
        );
    }
    return (
        <span className="flex items-center text-gray-500 text-xs font-medium">
            <Calendar className="h-4 w-4 mr-1" /> Non planifié
        </span>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return "Non planifié";
    try {
        return format(new Date(dateString), "dd MMM yyyy");
    } catch (e) {
        return "Date invalide";
    }
};

const ITEMS_PER_PAGE = 5;

const AssistantPaymentsCard = ({ transactions = [], userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [expanded, setExpanded] = useState(false);
    
    // If no userId, don't show the payment history at all
    if (!userId) {
        return null;
    }
    
    // Memoize filtered transactions to avoid unnecessary updates
    const filteredTransactions = useMemo(() => {
        if (!transactions) {
            return [];
        }
        
        const filtered = transactions.filter((transaction) => String(transaction.user_id) === String(userId));
        return filtered;
    }, [transactions, userId]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    useEffect(() => {
        if (isLoading && transactions) {
            setIsLoading(false);
        }
    }, [isLoading, transactions]);

    if (isLoading) {
        return (
            <div className="bg-white shadow rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        );
    }

    if (filteredTransactions.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                    <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-blue-800">
                            Historique des paiements
                        </h3>
                    </div>
                </div>
                <div className="p-4 text-sm text-gray-600">
                    <p>Aucune transaction trouvée pour cet assistant.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-blue-800">
                        Historique des paiements
                    </h3>
                </div>
                <button
                    className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1 rounded transition"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? 'Voir moins' : 'Voir plus'}
                </button>
            </div>
            {expanded && (
                <div className="divide-y divide-gray-200">
                    {paginatedTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center">
                                    <PaymentTypeBadge type={transaction.type} isRecurring={transaction.is_recurring} />
                                    <span className="font-medium text-gray-900">
                                        {transaction.type === "salary"
                                            ? "Paiement de salaire"
                                            : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {parseFloat(transaction.amount).toFixed(2)} DH
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                                {transaction.description || "Aucune description"}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-gray-500">
                                    {transaction.is_recurring ? (
                                        <>Fréquence : {transaction.frequency ? transaction.frequency.charAt(0).toUpperCase() + transaction.frequency.slice(1) : "-"}</>
                                    ) : (
                                        <>Date : {formatDate(transaction.payment_date)}</>
                                    )}
                                </div>
                                <PaymentStatus transaction={transaction} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {expanded && totalPages > 1 && (
                <PaymentsPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default AssistantPaymentsCard;
