import React, { useState } from "react";
import InputError from "@/Components/InputError";
import { router } from "@inertiajs/react";
import DatePicker from "react-datepicker";
import { Select } from "../ui/select";

const NewPaymentForm = ({
    transaction = null,
    errors = {},
    formType,
    onCancel,
}) => {
    const [values, setValues] = useState({
        type: transaction?.type || "expense",
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
    });

    const transactionTypes = [
        { value: "expense", label: "Expense" },
        { value: "salary", label: "Salary Payment" },
        { value: "utility", label: "Utility Bill" },
        { value: "maintenance", label: "Maintenance" },
        { value: "supplies", label: "Supplies" },
        { value: "other", label: "Other" },
    ];

    const frequencyOptions = [
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "custom", label: "Custom" },
    ];

    const handleChange = (e) => {
        const key = e.target.id || e.target.name;
        const value =
            e.target.type === "checkbox" ? e.target.checked : e.target.value;

        setValues((values) => ({
            ...values,
            [key]: value,
        }));
    };

    const handleDateChange = (field, date) => {
        setValues((values) => ({
            ...values,
            [field]: date,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedValues = {
            ...values,
            payment_date: values.payment_date
                ? values.payment_date.toISOString().split("T")[0]
                : null,
            next_payment_date: values.next_payment_date
                ? values.next_payment_date.toISOString().split("T")[0]
                : null,
        };

        if (formType === "edit" && transaction) {
            router.put(
                route("transactions.update", transaction.id),
                formattedValues,
            );
        } else {
            router.post(route("transactions.store"), formattedValues);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    {formType === "edit"
                        ? "Edit Transaction"
                        : "Create New Transaction"}
                </h2>
                <p className="text-gray-600 mt-1">
                    {formType === "edit"
                        ? "Update the details of an existing transaction"
                        : "Enter transaction details below"}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white p-6 rounded-lg shadow-sm"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transaction Type */}
                    <div>
                        <label
                            htmlFor="type"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Transaction Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={values.type}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {transactionTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <InputError
                                message={errors.type}
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label
                            htmlFor="amount"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Amount
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                    DH
                                </span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                id="amount"
                                name="amount"
                                value={values.amount}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.amount && (
                            <InputError
                                message={errors.amount}
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={values.description}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Add details about this transaction"
                        ></textarea>
                        {errors.description && (
                            <InputError
                                message={errors.description}
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label
                            htmlFor="payment_date"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Payment Date
                        </label>
                        <DatePicker
                            id="payment_date"
                            name="payment_date"
                            selected={values.payment_date}
                            onChange={(date) =>
                                handleDateChange("payment_date", date)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            dateFormat="yyyy-MM-dd"
                        />
                        {errors.payment_date && (
                            <InputError
                                message={errors.payment_date}
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Is Recurring */}
                    <div>
                        <div className="flex items-center h-full">
                            <input
                                type="checkbox"
                                id="is_recurring"
                                name="is_recurring"
                                checked={values.is_recurring}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="is_recurring"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Recurring Transaction
                            </label>
                        </div>
                        {errors.is_recurring && (
                            <InputError
                                message={errors.is_recurring}
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Conditional Fields for Recurring Transactions */}
                    {values.is_recurring && (
                        <>
                            <div>
                                <label
                                    htmlFor="frequency"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Frequency
                                </label>
                                <select
                                    id="frequency"
                                    name="frequency"
                                    value={values.frequency}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    {frequencyOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.frequency && (
                                    <InputError
                                        message={errors.frequency}
                                        className="mt-2"
                                    />
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="next_payment_date"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Next Payment Date
                                </label>
                                <DatePicker
                                    id="next_payment_date"
                                    name="next_payment_date"
                                    selected={values.next_payment_date}
                                    onChange={(date) =>
                                        handleDateChange(
                                            "next_payment_date",
                                            date,
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date()}
                                />
                                {errors.next_payment_date && (
                                    <InputError
                                        message={errors.next_payment_date}
                                        className="mt-2"
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {formType === "edit"
                            ? "Update Transaction"
                            : "Create Transaction"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewPaymentForm;
