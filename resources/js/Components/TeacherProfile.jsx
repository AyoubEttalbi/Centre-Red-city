import React, { Suspense, lazy } from "react";

// Lazy load child components
const TeacherInvoicesTable = lazy(() => import("./TeacherInvoicesTable"));
const RecurringPaymentsCard = lazy(() => import("./RecurringPaymentsCard"));

export default function TeacherProfile({
    invoices = [],
    paginate = [],
    teacher = {},
    transactions = [],
    filterOptions = {},
    filters = {},
    invoiceStats = {},
}) {
    return (
        <div className="space-y-6">
            

            {/* Tableau des factures */}
            <Suspense fallback={<span>Chargement...</span>}>
                <TeacherInvoicesTable
                    invoices={invoices}
                    invoiceslinks={paginate}
                    filterOptions={filterOptions}
                    filters={filters.invoice_filters || {}}
                    teacherId={teacher.id}
                    invoiceStats={invoiceStats}
                />
            </Suspense>
            {/* Section des paiements */}
            {transactions && transactions.length > 0 && teacher.user_id && (
                <div className="mb-6">
                    <Suspense fallback={<span>Chargement...</span>}>
                        <RecurringPaymentsCard
                            transactions={transactions}
                            userId={teacher.user_id}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
