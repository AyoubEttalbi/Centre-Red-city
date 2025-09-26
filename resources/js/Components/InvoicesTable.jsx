import { FaFileInvoice } from "react-icons/fa";
import FormModal from "./FormModal";
import { format, parseISO } from "date-fns";
import { Printer, AlertCircle, Eye } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import InvoiceDetails from "./InvoiceDetails";

const InvoicesTable = ({
    invoices = [],
    Student_memberships = [],
    studentId = null,
    student = null, // Add student prop for complete student information
    Allclasses = [], // Add classes data
    Allschools = [], // Add schools data
}) => {
    const [loading, setLoading] = useState(false); // Global loading state
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

    useEffect(() => {
        // Function to check if the screen is small (mobile)
        const checkScreen = () => {
            setIsSmallScreen(window.matchMedia('(max-width: 640px)').matches);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    // Helper function to get membership payment status based on invoices
    const getMembershipPaymentStatus = (membership) => {
        const membershipInvoices = membership.invoices || [];
        if (membershipInvoices.length === 0) return "not_paid";
        
        const totalAmount = membershipInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0), 0);
        const totalPaid = membershipInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amountPaid) || 0), 0);
        
        if (totalPaid === 0) return "not_paid";
        if (totalPaid < totalAmount) return "not_fully_paid";
        return "paid";
    };
    
    // Count unpaid and not fully paid memberships (excluding deleted ones)
    const unpaidMembershipsCount = Student_memberships.filter(
        (m) => getMembershipPaymentStatus(m) === "not_paid" && !m.deleted_at,
    ).length;
    
    const notFullyPaidMembershipsCount = Student_memberships.filter(
        (m) => getMembershipPaymentStatus(m) === "not_fully_paid" && !m.deleted_at,
    ).length;
    
    const totalUnpaidMemberships = unpaidMembershipsCount + notFullyPaidMembershipsCount;

    const formatDate = (dateString, formatType) => {
        if (!dateString) return "N/A";
        try {
            const date = parseISO(dateString);
            return format(date, formatType);
        } catch (error) {
            return dateString;
        }
    };

    const handleDownload = async (invoiceId) => {
        setLoading(true);
        setTimeout(() => {
            window.location.href = `/invoices/${invoiceId}/pdf`;
            setLoading(false);
        }, 2000);
    };

    const handleInvoiceClick = (invoice) => {
        // Find associated membership to get additional data (including soft-deleted ones)
        const membership = Student_memberships.find(
            (m) => m.id === invoice.membership_id,
        );
        
        // Get class and school names
        const classInfo = Allclasses.find(c => c.id === student?.classId);
        const schoolInfo = Allschools.find(s => s.id === student?.schoolId);
        
        // Prepare complete invoice data for the details component
        const completeInvoiceData = {
            ...invoice,
            // Student information from student prop
            student_name: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
            student_class: classInfo?.name || 'N/A',
            student_school: schoolInfo?.name || 'N/A',
            student_id: studentId,
            
            // Invoice details
            creationDate: invoice.created_at,
            billDate: invoice.billDate,
            endDate: invoice.endDate,
            months: invoice.months || 1,
            totalAmount: invoice.totalAmount || 0,
            amountPaid: invoice.amountPaid || 0,
            rest: invoice.rest || 0,
            
            // Offer information from membership (including deleted ones)
            offer_name: membership?.offer_name || 'N/A',
            offer_id: membership?.offer_id || null,
            membership_deleted: membership?.deleted_at ? true : false,
            
            // Additional fields
            includePartialMonth: invoice.includePartialMonth || false,
            partialMonthAmount: invoice.partialMonthAmount || 0,
            type: invoice.type || 'membership',
            
            // Payment history (if available)
            payments: invoice.payments || [],
            last_payment: invoice.last_payment || null,
        };
        

        
        setSelectedInvoice(completeInvoiceData);
        setShowInvoiceDetails(true);
    };

    const closeInvoiceDetails = () => {
        setShowInvoiceDetails(false);
        setSelectedInvoice(null);
    };

    // Sort invoices by created_at descending (latest first)
    const sortedInvoices = [...invoices].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    return (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden relative">
            {/* Invoice Details Modal */}
            {showInvoiceDetails && selectedInvoice && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <InvoiceDetails 
                        invoice={selectedInvoice} 
                        onClose={closeInvoiceDetails}
                    />
                </div>
            )}

            {/* Full-Screen Loading Animation */}
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            <div className="p-4 bg-gray-200 text-black">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold flex items-center">
                            <FaFileInvoice className="mr-2" /> Factures
                        </h2>
                        {Student_memberships.filter(m => m.deleted_at).length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                {Student_memberships.filter(m => m.deleted_at).length} adhésion{Student_memberships.filter(m => m.deleted_at).length > 1 ? 's' : ''} supprimée{Student_memberships.filter(m => m.deleted_at).length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <FormModal
                            table="invoice"
                            type="create"
                            StudentMemberships={Student_memberships}
                            studentId={studentId}
                            {...(isSmallScreen ? { screen: "small" } : {})}
                        />
                        {totalUnpaidMemberships > 0 && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {totalUnpaidMemberships} non payé{totalUnpaidMemberships > 1 ? 's' : ''}
                                {notFullyPaidMembershipsCount > 0 && (
                                    <span className="ml-1 text-orange-700">
                                        ({notFullyPaidMembershipsCount} partiel{notFullyPaidMembershipsCount > 1 ? 's' : ''})
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Unpaid memberships notification */}
            {totalUnpaidMemberships > 0 && (
                <div className="p-3 bg-amber-50 border-b border-amber-200">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-amber-700">
                                Cet élève a {totalUnpaidMemberships} adhésion{totalUnpaidMemberships > 1 ? 's' : ''} non payée{totalUnpaidMemberships > 1 ? 's' : ''}.
                                {notFullyPaidMembershipsCount > 0 && (
                                    <span> ({notFullyPaidMembershipsCount} non entièrement payée{notFullyPaidMembershipsCount > 1 ? 's' : ''})</span>
                                )}
                                Créez une nouvelle facture pour compléter le paiement.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
         
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date de facturation
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date de création
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dernier paiement
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Montant
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reste
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Offre
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut de paiement
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedInvoices.map((invoice, index) => {
                            // Find associated membership
                            const membership = Student_memberships.find(
                                (m) => m.id === invoice.membership_id,
                            );
                            const isPaid =
                                membership &&
                                membership.payment_status === "paid";
                            const isDeleted = membership?.deleted_at;

                            return (
                                <tr
                                    key={index}
                                    className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                                        isDeleted ? "bg-gray-100" : 
                                        !isPaid ? "bg-amber-50" : ""
                                    }`}
                                    
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleInvoiceClick(invoice);
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Voir les détails de la facture ${invoice.id}`}
                                >
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {formatDate(
                                            invoice.billDate,
                                            "yyyy-MM",
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {formatDate(
                                            invoice.created_at,
                                            "dd-MMM-yyyy HH:mm",
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {formatDate(
                                            invoice.last_payment,
                                            "dd-MMM-yyyy HH:mm",
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {invoice.amountPaid} DH
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {invoice.rest > 0 ? (
                                            <span className="text-amber-700 font-medium">
                                                {invoice.rest} DH
                                            </span>
                                        ) : (
                                            <span className="text-green-700 font-medium">
                                                0 DH
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {invoice.type === 'assurance' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                Assurance
                                            </span>
                                        ) : (
                                            <div className="flex items-center">
                                                {(() => {
                                                    const membership = Student_memberships.find(
                                                        (membership) =>
                                                            membership.id === invoice.membership_id,
                                                    );
                                                    const offerName = membership?.offer_name || "---";
                                                    const isDeleted = membership?.deleted_at;
                                                    
                                                    return (
                                                        <>
                                                            <span className={isDeleted ? "line-through text-gray-500" : ""}>
                                                                {offerName}
                                                            </span>
                                                            {isDeleted && (
                                                                <span className="ml-1 text-xs text-gray-400">
                                                                    (Supprimé)
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900" onClick={() => handleInvoiceClick(invoice)}>
                                        {(() => {
                                            // Determine payment status based on amountPaid vs totalAmount
                                            if (invoice.amountPaid === 0) {
                                                return (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                        Non payé
                                                    </span>
                                                );
                                            } else if (invoice.amountPaid < invoice.totalAmount) {
                                                return (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                        Non entièrement payé
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        Payé
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>
                                    <td className="p-3 text-sm text-gray-900">
                                        <div className="flex items-center gap-2">
                                            
                                            <button
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-400 hover:bg-gray-500 transition duration-200"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click
                                                    handleDownload(invoice.id);
                                                }}
                                                disabled={loading}
                                                aria-label="Télécharger la facture"
                                            >
                                                <Printer className="w-4 h-4 text-white" />
                                            </button>
                                            <FormModal
                                                table="invoice"
                                                type="update"
                                                id={invoice.id}
                                                studentId={studentId}
                                                data={invoice}
                                                StudentMemberships={
                                                    Student_memberships
                                                }
                                            />
                                            <FormModal
                                                table="invoice"
                                                type="delete"
                                                id={invoice.id}
                                                route="invoices"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty state */}
            {(!invoices || invoices.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                    {totalUnpaidMemberships > 0 ? (
                        <div className="flex flex-col items-center">
                            <p className="mb-4">
                                Aucune facture trouvée. Créez une facture pour compléter le paiement de l'adhésion.
                            </p>
                            
                        </div>
                    ) : (
                        <p>Aucune facture trouvée.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoicesTable;
