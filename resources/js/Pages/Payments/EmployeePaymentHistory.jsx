// resources/js/Pages/EmployeePaymentHistory.jsx
import React from "react";
import {
    formatDate,
    formatCurrency,
    getTransactionTypeColor,
    getTransactionTypeLabel,
} from "../../Components/PaymentsAndTransactions/Utils";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { router } from "@inertiajs/react";

const EmployeePaymentHistory = ({ transactions, employee, onBack }) => {
    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Historique des paiements pour {employee.name}
                </h2>
                <button
                    onClick={() => router.visit(`/transactions`)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Retour au résumé
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                                Type
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                                Montant
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                                Date
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                                Description
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                                Statut
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="hover:bg-gray-50 transition-colors duration-200"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}
                                    >
                                        {getTransactionTypeLabel(
                                            transaction.type,
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div
                                        className={`text-sm font-medium ${
                                            transaction.type === "expense"
                                                ? "text-red-600"
                                                : "text-green-600"
                                        }`}
                                    >
                                        {formatCurrency(transaction.amount)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(transaction.payment_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {transaction.description ||
                                            "Aucune description fournie"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {transaction.is_recurring &&
                                        transaction.next_payment_date && (
                                            <div className="text-xs text-gray-500">
                                                Prochain :{" "}
                                                {formatDate(
                                                    transaction.next_payment_date,
                                                )}
                                            </div>
                                        )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
EmployeePaymentHistory.layout = (page) => (
    <DashboardLayout>{page}</DashboardLayout>
);
export default EmployeePaymentHistory;
