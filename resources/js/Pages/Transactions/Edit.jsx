import React from "react";
import { router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import PaymentForm from "@/Components/forms/PaymentForm";
import PageHeader from "@/Components/PaymentsAndTransactions/PageHeader";

const Edit = ({ transaction, users, errors }) => {
    const handleSubmit = (formData) => {
        router.put(route("transactions.update", transaction.id), formData);
    };

    const handleCancel = () => {
        router.get(route("transactions.index"));
    };

    return (
        <div className="py-6">
            <div className="mx-20 sm:px-6 lg:px-8">
                <PageHeader
                    title="Modifier la transaction"
                    description="Modifiez les détails de la transaction"
                >
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Annuler
                    </button>
                </PageHeader>

                <div className="bg-white h-full shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <PaymentForm
                            transaction={transaction}
                            errors={errors}
                            formType="edit"
                            onCancel={handleCancel}
                            onSubmit={handleSubmit}
                            users={users}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

Edit.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Edit;
