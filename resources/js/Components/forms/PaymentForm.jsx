import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import TransactionDetails from "../PaymentsAndTransactions/TransactionDetails";
import RecurringPaymentSettings from "../PaymentsAndTransactions/RecurringPaymentSettings";
import { format } from "date-fns";

// Define the formatCurrency function if it doesn't exist
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 2,
    }).format(amount);
};

const PaymentForm = ({
    transaction = null,
    errors = {},
    formType,
    onCancel,
    users,
}) => {
    const { auth, transactions = [] } = usePage().props;

    const [values, setValues] = useState({
        type: transaction?.type || "salary",
        user_id: transaction?.user_id || 0,
        amount: transaction?.amount || "",
        description: transaction?.description || "",
        payment_date: transaction?.payment_date
            ? new Date(transaction.payment_date)
            : new Date(),
        is_recurring: transaction?.is_recurring || false,
        frequency: transaction?.frequency || "monthly",
        next_payment_date: transaction?.next_payment_date
            ? new Date(transaction.next_payment_date)
            : "",
        category: transaction?.category || "other",
        user_name: transaction?.user_name || "",
        rest: transaction?.rest || 0,
        custom_category: "",
        // Add full_salary to keep track of the original salary amount
        full_salary: transaction?.full_salary || 0,
    });

    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCustomCategory, setShowCustomCategory] = useState(
        values.category === "other",
    );
    const [alreadyPaidInfo, setAlreadyPaidInfo] = useState(null);

    // Check if a payment already exists for the current month
    const checkExistingPayment = () => {
        // Ensure transactions is an array before filtering
        if (!Array.isArray(transactions) || transactions.length === 0)
            return null;

        const currentDate = new Date(values.payment_date);
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Find payments for the same user/category in the current month
        const existingPayments = transactions.filter((t) => {
            const paymentDate = new Date(t.payment_date);
            const sameMonth =
                paymentDate.getMonth() === currentMonth &&
                paymentDate.getFullYear() === currentYear;

            // Filter based on type
            if (
                values.type === "salary" ||
                values.type === "wallet" ||
                values.type === "payment"
            ) {
                return (
                    sameMonth &&
                    t.user_id === values.user_id &&
                    t.type === values.type &&
                    t.id !== (transaction?.id || 0)
                );
            } else if (values.type === "expense") {
                return (
                    sameMonth &&
                    t.category === values.category &&
                    t.type === "expense" &&
                    t.id !== (transaction?.id || 0)
                );
            }

            return false;
        });

        if (existingPayments.length > 0) {
            // Return info about the most recent payment
            const latestPayment = existingPayments.sort(
                (a, b) => new Date(b.payment_date) - new Date(a.payment_date),
            )[0];

            // Calculate total amount already paid this month
            const totalPaid = existingPayments.reduce(
                (sum, payment) => sum + parseFloat(payment.amount || 0),
                0,
            );

            // Check specific conditions for different user types
            let shouldShowWarning = false;
            let warningType = "already_paid";

            if (values.type === "salary") {
                if (selectedUser?.role === "teacher") {
                    // For teachers: Show warning only if they have wallet > 0 and are fully paid
                    const walletAmount = parseFloat(
                        selectedUser?.wallet ||
                            selectedUser?.teacher?.wallet ||
                            0,
                    );
                    shouldShowWarning =
                        walletAmount > 0 && totalPaid >= walletAmount;
                } else if (
                    selectedUser?.role === "assistant" ||
                    selectedUser?.role === "admin" ||
                    selectedUser?.role === "staff"
                ) {
                    // For assistants/staff: Show warning if total paid matches salary
                    const salaryAmount = parseFloat(selectedUser?.salary || 0);
                    if (totalPaid >= salaryAmount) {
                        shouldShowWarning = true;
                    } else {
                        // If partially paid, show a different message
                        shouldShowWarning = totalPaid > 0;
                        warningType = "partially_paid";
                    }
                }
            } else if (values.type === "expense") {
                // For expenses, always show warning if same category was paid this month
                shouldShowWarning = true;
            }

            if (shouldShowWarning) {
                return {
                    date: format(
                        new Date(latestPayment.payment_date),
                        "MMM dd, yyyy",
                    ),
                    amount: latestPayment.amount,
                    totalPaid: totalPaid,
                    type: latestPayment.type,
                    warningType: warningType,
                    recipient:
                        latestPayment.user_name ||
                        (latestPayment.user
                            ? latestPayment.user.name
                            : "Unknown"),
                    fullSalary: selectedUser
                        ? selectedUser.role === "teacher"
                            ? parseFloat(
                                  selectedUser.wallet ||
                                      selectedUser.teacher?.wallet ||
                                      0,
                              )
                            : parseFloat(selectedUser.salary || 0)
                        : 0,
                };
            }
        }

        return null;
    };

    // Effect to handle user selection and updates to form fields
    useEffect(() => {
        // Ensure users is an array, otherwise use empty array
        const safeUsers = Array.isArray(users) ? users : [];

        // Initialize an empty array to store filtered users
        let filtered = [];

        // Only try to filter if we have users
        if (safeUsers.length > 0) {
            // Filter by transaction type - only for salary type
            filtered =
                values.type === "salary"
                    ? safeUsers.filter((user) =>
                          ["teacher", "assistant", "admin", "staff"].includes(
                              user.role || "",
                          ),
                      )
                    : safeUsers;
        }

        setFilteredUsers(filtered);

        // If we have a selected user ID, find the user object
        if (values.user_id) {
            const user = filtered.find((u) => u.id === values.user_id);
            setSelectedUser(user || null);

            // If user is found, set the amount based on role
            if (user) {
                // Get the full salary amount
                let fullSalary = "";
                if (user.role === "teacher" && user.wallet) {
                    fullSalary = user.wallet;
                } else if (
                    (user.role === "assistant" ||
                        user.role === "admin" ||
                        user.role === "staff") &&
                    user.salary
                ) {
                    fullSalary = user.salary;
                }
                // If editing, auto-fill amount with total paid this month/year
                if (formType === "edit" && transaction) {
                    const existingPayment = checkExistingPayment();
                    setValues((prevValues) => ({
                        ...prevValues,
                        amount:
                            existingPayment && existingPayment.totalPaid
                                ? existingPayment.totalPaid
                                : "",
                        full_salary: fullSalary,
                        rest: fullSalary, // Optionally update rest as well
                    }));
                } else {
                    // Set initial amount to empty string - admin will input this
                    setValues((prevValues) => ({
                        ...prevValues,
                        amount: "",
                        full_salary: fullSalary,
                        rest: fullSalary, // Initially rest is full salary (nothing paid yet)
                    }));
                }
            }
        }
    }, [values.type, users, values.user_id, formType, transaction]);

    // Check for existing payments when relevant values change
    useEffect(() => {
        // Only check for existing payments when we have enough information
        if (
            (values.type === "salary" && values.user_id) ||
            (values.type === "expense" && values.category)
        ) {
            const existingPayment = checkExistingPayment();
            setAlreadyPaidInfo(existingPayment);
        } else {
            setAlreadyPaidInfo(null);
        }
    }, [values.type, values.user_id, values.category, values.payment_date]);

    // Get default description based on transaction type
    const getDefaultDescription = (type, userName = "") => {
        switch (type) {
            case "salary":
                return `Paiement de salaire pour ${userName || "membre du personnel"}`;
            case "wallet":
                return `Ajout de fonds au portefeuille pour ${userName || "enseignant"}`;
            case "payment":
                return `Paiement depuis le portefeuille pour ${userName || "enseignant"}`;
            case "expense":
                return "Dépense scolaire";
            default:
                return "Dépense scolaire";
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        const key = e.target.id || e.target.name;
        const value =
            e.target.type === "checkbox" ? e.target.checked : e.target.value;

        // Check if this is the category changing to/from 'other'
        if (key === "category") {
            setShowCustomCategory(value === "other");
        }

        setValues((values) => {
            const newValues = {
                ...values,
                [key]: value,
            };

            // If amount is changed, recalculate rest when in salary mode
            if (key === "amount" && values.type === "salary") {
                const paymentAmount = parseFloat(value) || 0;
                const fullSalary = parseFloat(values.full_salary) || 0;

                // Calculate remaining balance
                // For new payments, rest = full salary - amount
                // For existing payments, we might need a different calculation
                newValues.rest = Math.max(
                    0,
                    fullSalary - paymentAmount,
                ).toFixed(2);
            }

            return newValues;
        });
    };

    // Handle transaction type change
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        const userName = selectedUser ? selectedUser.name : "";

        setValues((prevValues) => ({
            ...prevValues,
            type: newType,
            user_id:
                newType === "salary" ||
                newType === "wallet" ||
                newType === "payment"
                    ? 0
                    : newType === "expense"
                      ? auth.user.id
                      : prevValues.user_id,
            description: getDefaultDescription(newType, userName),
            user_name:
                newType === "salary" ||
                newType === "wallet" ||
                newType === "payment"
                    ? ""
                    : prevValues.user_name,
            // Reset amount and rest when changing transaction type
            amount: "",
            rest: 0,
            full_salary: 0,
        }));

        // Reset selected user if switching from salary to expense
        if (newType === "expense") {
            setSelectedUser(null);
        }
    };

    // Handle date changes
    const handleDateChange = (field, date) => {
        setValues((values) => ({
            ...values,
            [field]: date,
        }));
    };

    // Handle user selection
    const handleUserSelect = (userId) => {
        const user = users.find((u) => u.id === parseInt(userId));

        if (user) {
            setSelectedUser(user);

            // Automatically determine payment type based on user role
            let transactionType;
            if (user.role === "teacher") {
                // FORCE payment type for teachers
                transactionType = "payment";
            } else if (["assistant", "admin", "staff"].includes(user.role)) {
                transactionType = "salary";
            } else {
                // Default case if role doesn't match expected values
                transactionType = "salary";
            }

            // Determine full salary based on user role and transaction type
            let fullSalary = 0;
            let defaultAmount = "";

            if (user.role === "teacher") {
                // For teachers, calculate wallet balance
                if (
                    user.teacher &&
                    typeof user.teacher.wallet !== "undefined"
                ) {
                    const walletBalance = parseFloat(user.teacher.wallet) || 0;
                    fullSalary = walletBalance;
                } else if (user.wallet) {
                    const walletBalance = parseFloat(user.wallet) || 0;
                    fullSalary = walletBalance;
                }
            } else if (
                (user.role === "assistant" ||
                    user.role === "admin" ||
                    user.role === "staff") &&
                user.salary
            ) {
                fullSalary = parseFloat(user.salary) || 0;
            }

            // Update the form values - make sure to set the correct transaction type
            setValues((prevValues) => {
                const newValues = {
                    ...prevValues,
                    type: transactionType, // CRITICAL: Use the correct transaction type
                    user_id: parseInt(userId),
                    user_name: user.name || "",
                    description: getDefaultDescription(
                        transactionType,
                        user.name || "",
                    ),
                    amount: defaultAmount,
                    full_salary: fullSalary,
                    rest: fullSalary.toFixed(2),
                };

                return newValues;
            });
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Make sure transaction type is correctly set based on selected user's role
        let finalType = values.type;

        // Always prioritize expense if selected
        if (values.type === "expense") {
            finalType = "expense";
        } else if (selectedUser && selectedUser.role === "teacher") {
            finalType = "payment";
        } else if (
            selectedUser &&
            ["assistant", "admin", "staff"].includes(selectedUser.role)
        ) {
            finalType = "salary";
        } else if (values.type === "expense") {
            finalType = "expense";
        }

        // For teachers, ensure the payment type is 'payment'
        const formattedValues = {
            ...values,
            type: finalType, // Use the corrected type
            payment_date: values.payment_date
                ? values.payment_date.toISOString().split("T")[0]
                : null,
            next_payment_date: values.next_payment_date
                ? values.next_payment_date.toISOString().split("T")[0]
                : null,
            // Set the category to custom value if "other" is selected
            category:
                values.category === "other" && values.custom_category
                    ? values.custom_category
                    : values.category,
        };

        // Add validation - ensure we have required fields
        if (!formattedValues.type) {
            alert("Le type de transaction est requis");
            return;
        }

        if (
            (formattedValues.type === "salary" ||
                formattedValues.type === "payment") &&
            !formattedValues.user_id
        ) {
            alert("Veuillez sélectionner un membre du personnel");
            return;
        }

        if (!formattedValues.amount) {
            alert("Le montant est requis");
            return;
        }

        try {
            if (formType === "edit" && transaction) {
                router.put(
                    route("transactions.update", transaction.id),
                    formattedValues,
                );
            } else {
                router.post(route("transactions.store"), formattedValues);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert(
                "Erreur lors de l'envoi de la transaction. Veuillez vérifier la console pour plus de détails.",
            );
        }
    };

    // Modify the transaction type dropdown to ensure it sets values correctly

    // When the form first renders, set the initial type and user_id based on the transaction or default
    useEffect(() => {
        if (transaction) {
            // If editing existing transaction, set the form to that transaction's type and user_id
            setValues((prev) => ({
                ...prev,
                type: transaction.type,
                user_id: transaction.user_id || prev.user_id,
            }));
        } else {
            // For new transactions, default to salary
            setValues((prev) => ({
                ...prev,
                type: "salary",
            }));
        }
    }, [transaction]);

    // Check if user selection is required
    const isUserSelectionRequired = values.type === "salary";

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {formType === "edit"
                            ? "Modifier la transaction de paiement"
                            : "Créer une nouvelle transaction de paiement"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {formType === "edit"
                            ? "Mettez à jour les détails d'un paiement ou d'une dépense existant(e)"
                            : "Saisissez les détails pour enregistrer un nouveau paiement ou une nouvelle dépense"}
                    </p>
                </div>

                {/* Payment Already Exists Message */}
                {alreadyPaidInfo && (
                    <div
                        className={`mb-6 p-4 rounded-md ${
                            alreadyPaidInfo.warningType === "already_paid"
                                ? "bg-amber-50 border-l-4 border-amber-500"
                                : "bg-blue-50 border-l-4 border-blue-500"
                        }`}
                    >
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg
                                    className={`h-5 w-5 ${
                                        alreadyPaidInfo.warningType ===
                                        "already_paid"
                                            ? "text-amber-600"
                                            : "text-blue-600"
                                    }`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                {alreadyPaidInfo.warningType ===
                                "already_paid" ? (
                                    <>
                                        <h3 className="text-sm font-medium text-amber-800">
                                            Paiement déjà effectué pour ce mois
                                        </h3>
                                        <div className="mt-1 text-sm text-amber-700">
                                            {values.type === "salary" ||
                                            values.type === "wallet" ||
                                            values.type === "payment" ? (
                                                <p>
                                                    <span className="font-medium">
                                                        {
                                                            alreadyPaidInfo.recipient
                                                        }
                                                    </span>{" "}
                                                    a déjà reçu le paiement complet de {" "}
                                                    <span className="font-medium">
                                                        {formatCurrency(
                                                            alreadyPaidInfo.fullSalary,
                                                        )}
                                                    </span>{" "}
                                                    pour ce mois (dernier paiement le {alreadyPaidInfo.date}).
                                                </p>
                                            ) : (
                                                <p>
                                                    Une dépense dans la catégorie "
                                                    <span className="font-medium">
                                                        {values.category}
                                                    </span>
                                                    " a déjà été payée ce mois-ci (
                                                    {formatCurrency(
                                                        alreadyPaidInfo.amount,
                                                    )}{" "}
                                                    le {alreadyPaidInfo.date}).
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Paiement partiel déjà effectué ce mois-ci
                                        </h3>
                                        <div className="mt-1 text-sm text-blue-700">
                                            <p>
                                                <span className="font-medium">
                                                    {alreadyPaidInfo.recipient}
                                                </span>{" "}
                                                a déjà reçu
                                                <span className="font-medium">
                                                    {" "}
                                                    {formatCurrency(
                                                        alreadyPaidInfo.totalPaid,
                                                    )}
                                                </span>{" "}
                                                sur un total de
                                                <span className="font-medium">
                                                    {" "}
                                                    {formatCurrency(
                                                        alreadyPaidInfo.fullSalary,
                                                    )}
                                                </span>{" "}
                                                pour ce mois.
                                            </p>
                                            <p className="mt-1">
                                                Reste à payer : {" "}
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        Math.max(
                                                            0,
                                                            alreadyPaidInfo.fullSalary -
                                                                alreadyPaidInfo.totalPaid,
                                                        ),
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    id="transaction-form"
                >
                    {/* Transaction Type selection at the top */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Type de transaction
                        </label>
                        <select
                            id="transaction_type_selector"
                            name="transaction_type_selector"
                            value={
                                values.type === "expense"
                                    ? "expense"
                                    : "staff_payment"
                            }
                            onChange={(e) => {
                                const selectedValue = e.target.value;

                                if (selectedValue === "expense") {
                                    // Set to expense type and reset user
                                    setSelectedUser(null);
                                    handleTypeChange({
                                        target: { value: "expense" },
                                    });
                                } else {
                                    // Default to salary for staff payments initially
                                    // The actual specific type (payment vs salary) will be determined by user role
                                    handleTypeChange({
                                        target: { value: "salary" },
                                    });
                                }
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="staff_payment">Paiement du personnel</option>
                            <option value="expense">Dépense</option>
                        </select>
                        {errors.type && (
                            <div className="text-red-500 mt-1 text-sm">
                                {errors.type}
                            </div>
                        )}

                        {/* Debug information */}
                        <div className="mt-2 text-xs text-gray-500">
                            Type de transaction actuel : {" "}
                            <span className="font-medium">{values.type}</span>
                        </div>
                    </div>

                    {/* Hidden input for the type - MUST BE CORRECT */}
                    <input
                        type="hidden"
                        name="type"
                        id="type"
                        value={values.type}
                    />

                    {/* Transaction Details */}
                    <TransactionDetails
                        values={values}
                        errors={errors}
                        handleChange={handleChange}
                        handleTypeChange={handleTypeChange}
                        handleDateChange={handleDateChange}
                        handleUserSelect={handleUserSelect}
                        showCustomCategory={showCustomCategory}
                        filteredUsers={filteredUsers}
                        selectedUser={selectedUser}
                        auth={auth}
                    />

                    <RecurringPaymentSettings
                        values={values}
                        errors={errors}
                        handleChange={handleChange}
                        handleDateChange={handleDateChange}
                    />

                    {/* Display the automatically determined payment type as info */}
                    {selectedUser && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-gray-700">
                                <span className="font-semibold">
                                    Type de paiement :{" "}
                                </span>
                                <span
                                    className={`px-2 py-1 rounded border ${
                                        selectedUser.role === "teacher"
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-blue-50 border-blue-200"
                                    }`}
                                >
                                    {selectedUser.role === "teacher"
                                        ? "Paiement depuis le portefeuille"
                                        : selectedUser.role === "assistant" ||
                                            selectedUser.role === "admin" ||
                                            selectedUser.role === "staff"
                                          ? "Paiement de salaire"
                                          : "Paiement"}
                                    <span className="text-xs text-gray-500 ml-1">
                                        ({values.type})
                                    </span>
                                </span>
                            </p>
                            {selectedUser.role === "teacher" && (
                                <p className="mt-1 text-sm text-amber-600">
                                    Remarque : Cela déduira le montant du solde du
                                    portefeuille de l'enseignant.
                                    {selectedUser?.teacher && (
                                        <span className="font-medium">
                                            {" "}
                                            Solde actuel du portefeuille :{" "}
                                            {formatCurrency(
                                                selectedUser.teacher.wallet ||
                                                    0,
                                            )}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 mt-8">
                        <button
                            type="button"
                            className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={onCancel}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {formType === "edit"
                                ? "Mettre à jour la transaction"
                                : "Créer la transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentForm;
