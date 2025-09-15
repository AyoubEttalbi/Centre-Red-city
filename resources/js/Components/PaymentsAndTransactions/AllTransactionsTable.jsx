import React from "react";
import {
    formatCurrency,
    formatDate,
    getInitials,
    getRoleBadgeColor,
    getTransactionTypeColor,
    getTransactionTypeLabel,
} from "./Utils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const AllTransactionsTable = ({
    allTransactions,
    onView,
    onEdit,
    onDelete,
}) => {
    return (
        <div className="overflow-x-auto">
            <div className="py-2 align-middle inline-block min-w-full">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
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
                                    Employé
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
                                    Date
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
                                    Statut
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {allTransactions.map((transaction, index) => (
                                <tr
                                    key={transaction.id}
                                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-150`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}
                                        >
                                            {getTransactionTypeLabel(
                                                transaction.type,
                                            )}
                                        </span>
                                        {transaction.is_recurring && (
                                            <div className="mt-1 flex items-center text-xs text-gray-500">
                                                <ArrowPathIcon className="mr-1 h-3 w-3" />
                                                Récurrent
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8">
                                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
                                                    <span className="text-xs font-medium leading-none text-gray-800">
                                                        {getInitials(
                                                            transaction.user
                                                                ?.name ||
                                                                transaction.user_name,
                                                        )}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {transaction.user?.name ||
                                                        transaction.user_name}
                                                </div>
                                                {transaction.user?.role && (
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(transaction.user.role)}`}
                                                    >
                                                        {transaction.user.role}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className={`text-sm font-medium ${
                                                transaction.type === "expense"
                                                    ? "text-orange-600"
                                                    : transaction.type ===
                                                        "salary"
                                                      ? "text-blue-600"
                                                      : "text-green-600"
                                            }`}
                                        >
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(
                                                transaction.payment_date,
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(
                                                transaction.created_at,
                                            ).toLocaleDateString()}
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
                                                    Prochain : {formatDate(
                                                        transaction.next_payment_date,
                                                    )}
                                                </div>
                                            )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex space-x-2 justify-end">
                                            <button
                                                onClick={() =>
                                                    onView(transaction.id)
                                                }
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onEdit(transaction.id)
                                                }
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onDelete(transaction.id)
                                                }
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllTransactionsTable;
