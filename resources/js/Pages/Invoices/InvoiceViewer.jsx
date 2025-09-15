import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import InvoiceDetails from "@/Components/InvoiceDetails";

const InvoiceViewer = ({ invoice }) => {
    return (
        <>
            <Head title={`Invoice #${invoice?.id || "Details"}`} />

            <div className="p-4">
                <div className="max-w-4xl mx-auto mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Invoice Details
                    </h1>
                    <InvoiceDetails invoice={invoice} />
                </div>
            </div>
        </>
    );
};

InvoiceViewer.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default InvoiceViewer;
