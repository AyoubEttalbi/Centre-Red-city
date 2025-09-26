import React, { useState } from "react";
import {
    Clock,
    Edit,
    GraduationCap,
    Users,
    DollarSign,
    Calendar,
    UserCheck,
    Check,
    X,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import FormModal from "./FormModal";
import { usePage } from "@inertiajs/react";

export default function MembershipCard({
    Student_memberships = [],
    teachers = [],
    offers = [],
    studentId,
}) {
    const role = usePage().props.auth.user.role;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3; // Show 3 memberships per page

    // Helper function to find a teacher's name by ID
    const getTeacherName = (teacherId) => {
        const teacher = teachers.find((t) => t.id === parseInt(teacherId));
        return teacher
            ? `${teacher.first_name} ${teacher.last_name}`
            : "Enseignant inconnu";
    };

    // Helper function to get payment status for a membership
    const getPaymentStatus = (membership) => {
        // Check if there are any invoices for this membership
        const membershipInvoices = membership.invoices || [];
        
        if (membershipInvoices.length === 0) {
            return { status: "not_paid", label: "Non payé", color: "red" };
        }
        
        // Calculate total amounts from all invoices for this membership
        const totalAmount = membershipInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0), 0);
        const totalPaid = membershipInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amountPaid) || 0), 0);
        
        if (totalPaid === 0) {
            return { status: "not_paid", label: "Non payé", color: "red" };
        } else if (totalPaid < totalAmount) {
            return { status: "not_fully_paid", label: "Non entièrement payé", color: "orange" };
        } else {
            return { status: "paid", label: "Payé", color: "green" };
        }
    };

    // Sort memberships: active ones first, then deleted ones
    const sortedMemberships = [...Student_memberships].sort((a, b) => {
        // If both are deleted or both are active, maintain original order
        if ((a.deleted_at && b.deleted_at) || (!a.deleted_at && !b.deleted_at)) {
            return new Date(b.created_at) - new Date(a.created_at); // Newest first
        }
        // Put active memberships before deleted ones
        return a.deleted_at ? 1 : -1;
    });

    // Calculate pagination
    const totalPages = Math.ceil(sortedMemberships.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMemberships = sortedMemberships.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {currentMemberships.map((membership) => (
                <div
                    key={membership.id}
                    className="bg-gray-50 rounded-lg shadow-sm p-4 mb-4 border border-gray-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-800 font-medium">
                                <GraduationCap className="h-5 w-5 text-gray-600" />
                                <span>
                                    Offre :{" "}
                                    <span className={`font-semibold ${membership.deleted_at ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                        {membership.offer_name}
                                    </span>
                                    {membership.deleted_at && (
                                        <span className="ml-1 text-xs text-gray-400">
                                            (Supprimé)
                                        </span>
                                    )}
                                </span>
                                {!membership.deleted_at && (() => {
                                    const paymentStatus = getPaymentStatus(membership);
                                    return (
                                        <div className="flex items-center">
                                            {paymentStatus.status === "paid" ? (
                                                <Check className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className={`h-5 w-5 ${
                                                    paymentStatus.color === "red" ? "text-red-500" : "text-orange-500"
                                                }`} />
                                            )}
                                            <span className={`text-xs ml-1 ${
                                                paymentStatus.color === "green" ? "text-green-600" :
                                                paymentStatus.color === "orange" ? "text-orange-600" : "text-red-600"
                                            }`}>
                                                {paymentStatus.label}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700 font-medium">
                                    <Users className="h-5 w-5 text-gray-600" />
                                    <span>Enseignants :</span>
                                </div>
                                <div className="ml-6 space-y-1">
                                    {membership.teachers.map(
                                        (teacher, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-gray-600"
                                            >
                                                <UserCheck className="h-4 w-4 text-gray-500" />
                                                <span>
                                                    {teacher.subject}:{" "}
                                                    <span className="text-gray-800 font-medium">
                                                        {getTeacherName(
                                                            teacher.teacherId,
                                                        )}
                                                    </span>
                                                </span>
                                                {role === "admin" && (
                                                    <span className="text-gray-500">
                                                        (Montant :{" "}
                                                        {teacher.amount
                                                            ? teacher.amount
                                                            : "0"}{" "}
                                                        DH)
                                                    </span>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                        <FormModal
                            table="membership"
                            type="update"
                            teachers={teachers}
                            data={membership}
                            id={membership.id}
                            studentId={studentId}
                            offers={offers}
                        />
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-3 justify-end">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {new Date(membership.created_at).toLocaleDateString(
                                "fr-FR",
                            )}
                        </span>
                    </div>
                </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                    </button>
                    
                    <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                </div>
            )}

            {/* Show total count */}
            {sortedMemberships.length > 0 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                    {sortedMemberships.length} adhésion{sortedMemberships.length > 1 ? 's' : ''} au total
                </div>
            )}
        </div>
    );
}
