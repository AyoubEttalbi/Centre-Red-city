import React from "react";
import { format } from "date-fns";

const PaymentDetails = ({ transaction, onEdit, onBack }) => {
    const formatCurrency = (amount) => {
        return `${amount.toLocaleString()} DH`;
    };
    const formatDate = (dateString) => {
        return format(new Date(dateString), "dd MMM yyyy");
    };
    const getTypeStyles = (type) => {
        switch (type) {
            case "salary":
                return "bg-green-100 text-green-800";
            case "wallet":
                return "bg-blue-100 text-blue-800";
            case "expense":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Détails de la transaction
                </h2>
                <div className="flex space-x-3">
                    <button
                        onClick={onBack}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Retour à la liste
                    </button>
                    <button
                        onClick={onEdit}
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Modifier la transaction
                    </button>
                </div>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Transaction n°{transaction.id}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Créée le {formatDate(transaction.created_at)}
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeStyles(transaction.type)}`}
                    >
                        {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                    </span>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Montant
                            </dt>
                            <dd className="mt-1 text-xl font-semibold sm:mt-0 sm:col-span-2">
                                <span
                                    className={
                                        transaction.type === "expense"
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }
                                >
                                    {transaction.type === "expense"
                                        ? "- "
                                        : "+ "}
                                    {formatCurrency(transaction.amount)}
                                </span>
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Date de paiement
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {formatDate(transaction.payment_date)}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Description
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {transaction.description ||
                                    "Aucune description fournie"}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Utilisateur associé
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {transaction.user
                                    ? transaction.user.name
                                    : "Aucun utilisateur assigné"}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Statut récurrent
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {transaction.is_recurring ? (
                                    <div>
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                                            Récurrent
                                        </span>
                                        <div className="mt-2">
                                            <p>
                                                Fréquence :{" "}
                                                {transaction.frequency.charAt(0).toUpperCase() +
                                                    transaction.frequency.slice(1)}
                                            </p>
                                            {transaction.next_payment_date && (
                                                <p className="mt-1">
                                                    Prochain paiement :{" "}
                                                    {formatDate(
                                                        transaction.next_payment_date,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    "Transaction unique"
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;
