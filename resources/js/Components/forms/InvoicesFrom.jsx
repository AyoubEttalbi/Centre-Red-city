import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { router } from "@inertiajs/react";
import React, { useEffect, useState } from "react";

// Helper function to format date to 'YYYY-MM-DD' without timezone issues
const formatDateToYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// Define the schema for the form (after imports)
const invoiceSchema = z.object({
    membership_id: z.any().optional(),
    months: z.any(),
    billDate: z.string().min(1, { message: "La date de facturation est requise !" }),
    creationDate: z.any().optional(),
    totalAmount: z.any().optional(),
    amountPaid: z.any().optional(),
    rest: z.any().optional(),
    student_id: z.any().optional(),
    offer_id: z.any().optional(),
    endDate: z.string().optional(),
    includePartialMonth: z.boolean().optional(),
    // Accept string, undefined, or number, and coerce to number (default 0)
    partialMonthAmount: z.preprocess(
        (val) => val === "" || val === undefined ? 0 : Number(val),
        z.number()
    ),
    last_payment_date: z.any().optional(),
});

const InvoicesForm = ({
    type,
    data,
    setOpen,
    StudentMemberships = [],
    studentId,
}) => {
    // ...existing code...
    const today = new Date();
    const todayFormatted = formatDateToYYYYMMDD(today);

    // State to track whether to include partial month
    const [includePartialMonth, setIncludePartialMonth] = useState(
        data?.includePartialMonth || false,
    );

    // State to track loading
    const [loading, setLoading] = useState(false);

    // Track the initial amountPaid value
    const [initialAmountPaid, setInitialAmountPaid] = useState(
        data?.amountPaid || 0,
    );

    // Track if user is actively typing in amountPaid field
    const [isTypingAmountPaid, setIsTypingAmountPaid] = useState(false);
    
    // Track invalid input attempts
    const [showInvalidInput, setShowInvalidInput] = useState(false);

    // Format date to display in a more readable way
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            membership_id: data?.membership_id || "",
            months: data?.months || 1,
            billDate: data?.billDate
                ? formatDateToYYYYMMDD(data.billDate)
                : (() => {
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth();
                    const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
                    return `${startYear}-08-01`;
                })(),
            creationDate: data?.creationDate || todayFormatted,
            totalAmount: data?.totalAmount || 0,
            amountPaid: data?.amountPaid || 0,
            rest: data?.rest || 0,
            student_id: studentId,
            offer_id: data?.offer_id || "",
            endDate: data?.endDate || "",
            includePartialMonth: data?.includePartialMonth || false,
            partialMonthAmount: data?.partialMonthAmount || 0,
            last_payment_date: data?.last_payment_date || "",
        },
    });

    const selectedMembershipId = watch("membership_id");
    // Months list: Moroccan school year (August to July)
    const monthsList = (() => {
        const months = [];
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-based
        
        // Moroccan school year: August (month 7) to July (month 6)
        // If we're in August or later, start from current year
        // If we're before August, start from previous year
        const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
        
        for (let i = 0; i < 12; i++) {
            const monthIndex = (7 + i) % 12; // Start from August (7), wrap around to July (6)
            const year = startYear + Math.floor((7 + i) / 12);
            
            const date = new Date(year, monthIndex, 1);
            const monthNames = [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];
            const label = `${monthNames[monthIndex]} ${year}`;
            const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
            months.push({ label, value });
        }
        return months;
    })();


    // Default: use selectedMonths from data if present (for update), else current month
    const [selectedMonths, setSelectedMonths] = useState(() => {
        // 1. Use selectedMonths (array) if present (update mode, new format)
        if (type === 'update' && Array.isArray(data?.selectedMonths) && data.selectedMonths.length > 0) {
            return data.selectedMonths;
        }
        // 2. Use selected_months if present (update mode, legacy or backend format)
        if (type === 'update' && data?.selected_months) {
            if (typeof data.selected_months === 'string') {
                try {
                    const parsed = JSON.parse(data.selected_months);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (e) {}
            } else if (Array.isArray(data.selected_months)) {
                return data.selected_months;
            }
        }
        // 3. Fallback to legacy keys (for backward compatibility)
        if (type === 'update' && typeof data?.selectedMonths === "string" && data.selectedMonths) {
            return [data.selectedMonths];
        }
        // 4. If update and months is 0, return empty array (for partial month only)
        if (type === 'update' && data?.months === 0) {
            return [];
        }
        // 5. If months > 0 and billDate is set, infer the month from billDate
        if (type === 'update' && data?.months > 0 && data?.billDate) {
            // billDate is YYYY-MM-DD, convert to YYYY-MM
            const billMonth = data.billDate.slice(0, 7);
            return [billMonth];
        }
        // 6. For create mode: default to current month if it's in the school year, otherwise first month of school year
        if (type === 'create') {
            const currentMonth = today.getMonth(); // 0-based
            const currentYear = today.getFullYear();
            
            // Check if current month is in the school year (August to July)
            if (currentMonth >= 7) {
                // We're in August or later, use current month
                return [`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`];
            } else {
                // We're before August, use August of current year
                return [`${currentYear}-08`];
            }
        }
        // 7. Fallback to first month of school year
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
        return [`${startYear}-08`];
    });

    // Keep form value in sync with local state
    useEffect(() => {
        setValue("selectedMonths", selectedMonths);
    }, [selectedMonths, setValue]);

    // Keep billDate and endDate in sync with selection
    useEffect(() => {
        setValue("billDate", calculateBillingDate());
        setValue("endDate", calculateEndDate());
    }, [includePartialMonth, selectedMonths]);

    const amountPaid = watch("amountPaid");
    const watchIncludePartialMonth = watch("includePartialMonth");

    // Find the selected membership
    const selectedMembership = StudentMemberships.find(
        (membership) => membership.id === parseInt(selectedMembershipId),
    );




    // Helper to check if selected months are consecutive
    const areMonthsConsecutive = (monthsArr) => {
        if (!Array.isArray(monthsArr) || monthsArr.length < 2) return true;
        // Sort months by value (YYYY-MM)
        const sorted = [...monthsArr].sort();
        for (let i = 1; i < sorted.length; i++) {
            const [prevY, prevM] = sorted[i - 1].split('-').map(Number);
            const [currY, currM] = sorted[i].split('-').map(Number);
            let prevDate = new Date(prevY, prevM - 1, 1);
            let currDate = new Date(currY, currM - 1, 1);
            // Add 1 month to prevDate
            prevDate.setMonth(prevDate.getMonth() + 1);
            if (
                prevDate.getFullYear() !== currDate.getFullYear() ||
                prevDate.getMonth() !== currDate.getMonth()
            ) {
                return false;
            }
        }
        return true;
    };

    const monthsAreConsecutive = areMonthsConsecutive(selectedMonths);

    // Calculate the partial month amount
    const calculatePartialMonthAmount = () => {
        if (!selectedMembership || !includePartialMonth) return 0;
        const daysInCurrentMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
        ).getDate();
        const remainingDays = daysInCurrentMonth - today.getDate();
        const dailyRate = selectedMembership.price / daysInCurrentMonth;
        return Math.round(dailyRate * remainingDays);
    };

    // Calculate the total amount (partial month + full months)
    const partialMonthAmount = calculatePartialMonthAmount();
    // Only count months if months are selected and consecutive
    const monthsCount = (selectedMonths.length > 0 && monthsAreConsecutive) ? selectedMonths.length : 0;
    const fullMonthsAmount = selectedMembership && monthsCount > 0
        ? Math.round(selectedMembership.price) * monthsCount
        : 0;
    // If partial month is checked and no months are selected, only charge partial month
    // If both are selected, sum both
    // If only months are selected, charge for months
    // If neither, total is 0
    const computedTotalAmount = (includePartialMonth ? partialMonthAmount : 0) + fullMonthsAmount;
    const totalAmount = computedTotalAmount;
    const restAmount = totalAmount - (amountPaid ? Math.round(Number(amountPaid)) : 0);

    // Keep the form value in sync with the computed totalAmount and restAmount
    // Only update if the user is not actively typing in amountPaid field
    useEffect(() => {
        setValue("totalAmount", computedTotalAmount);
    }, [computedTotalAmount, setValue]);

    useEffect(() => {
        // Only update rest amount if user is not actively typing
        if (!isTypingAmountPaid) {
            setValue("rest", restAmount);
        }
    }, [restAmount, setValue, isTypingAmountPaid]);

    // Function to calculate the billing date (date debut) and end date (date fin)
    const calculateBillingDate = () => {
        // If partial month is included, start from today, else from the first selected month
        if (includePartialMonth) return todayFormatted;
        if (selectedMonths.length > 0) {
            const [year, month] = selectedMonths[0].split("-").map(Number);
            if (!isNaN(year) && !isNaN(month)) {
                const firstDay = new Date(year, month - 1, 1);
                return formatDateToYYYYMMDD(firstDay);
            }
        }
        // Default to first month of current school year if no months selected
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
        return `${startYear}-08-01`;
    };

    const calculateEndDate = () => {
        let validMonths = Array.isArray(selectedMonths)
            ? selectedMonths.filter((m) => typeof m === "string" && /^\d{4}-\d{2}$/.test(m))
            : [];
        if (validMonths.length > 0) {
            const lastMonth = validMonths[validMonths.length - 1];
            const [year, month] = lastMonth.split("-").map(Number);
            if (!isNaN(year) && !isNaN(month)) {
                const lastDay = new Date(year, month, 0); // month is 1-based
                if (!isNaN(lastDay.getTime())) {
                    return formatDateToYYYYMMDD(lastDay);
                }
            }
        }
        if (includePartialMonth) {
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return formatDateToYYYYMMDD(lastDay);
        }
        // Fallback: End of the first selected month or end of current school year if none selected
        if (selectedMonths.length > 0) {
            const lastMonth = selectedMonths[selectedMonths.length - 1];
            const [year, month] = lastMonth.split("-").map(Number);
            if (!isNaN(year) && !isNaN(month)) {
                const lastDay = new Date(year, month, 0);
                return formatDateToYYYYMMDD(lastDay);
            }
        }
        // Default to end of current school year (July 31st)
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const endYear = currentMonth >= 7 ? currentYear : currentYear - 1;
        return `${endYear}-07-31`;
    };

    const onSubmit = (formData) => {
        // ...existing code...
        // Set offer_id from selected membership
        const selectedMembership = StudentMemberships.find(m => m.id == formData.membership_id);
        if (selectedMembership) {
            formData.offer_id = selectedMembership.offer_id;
        }
        // Prevent submission if months are not consecutive
        if (!monthsAreConsecutive) {
            // ...existing code...
            return;
        }
        // Ensure amounts are integers
        formData.totalAmount = Math.round(formData.totalAmount);
        formData.amountPaid = Math.round(Number(formData.amountPaid));
        formData.rest = Math.round(formData.rest);
        formData.partialMonthAmount = Math.round(partialMonthAmount); // Use the calculated value

        // Debug logging
        console.log('Form submission data:', {
            includePartialMonth,
            partialMonthAmount,
            selectedMonths,
            totalAmount: formData.totalAmount,
            months: formData.months
        });

        // Always include selectedMonths as array in the payload
        formData.selectedMonths = selectedMonths;

        // Set months field to the number of selected months (if any and consecutive),
        // or 0 if only partial month, or fallback to 1 (should not happen)
        if (selectedMonths.length > 0 && monthsAreConsecutive) {
            formData.months = selectedMonths.length;
        } else if (includePartialMonth && selectedMonths.length === 0) {
            formData.months = 0;
        } else {
            formData.months = 1; // fallback, should not happen
        }

        // Update last_payment_date only if amountPaid has changed
        formData.last_payment_date =
            data?.amountPaid !== formData.amountPaid
                ? new Date().toISOString().slice(0, 19).replace("T", " ")
                : data.last_payment_date;

        setLoading(true);
        if (type === "create") {
            // ...existing code...
            router.post("/invoices", formData, {
                onSuccess: () => {
                    setOpen(false);
                    setLoading(false);
                },
                onError: () => {
                    setLoading(false);
                },
            });
        } else if (type === "update") {
            // ...existing code...
            router.put(`/invoices/${data.id}`, formData, {
                onSuccess: () => {
                    setOpen(false);
                    setLoading(false);
                    // ...existing code...
                },
                onError: () => {
                    setLoading(false);
                    // ...existing code...
                },
            });
        }
    };

    const onError = (errors) => {
        setLoading(false);
        // ...existing code...
    };

    // Calculate formatted dates for display
    const nextMonthLastDay = new Date(
        today.getFullYear(),
        today.getMonth() + 1 + 1,
        0,
    );
    const formattedNextMonthName = nextMonthLastDay.toLocaleDateString(
        "en-US",
        { month: "long" },
    );
    const handleAutoFill = () => {
        setValue("amountPaid", totalAmount);
        setValue("rest", 0);
        setIsTypingAmountPaid(false); // Reset typing state after auto-fill
    };

    // Handle amountPaid input events
    const handleAmountPaidFocus = () => {
        setIsTypingAmountPaid(true);
    };

    const handleAmountPaidBlur = () => {
        setIsTypingAmountPaid(false);
        // Update rest amount when user finishes typing
        const currentAmountPaid = watch("amountPaid");
        const newRestAmount = totalAmount - (currentAmountPaid ? Math.round(Number(currentAmountPaid)) : 0);
        setValue("rest", newRestAmount);
    };

    // Handle amountPaid input change with debouncing and validation
    const handleAmountPaidChange = (e) => {
        setIsTypingAmountPaid(true);
        
        // Allow only numbers, decimal point, and empty string
        const value = e.target.value;
        const isValidInput = /^[0-9]*\.?[0-9]*$/.test(value);
        
        if (isValidInput || value === '') {
            // Update the form value
            setValue("amountPaid", value);
            setShowInvalidInput(false);
            
            // Debounced update of rest amount
            setTimeout(() => {
                if (!isTypingAmountPaid) {
                    const currentAmountPaid = value;
                    const newRestAmount = totalAmount - (currentAmountPaid ? Math.round(Number(currentAmountPaid)) : 0);
                    setValue("rest", newRestAmount);
                }
            }, 500);
        } else {
            // Show invalid input warning
            setShowInvalidInput(true);
            setTimeout(() => setShowInvalidInput(false), 2000);
        }
    };

    // Handle partial month checkbox change (must be inside component)
    const handlePartialMonthChange = (e) => {
        setIncludePartialMonth(e.target.checked);
        setValue("includePartialMonth", e.target.checked);
    };

    // --- New logic: Block if current month is selected and partial month is checked ---
    const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthSelected = selectedMonths.includes(currentMonthValue);
    const invalidPartialAndCurrentMonth = includePartialMonth && currentMonthSelected;

    const isAssurance = data?.type === 'assurance';

    return (
        <form
            className="flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg"
            onSubmit={handleSubmit(onSubmit, onError)}
        >
            {/* Header with breadcrumb and title */}
            <div className="border-b pb-4">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span>Factures</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mx-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                    <span className="text-blue-600">
                        {type === "create" ? "Nouvelle facture" : "Modifier la facture"}
                    </span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-800">
                    {type === "create"
                        ? "Créer une nouvelle facture"
                        : "Mettre à jour la facture"}
                </h1>
            </div>

            {/* Info callout before form starts */}
            {/* {type === "create" && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-800">
                                Create an invoice by selecting a membership and payment period. All amounts are in Dirhams (DH).
                            </p>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Main form content in sections */}
            <div className="grid grid-cols-1 gap-6">
                {/* Membership Selection Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                        Détails de l'adhésion
                    </h2>

                    <div className="space-y-4">
                        {/* Membership Select Field or Assurance Badge */}
                        {isAssurance ? (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Type de facture</label>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">Assurance</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="membership_id"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Sélectionner l'adhésion{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="membership_id"
                                    {...register("membership_id")}
                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isAssurance}
                                >
                                    {type === "update" ? (
                                        <option value={data.membership_id}>
                                            {
                                                StudentMemberships.find(
                                                    (membership) =>
                                                        membership.id ===
                                                        data.membership_id,
                                                ).offer_name
                                            }{" "}
                                            (Prix :{" "}
                                            {Math.round(
                                                StudentMemberships.find(
                                                    (membership) =>
                                                        membership.id ===
                                                        data.membership_id,
                                                ).price,
                                            )}{" "}
                                            DH)
                                        </option>
                                    ) : (
                                        <>
                                            <option value="">
                                                Sélectionnez une adhésion
                                            </option>
                                            {StudentMemberships
                                                .filter(membership => membership.payment_status !== "paid" && !membership.deleted_at)
                                                .map(
                                                    (membership) => (
                                                        <option
                                                            key={membership.id}
                                                            value={membership.id}
                                                            className={
                                                                membership.payment_status !==
                                                                "paid"
                                                                    ? "bg-amber-50 font-medium"
                                                                    : ""
                                                            }
                                                        >
                                                            {membership.offer_name}{" "}
                                                            (Prix :{" "}
                                                            {Math.round(
                                                                membership.price,
                                                            )}{" "}
                                                            DH)
                                                            {membership.payment_status !==
                                                                "paid" && " - Impayé"}
                                                        </option>
                                                    ),
                                                )}
                                        </>
                                    )}
                                </select>
                                {errors.membership_id && (
                                    <span className="text-sm text-red-500">
                                        {errors.membership_id.message}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Membership Details or Assurance Details */}
                        {(isAssurance || type === "update" || selectedMembership) && (
                            <>
                                <div className="bg-white p-3 rounded-md border border-gray-200 mt-2">
                                    <h3 className="font-medium text-gray-700 mb-2">
                                        Résumé de l'adhésion sélectionnée
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        <div className="text-gray-600">Adhésion :</div>
                                        <div className="font-medium">
                                            {isAssurance ? 'Assurance' : selectedMembership?.offer_name}
                                        </div>
                                        <div className="text-gray-600">Prix :</div>
                                        <div className="font-medium">
                                            {isAssurance ? (data?.assurance_amount || 0) : (selectedMembership ? Math.round(selectedMembership.price) : '')} DH
                                        </div>
                                    </div>
                                </div>
                                {/* Only show months/partial month for non-assurance */}
                                {!isAssurance && (
                                    <>
                                        {/* Months Checkbox List */}
                                        <div className="flex flex-col gap-2 mt-4">
                                            <label className="text-sm font-medium text-gray-700">
                                                Mois à facturer {!includePartialMonth && <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                                                {monthsList.map((month, idx) => {
                                                    const checked = selectedMonths.includes(month.value);
                                                    return (
                                                        <label key={month.value} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                value={month.value}
                                                                checked={checked}
                                                                onChange={e => {
                                                                    let newSelected;
                                                                    if (e.target.checked) {
                                                                        newSelected = [...selectedMonths, month.value];
                                                                    } else {
                                                                        newSelected = selectedMonths.filter(m => m !== month.value);
                                                                    }
                                                                    setSelectedMonths(Array.from(new Set(newSelected)).sort());
                                                                }}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            {month.label}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {/* Only show error if partial month is NOT checked and no months are selected */}
                                            {!includePartialMonth && selectedMonths.length === 0 && (
                                                <span className="text-sm text-red-500">Veuillez sélectionner au moins un mois ou inclure le mois partiel.</span>
                                            )}
                                            {!monthsAreConsecutive && selectedMonths.length > 1 && (
                                                <span className="text-sm text-red-500">Les mois sélectionnés doivent être consécutifs.</span>
                                            )}
                                            {/* Show error if current month and partial month are both selected */}
                                            {invalidPartialAndCurrentMonth && (
                                                <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414A9 9 0 105.636 18.364l1.414 1.414A9 9 0 1018.364 5.636z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                                                    <span className="text-red-700 font-medium">Vous ne pouvez pas sélectionner le mois courant et inclure le paiement du mois partiel en même temps.</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Partial Month Option (single instance) */}
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="includePartialMonth"
                                                    checked={includePartialMonth}
                                                    onChange={handlePartialMonthChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label
                                                    htmlFor="includePartialMonth"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Inclure le paiement du mois partiel (aujourd'hui jusqu'à la fin de ce mois)
                                                </label>
                                            </div>
                                            {/* Partial Month Amount Display */}
                                            {includePartialMonth && selectedMembership && (
                                                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                                                    <div className="flex items-center">
                                                        <svg
                                                            className="h-5 w-5 text-blue-500 mr-2"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <div>
                                                            <p className="text-sm text-blue-800">
                                                                Paiement du mois partiel :{" "}
                                                                <span className="font-medium">
                                                                    {partialMonthAmount} DH
                                                                </span>
                                                                (" "
                                                                {Math.ceil(
                                                                    (new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate())
                                                                )}{" "}
                                                                jours restants dans le mois courant)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        
                        )}
                    </div>
                </div>

                {/* Billing Details Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                        Détails de facturation
                    </h2>

                    <div className="space-y-4">
                        {/* Bill Date Field */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="billDate"
                                className="text-sm font-medium text-gray-700"
                            >
                                Date de facturation{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="billDate"
                                {...register("billDate")}
                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                readOnly={isAssurance}
                            />
                            {errors.billDate && (
                                <span className="text-sm text-red-500">
                                    {errors.billDate.message}
                                </span>
                            )}
                        </div>

                        {/* End Date Field (Read-only) */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="endDate"
                                className="text-sm font-medium text-gray-700"
                            >
                                Date de fin
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                {...register("endDate")}
                                className="p-2 border border-gray-200 rounded-md bg-gray-100"
                                readOnly
                            />
                            <p className="text-xs text-gray-500">
                                Adhésion valable jusqu'au :{" "}
                                {formatDateForDisplay(watch("endDate"))}
                            </p>
                        </div>

                        {/* Amount Fields */}
                        <div className="space-y-4">
                            {/* Total Amount (Read-only) */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="totalAmount"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Montant total (DH)
                                </label>
                                <input
                                    type="text"
                                    id="totalAmount"
                                    {...register("totalAmount")}
                                    className="p-2 border border-gray-200 rounded-md bg-gray-100"
                                    readOnly
                                    value={isAssurance ? data?.assurance_amount || 0 : totalAmount}
                                />
                                <p className="text-xs text-gray-500">
                                    {includePartialMonth && partialMonthAmount > 0 && (
                                        <>
                                            {partialMonthAmount} DH (mois partiel)
                                            {monthsCount > 0 && ' + '}
                                        </>
                                    )}
                                    {monthsCount > 0 && (
                                        <>
                                            {fullMonthsAmount} DH ({monthsCount} mois)
                                        </>
                                    )}
                                    {(!includePartialMonth && monthsCount === 0) && (
                                        <>Aucun mois sélectionné.</>
                                    )}
                                </p>
                            </div>

                            {/* Amount Paid Field */}
                            <div className="flex flex-col gap-2">
                                {/* Label */}
                                <label
                                    htmlFor="amountPaid"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Montant payé (DH)
                                    {isTypingAmountPaid && (
                                        <span className="ml-2 text-xs text-blue-600 font-normal">
                                            (Saisie en cours...)
                                        </span>
                                    )}
                                </label>
                                <p className="text-xs text-gray-500">
                                    Entrez uniquement des chiffres (ex: 150 ou 150.50)
                                </p>
                                {showInvalidInput && (
                                    <p className="text-xs text-red-500 animate-pulse">
                                        ⚠️ Seuls les chiffres et le point décimal sont autorisés
                                    </p>
                                )}

                                {/* Input Container */}
                                <div className="relative">
                                    {/* Amount Paid Input */}
                                    <input
                                        type="text"
                                        id="amountPaid"
                                        placeholder="0"
                                        {...register("amountPaid")}
                                        onChange={handleAmountPaidChange}
                                        onFocus={handleAmountPaidFocus}
                                        onBlur={handleAmountPaidBlur}
                                        className={`block w-full p-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            showInvalidInput 
                                                ? 'border-red-300 bg-red-50' 
                                                : 'border-gray-300'
                                        }`}
                                    />

                                    {/* Button with Icon */}
                                    <button
                                        type="button"
                                        onClick={handleAutoFill}
                                        id="autoFillButton"
                                        className="absolute inset-y-0 right-0 px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M8 7h12m0 0l-4 4m4-4l-4-4m0 10H4m0 0l4 4m-4-4l4-4"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Remaining Amount (Read-only) */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="rest"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Montant restant (DH)
                                </label>
                                <input
                                    type="text"
                                    id="rest"
                                    {...register("rest")}
                                    className="p-2 border border-gray-200 rounded-md bg-gray-100"
                                    readOnly
                                    value={isAssurance ? (data?.assurance_amount || 0) - (amountPaid ? Math.round(Number(amountPaid)) : 0) : restAmount}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input
                type="hidden"
                {...register("last_payment_date")}
                value={new Date().toISOString().split("T")[0]}
            />
            {/* Ensure selectedMonths is always sent as JSON string */}
            <input
                type="hidden"
                {...register("selectedMonths")}
                value={JSON.stringify(selectedMonths)}
            />
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={loading || invalidPartialAndCurrentMonth}
                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        loading || invalidPartialAndCurrentMonth ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Traitement...
                        </div>
                    ) : (
                        `${type === "create" ? "Créer une facture" : "Mettre à jour la facture"}`
                    )}
                </button>
            </div>
        </form>
    );
};

export default InvoicesForm;
