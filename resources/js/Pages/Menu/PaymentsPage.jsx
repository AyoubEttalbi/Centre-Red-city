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
import { Plus, CreditCard, RefreshCw, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
// Optional styling extension if available at runtime
let XLSXStyle = null;
try {
    // eslint-disable-next-line global-require
    XLSXStyle = require("xlsx-js-style");
} catch (_) {
    XLSXStyle = null;
}

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
    const [isExporting, setIsExporting] = useState(false);

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

    const handleDownloadStats = () => {
        try {
            setIsExporting(true);
            const all = Array.isArray(transactions?.data)
                ? transactions.data
                : [];

            if (all.length === 0) {
                alert("Aucune donnée à exporter.");
                return;
            }

            const monthKey = (dateStr) => {
                const d = new Date(dateStr);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                return `${y}-${m}`;
            };

            const byMonth = {};
            all.forEach((t) => {
                const key = monthKey(t.payment_date);
                if (!byMonth[key]) {
                    byMonth[key] = { income: 0, expense: 0, count: { salary: 0, wallet: 0, expense: 0 }, items: [] };
                }
                const amount = parseFloat(t.amount || 0);
                if (t.type === "expense") {
                    byMonth[key].expense += amount;
                } else {
                    byMonth[key].income += amount;
                }
                byMonth[key].count[t.type] = (byMonth[key].count[t.type] || 0) + 1;
                byMonth[key].items.push(t);
            });

            const wb = XLSX.utils.book_new();

            const monthKeys = Object.keys(byMonth).sort();

            // Build Summary sheet with title + header + rows (AOA for better control)
            const summaryHeader = [
                "Mois",
                "Devise",
                "Revenu",
                "Dépense",
                "Solde",
                "Moyenne/transaction",
                "Salaire total",
                "Paiements total",
                "Dépenses total",
                "Nb transactions",
            ];

            const summaryRowsAoa = monthKeys.map((k) => {
                const m = byMonth[k];
                const count = m.items.length || 1;
                const salaryTotal = m.items
                    .filter((it) => it.type === "salary")
                    .reduce((s, it) => s + parseFloat(it.amount || 0), 0);
                const walletTotal = m.items
                    .filter((it) => it.type === "wallet")
                    .reduce((s, it) => s + parseFloat(it.amount || 0), 0);
                const expenseTotal = m.items
                    .filter((it) => it.type === "expense")
                    .reduce((s, it) => s + parseFloat(it.amount || 0), 0);

                return [
                    k,
                    "DH",
                    m.income,
                    m.expense,
                    m.income - m.expense,
                    (m.income + m.expense) / count,
                    salaryTotal,
                    walletTotal,
                    expenseTotal,
                    m.items.length,
                ];
            });

            const wsSummary = XLSX.utils.aoa_to_sheet([
                ["Résumé financier"],
                summaryHeader,
                ...summaryRowsAoa,
            ]);

            // Merge title row across all columns
            wsSummary["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: summaryHeader.length - 1 } },
            ];

            // Column widths
            wsSummary["!cols"] = [
                { wch: 12 }, // Mois
                { wch: 8 }, // Devise
                { wch: 14 }, // Revenu
                { wch: 14 }, // Dépense
                { wch: 14 }, // Solde
                { wch: 18 }, // Moyenne/transaction
                { wch: 14 }, // Salaire total
                { wch: 16 }, // Paiements total
                { wch: 16 }, // Dépenses total
                { wch: 16 }, // Nb transactions
            ];

            // Number/date formats for summary sheet
            const currencyCols = [2, 3, 4, 5, 6, 7, 8]; // 0-based index columns with numeric currency values
            for (let r = 2; r < summaryRowsAoa.length + 2; r++) {
                currencyCols.forEach((c) => {
                    const addr = XLSX.utils.encode_cell({ r, c });
                    if (wsSummary[addr]) wsSummary[addr].z = "#,##0.00";
                    // Center align numeric cells when styling is available
                    if (XLSXStyle && wsSummary[addr]) {
                        wsSummary[addr].s = {
                            ...(wsSummary[addr].s || {}),
                            alignment: { horizontal: "center" },
                        };
                    }
                });
            }

            // Apply header and title styles if styling lib is present
            if (XLSXStyle) {
                const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
                if (wsSummary[titleAddr]) {
                    wsSummary[titleAddr].s = {
                        font: { bold: true, sz: 14, color: { rgb: "1F2937" } },
                        alignment: { horizontal: "center", vertical: "center" },
                    };
                }
                for (let c = 0; c < summaryHeader.length; c++) {
                    const addr = XLSX.utils.encode_cell({ r: 1, c });
                    if (wsSummary[addr]) {
                        wsSummary[addr].s = {
                            font: { bold: true, color: { rgb: "111827" } },
                            fill: { fgColor: { rgb: "F3F4F6" } },
                            border: {
                                top: { style: "thin", color: { rgb: "E5E7EB" } },
                                bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                                left: { style: "thin", color: { rgb: "E5E7EB" } },
                                right: { style: "thin", color: { rgb: "E5E7EB" } },
                            },
                        };
                    }
                }
                // Freeze panes below header (keep title + header visible)
                wsSummary["!freeze"] = { xSplit: 0, ySplit: 2, topLeftCell: "A3", activePane: "bottomLeft", state: "frozen" };
            }

            // Add AutoFilter over the data range
            const toColLetter = (n) => {
                let s = "";
                while (n >= 0) {
                    s = String.fromCharCode((n % 26) + 65) + s;
                    n = Math.floor(n / 26) - 1;
                }
                return s;
            };
            const lastCol = toColLetter(summaryHeader.length - 1);
            const lastRow = summaryRowsAoa.length + 2; // includes title + header
            wsSummary["!autofilter"] = { ref: `A2:${lastCol}${lastRow}` };

            XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

            monthKeys.forEach((k) => {
                const rows = byMonth[k].items.map((t) => ({
                    ID: t.id,
                    Date: t.payment_date,
                    Type: t.type,
                    Montant: parseFloat(t.amount || 0),
                    Utilisateur: t.user?.name || t.user_name || "",
                    Email: t.user?.email || t.user_email || "",
                    Rôle: t.user?.role || t.user_role || "",
                    Méthode: t.method || t.payment_method || "",
                    Statut: t.status || t.transaction_status || "",
                    Référence: t.reference || t.invoice_number || "",
                    Description: t.description || "",
                }));

                const headers = [
                    "ID",
                    "Date",
                    "Type",
                    "Montant",
                    "Utilisateur",
                    "Email",
                    "Rôle",
                    "Méthode",
                    "Statut",
                    "Référence",
                    "Description",
                ];

                const aoa = [[`Détails - ${k}`], headers, ...rows.map((r) => headers.map((h) => r[h]))];
                const ws = XLSX.utils.aoa_to_sheet(aoa);

                // Merge title row
                ws["!merges"] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
                ];

                // Column widths
                ws["!cols"] = headers.map((h) => {
                    const base = String(h).length + 2;
                    return { wch: Math.min(28, Math.max(base, 14)) };
                });

                // Number/date formats
                for (let r = 2; r < rows.length + 2; r++) {
                    const dateAddr = XLSX.utils.encode_cell({ r, c: 1 });
                    const amtAddr = XLSX.utils.encode_cell({ r, c: 3 });
                    if (ws[dateAddr] && ws[dateAddr].v) ws[dateAddr].z = "yyyy-mm-dd";
                    if (ws[amtAddr]) ws[amtAddr].z = "#,##0.00";
                    if (XLSXStyle) {
                        if (ws[amtAddr]) ws[amtAddr].s = { ...(ws[amtAddr].s || {}), alignment: { horizontal: "center" } };
                    }
                }

                // Apply styles if available
                if (XLSXStyle) {
                    const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
                    if (ws[titleAddr]) {
                        ws[titleAddr].s = {
                            font: { bold: true, sz: 14, color: { rgb: "1F2937" } },
                            alignment: { horizontal: "center", vertical: "center" },
                        };
                    }
                    for (let c = 0; c < headers.length; c++) {
                        const addr = XLSX.utils.encode_cell({ r: 1, c });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { bold: true, color: { rgb: "111827" } },
                                fill: { fgColor: { rgb: "F9FAFB" } },
                                border: {
                                    top: { style: "thin", color: { rgb: "E5E7EB" } },
                                    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                                    left: { style: "thin", color: { rgb: "E5E7EB" } },
                                    right: { style: "thin", color: { rgb: "E5E7EB" } },
                                },
                            };
                        }
                    }
                    // Freeze panes below header (title + header)
                    ws["!freeze"] = { xSplit: 0, ySplit: 2, topLeftCell: "A3", activePane: "bottomLeft", state: "frozen" };
                }

                // AutoFilter for detail sheet
                const detailLastCol = toColLetter(headers.length - 1);
                const detailLastRow = rows.length + 2;
                ws["!autofilter"] = { ref: `A2:${detailLastCol}${detailLastRow}` };

                const safeName = k.slice(0, 31);
                XLSX.utils.book_append_sheet(wb, ws, safeName);
            });

            const now = new Date();
            const filename = `payments_stats_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (e) {
            console.error(e);
            alert("Échec de l'export. Veuillez réessayer.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="py-4 px-2 sm:px-4 md:px-6 lg:px-8 w-full">
            <div className="w-full max-w-7xl mx-auto">
                <PageHeader
                    title="Gestion des paiements"
                    description="Consultez, créez et gérez toutes vos transactions financières"
                >
                    {activeView !== "form" && activeView !== "batch" && (
                        <div className="flex items-stretch justify-between gap-2 sm:gap-3 w-full flex-wrap">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
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

                            <div className="flex items-center">
                                <button
                                    onClick={handleDownloadStats}
                                    disabled={isExporting}
                                    className={`flex items-center gap-2 px-3 py-2 sm:px-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors duration-200 w-full sm:w-auto ${isExporting ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isExporting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Download size={18} />
                                    )}
                                    <span className="hidden sm:inline">Exporter</span>
                                    <span className="sm:hidden">Export</span>
                                </button>
                            </div>
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
