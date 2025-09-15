import React, { Suspense, lazy } from "react";

const AssistantPaymentsCard = lazy(() => import("./AssistantPaymentsCard"));

export default function AssistantProfile({
    assistant = {},
    transactions = [],
}) {
    return (
        <div className="space-y-6">
            {/* Section des paiements */}
            {transactions && transactions.length > 0 && assistant.user_id && (
                <div className="mb-6">
                    <Suspense fallback={<span>Chargement...</span>}>
                        <AssistantPaymentsCard
                            transactions={transactions}
                            userId={assistant.user_id}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
