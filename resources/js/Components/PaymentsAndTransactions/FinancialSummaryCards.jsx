import React from "react";
import { formatCurrency } from "./Utils";

const FinancialSummaryCards = ({
    totalRevenue,
    totalExpenses,
    totalProfit,
    revenueChange,
    expensesChange,
    profitChange,
    yearlyTotalRevenue,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-blue-100">
                <div className="flex items-center mb-2">
                    <div className="rounded-full bg-blue-100 p-2 mr-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-blue-800">
                        Revenu total
                    </p>
                </div>
                <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-blue-900 mb-1">
                        {formatCurrency(totalRevenue)}
                    </p>
                    {revenueChange.percentage > 0 && (
                        <span
                            className={`ml-2 text-xs font-medium ${
                                revenueChange.direction === "up"
                                    ? "text-green-600"
                                    : revenueChange.direction === "down"
                                      ? "text-red-600"
                                      : "text-gray-600"
                            }`}
                        >
                            {revenueChange.direction === "up"
                                ? "↑"
                                : revenueChange.direction === "down"
                                  ? "↓"
                                  : ""}
                            {revenueChange.percentage}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-blue-700">Depuis les paiements de factures</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 shadow-sm border border-red-100">
                <div className="flex items-center mb-2">
                    <div className="rounded-full bg-red-100 p-2 mr-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-red-800">
                        Dépenses totales
                    </p>
                </div>
                <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-red-900 mb-1">
                        {formatCurrency(totalExpenses)}
                    </p>
                    {expensesChange.percentage > 0 && (
                        <span
                            className={`ml-2 text-xs font-medium ${
                                expensesChange.direction === "up"
                                    ? "text-red-600"
                                    : expensesChange.direction === "down"
                                      ? "text-green-600"
                                      : "text-gray-600"
                            }`}
                        >
                            {expensesChange.direction === "up"
                                ? "↑"
                                : expensesChange.direction === "down"
                                  ? "↓"
                                  : ""}
                            {expensesChange.percentage}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-red-700">
                    Salaires, opérations et paiements des instructeurs
                </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-sm border border-green-100">
                <div className="flex items-center mb-2">
                    <div className="rounded-full bg-green-100 p-2 mr-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-green-800">
                        Bénéfice net
                    </p>
                </div>
                <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-green-900 mb-1">
                        {formatCurrency(totalProfit)}
                    </p>
                    {profitChange.percentage > 0 && (
                        <span
                            className={`ml-2 text-xs font-medium ${
                                profitChange.direction === "up"
                                    ? "text-green-600"
                                    : profitChange.direction === "down"
                                      ? "text-red-600"
                                      : "text-gray-600"
                            }`}
                        >
                            {profitChange.direction === "up"
                                ? "↑"
                                : profitChange.direction === "down"
                                  ? "↓"
                                  : ""}
                            {profitChange.percentage}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-green-700">
                    Gains nets après toutes dépenses
                </p>
            </div>
        </div>
    );
};

export default FinancialSummaryCards;
