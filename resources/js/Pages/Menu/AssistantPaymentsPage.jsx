import React from "react";
import { Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Pagination";
import { ArrowLeft, DollarSign, User, Calendar, CreditCard } from "lucide-react";

const StudentPaymentsPage = ({
    assistant,
    studentPayments = [],
    paymentsLinks = [],
    totalPayments = 0,
    selectedSchool = null,
}) => {
    const role = usePage().props.auth.user.role;

    // Helper to format dates
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="flex-1 p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href={`/assistants/${assistant.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour au profil
                    </Link>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            src={
                                assistant.profile_image ||
                                "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200"
                            }
                            alt={assistant.last_name}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">
                                Paiements des étudiants - {assistant.first_name} {assistant.last_name}
                            </h1>
                            <p className="text-gray-600">
                                {selectedSchool ? selectedSchool.name : "Toutes les écoles"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{totalPayments} paiements d'étudiants au total</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Assistant: {assistant.first_name} {assistant.last_name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Historique des paiements des étudiants
                    </h2>
                </div>

                {studentPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Aucun paiement trouvé</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Élève
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Méthode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Offre
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {studentPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/students/${payment.student_id}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {payment.student_name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {formatDate(payment.payment_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-green-600">
                                                    {payment.amount} DH
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.offer_name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {paymentsLinks && paymentsLinks.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <Pagination links={paymentsLinks} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

StudentPaymentsPage.layout = (page) => (
    <DashboardLayout>{page}</DashboardLayout>
);

export default StudentPaymentsPage;
