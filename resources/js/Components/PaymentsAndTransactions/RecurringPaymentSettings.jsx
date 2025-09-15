import React, { useEffect } from "react";
import InputError from "@/Components/InputError";
import Checkbox from "@/Components/Checkbox";
import DatePicker from "react-datepicker";

const RecurringPaymentSettings = ({
    values,
    errors,
    handleChange,
    handleDateChange,
}) => {
    const frequencyOptions = [
        { value: "monthly", label: "Mensuel" },
        { value: "quarterly", label: "Trimestriel" },
        { value: "termly", label: "Par trimestre scolaire" },
        { value: "semester", label: "Semestriel" },
        { value: "biannually", label: "Semestriel" },
        { value: "annually", label: "Annuel" },
    ];

    useEffect(() => {
        if (values.is_recurring && !values.next_payment_date) {
            const date = new Date(values.payment_date);

            switch (values.frequency) {
                case "monthly":
                    date.setMonth(date.getMonth() + 1);
                    break;
                case "quarterly":
                    date.setMonth(date.getMonth() + 3);
                    break;
                case "termly":
                    date.setMonth(date.getMonth() + 4);
                    break;
                case "semester":
                    date.setMonth(date.getMonth() + 6);
                    break;
                case "biannually":
                    date.setMonth(date.getMonth() + 6);
                    break;
                case "annually":
                    date.setFullYear(date.getFullYear() + 1);
                    break;
                default:
                    date.setMonth(date.getMonth() + 1);
            }

            handleDateChange("next_payment_date", date);
        }
    }, [values.is_recurring, values.frequency, values.payment_date]);

    return (
        <div>
            <div className="md:col-span-2">
                <div className="flex items-center">
                    <Checkbox
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
                        Il s'agit d'un paiement récurrent
                    </label>
                </div>
                {errors.is_recurring && (
                    <InputError
                        message={errors.is_recurring}
                        className="mt-2"
                    />
                )}
            </div>

            {values.is_recurring && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <label
                            htmlFor="frequency"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Fréquence
                        </label>
                        <select
                            id="frequency"
                            name="frequency"
                            value={values.frequency}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required={values.is_recurring}
                        >
                            {frequencyOptions.map((option) => (
                                <option key={option.value} value={option.value}>
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
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Date du prochain paiement
                        </label>
                        <DatePicker
                            id="next_payment_date"
                            name="next_payment_date"
                            selected={values.next_payment_date}
                            onChange={(date) =>
                                handleDateChange("next_payment_date", date)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            dateFormat="yyyy-MM-dd"
                            minDate={new Date()}
                            required={values.is_recurring}
                        />
                        {errors.next_payment_date && (
                            <InputError
                                message={errors.next_payment_date}
                                className="mt-2"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringPaymentSettings;
