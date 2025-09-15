import React, { useState, useEffect, Suspense } from "react";
import { router } from "@inertiajs/react";
import PageHeader from "@/Components/PaymentsAndTransactions/PageHeader";
import PaymentsList from "@/Components/PaymentsAndTransactions/PaymentsList";
const PaymentForm = React.lazy(() => import("@/Components/forms/PaymentForm"));
import PaymentDetails from "@/Components/PaymentsAndTransactions/PaymentDetails";
import DashboardLayout from "@/Layouts/DashboardLayout";
import UserSelect from "@/Components/PaymentsAndTransactions/UserSelect";
import TransactionAnalytics from "@/Components/PaymentsAndTransactions/TransactionAnalytics";
import Alert from "@/Components/PaymentsAndTransactions/Alert";
import BatchPaymentForm from "@/Components/PaymentsAndTransactions/BatchPaymentForm";
import RecurringTransactionsPage from "../Payments/RecurringTransactionsPage";
import Pagination from "@/Components/Pagination";
import AdminEarningsSection from "@/Components/PaymentsAndTransactions/AdminEarningsSection";
import axios from "axios";
import { Plus, CreditCard, RefreshCw } from "lucide-react";

const PaymentsPage = ({
    transactions,
    transaction,
    users,
    formType,
    flash,
    errors,
    teacherCount,
    assistantCount,
    totalWallet,
    totalSalary,
    recurringTransactions,
    adminEarnings,
}) => {
    // Ensure users is always an array
    const safeUsers = Array.isArray(users) ? users : [];

    const [showForm, setShowForm] = useState(formType ? true : false);
    const [showDetails, setShowDetails] = useState(transaction ? true : false);
    const [activeView, setActiveView] = useState(
        formType ? "form" : transaction && !formType ? "details" : "list",
    );
    const [localAdminEarnings, setLocalAdminEarnings] = useState(
        adminEarnings || [],
    );

    // Fetch admin earnings data if not provided
    useEffect(() => {
        if (
            !adminEarnings ||
            (adminEarnings?.earnings && adminEarnings.earnings.length === 0)
        ) {
            axios
                .get(route("admin.earnings.dashboard"))
                .then((response) => {
                    setLocalAdminEarnings(response.data);
                })
                .catch(() => {});
        }
    }, [adminEarnings]);

    // Update state when props change (e.g., after navigation)
    useEffect(() => {
        setShowForm(formType ? true : false);
        setShowDetails(transaction && !formType ? true : false);
        setActiveView(
            formType ? "form" : transaction && !formType ? "details" : "list",
        );
    }, [formType, transaction]);

    const handleCreateNew = () => {
        router.get(route("transactions.create"));
    };

    const handleBatchPayment = () => {
        setActiveView("batch");
    };

    const handleCancelForm = () => {
        router.get(route("transactions.index"));
    };

    const handleViewDetails = (id) => {
        if (typeof id === "object" && id.transactions) {
            router.get(
                route("employees.transactions", { employee: id.userId }),
            );
        } else {
            router.get(route("transactions.show", { transaction: id }));
        }
    };

    const handleEditTransaction = (id) => {
        router.get(route("transactions.edit", id));
    };

    const handleDeleteTransaction = (id) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
            router.delete(route("transactions.destroy", id));
        }
    };

    const handleMakePayment = (employeeId, balance, employeeData) => {
        const formData = {
            user_id: employeeId,
            type: employeeData.role === "teacher" ? "payment" : "salary",
            amount: balance > 0 ? balance : 0,
            payment_date: new Date().toISOString().split("T")[0],
            description: `${employeeData.role === "teacher" ? "Paiement" : "Paiement de salaire"} pour ${employeeData.userName}`,
            is_recurring: false,
        };
        router.get(route("transactions.create"), formData);
    };

    const handleEditEmployee = (editInfo) => {
        const transactionId = editInfo?.transactionId || editInfo;
        if (!transactionId) {
            alert("Aucun ID de transaction fourni.");
            return;
        }
        router.get(route("transactions.edit", { transaction: transactionId }));
    };

    const handleSubmit = (formData, id = null) => {
        if (formType === "edit" && id) {
            router.put(route("transactions.update", id), formData);
        } else {
            router.post(route("transactions.store"), formData);
        }
    };

    const handleBatchSubmit = (formData) => {
        router.post(route("transactions.batch-pay"), formData);
    };

    const handleProcessRecurring = () => {
        setActiveView("recurring");
        router.get(route("transactions.recurring"));
    };

    return (
        <div className="py-4 px-2 sm:px-4 md:px-6 lg:px-8 w-full">
            <div className="w-full max-w-7xl mx-auto">
                <PageHeader
                    title="Gestion des paiements"
                    description="Consultez, créez et gérez toutes vos transactions financières"
                >
                    {activeView !== "form" && activeView !== "batch" && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full">
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 w-full sm:w-auto"
                            >
                                <Plus size={18} />
                                Ajouter une transaction
                            </button>

                            <button
                                onClick={handleBatchPayment}
                                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 w-full sm:w-auto"
                            >
                                <CreditCard size={18} />
                                Paiement groupé
                            </button>

                            <button
                                onClick={handleProcessRecurring}
                                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 w-full sm:w-auto"
                            >
                                <RefreshCw size={18} />
                                Traiter les récurrents
                            </button>
                        </div>
                    )}
                    {(activeView === "form" || activeView === "batch") && (
                        <button
                            onClick={handleCancelForm}
                            className="px-3 py-2 sm:px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-auto"
                        >
                            Annuler
                        </button>
                    )}
                </PageHeader>
                {flash?.success && (
                    <Alert
                        type="success"
                        message={flash.success}
                        className="mb-6"
                    />
                )}
                <div className="bg-white h-full shadow-sm sm:rounded-lg w-full">
                    <div className="p-3 sm:p-6 bg-white border-b border-gray-200">
                        {activeView === "list" && (
                            <PaymentsList
                                transactions={transactions}
                                onView={handleViewDetails}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                                users={safeUsers}
                                onMakePayment={handleMakePayment}
                                onEditEmployee={handleEditEmployee}
                                adminEarnings={localAdminEarnings}
                            />
                        )}
                        {activeView === "form" && (
                            <Suspense fallback={<div>Chargement du formulaire...</div>}>
                                <PaymentForm
                                    transaction={transaction}
                                    transactions={transactions.data}
                                    errors={errors}
                                    formType={formType || "create"}
                                    onCancel={handleCancelForm}
                                    onSubmit={handleSubmit}
                                    users={safeUsers}
                                />
                            </Suspense>
                        )}
                        {activeView === "details" && transaction && (
                            <PaymentDetails
                                transaction={transaction}
                                onEdit={() =>
                                    handleEditTransaction(transaction.id)
                                }
                                onBack={() => {
                                    router.get(route("transactions.index"));
                                }}
                            />
                        )}
                        {activeView === "batch" && (
                            <BatchPaymentForm
                                teacherCount={teacherCount}
                                assistantCount={assistantCount}
                                totalWallet={totalWallet}
                                totalSalary={totalSalary}
                                transactions={transactions.data}
                                errors={errors}
                                onCancel={handleCancelForm}
                                onSubmit={handleBatchSubmit}
                                users={safeUsers}
                            />
                        )}
                        {activeView === "recurring" && (
                            <RecurringTransactionsPage
                                recurringTransactions={recurringTransactions}
                                flash={flash}
                                errors={errors}
                                isEmbedded={true}
                            />
                        )}
                    </div>
                </div>
                <Pagination links={transactions.links} />
                {localAdminEarnings && (
                    <AdminEarningsSection adminEarnings={localAdminEarnings} />
                )}
            </div>
        </div>
    );
};

PaymentsPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default PaymentsPage;
