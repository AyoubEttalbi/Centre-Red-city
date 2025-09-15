import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { Check, X, Save, AlertCircle } from "lucide-react";

export default function StudentPromotionSetup({
    students,
    className,
    levels,
    promotionData,
    isOpen,
    onClose,
}) {
    const [promotionStatuses, setPromotionStatuses] = useState({});
    const [promotionNotes, setPromotionNotes] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize promotion statuses when component mounts or when promotionData changes
    useEffect(() => {
        if (isOpen) {
            const initialStatuses = {};
            const initialNotes = {};

            students.forEach((student) => {
                // Use existing promotion data if available, otherwise default to promoted
                const existingPromotion = promotionData?.find(
                    (p) => p.student_id === student.id,
                );
                initialStatuses[student.id] = existingPromotion
                    ? existingPromotion.is_promoted
                    : true;
                initialNotes[student.id] = existingPromotion
                    ? existingPromotion.notes || ""
                    : "";
            });

            setPromotionStatuses(initialStatuses);
            setPromotionNotes(initialNotes);
        }
    }, [isOpen, promotionData, students]);

    const handlePromotionChange = (studentId, isPromoted) => {
        setPromotionStatuses((prev) => ({
            ...prev,
            [studentId]: isPromoted,
        }));
    };

    const handleNotesChange = (studentId, notes) => {
        setPromotionNotes((prev) => ({
            ...prev,
            [studentId]: notes,
        }));
    };

    const savePromotions = () => {
        setIsSaving(true);

        // Format the promotion data for submission
        const promotionsData = students.map((student) => ({
            student_id: student.id,
            is_promoted: promotionStatuses[student.id] || false,
            notes: promotionNotes[student.id] || "",
        }));

        // Make the API call to save all promotions at once
        router.post(
            "/schoolyear/setup-promotions",
            { promotions: promotionsData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    onClose(true); // Pass true to indicate success
                },
                onError: (errors) => {
                    console.error("Save promotions failed:", errors);
                    setIsSaving(false);
                },
            },
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-lamaSky to-lamaPurple p-4 rounded-t-lg">
                    <h3 className="text-white font-medium text-lg">
                        Student Promotion Setup
                    </h3>
                </div>

                <div className="p-4 overflow-y-auto flex-grow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                            <h4 className="font-medium text-gray-800 mb-1">
                                Setup Promotions for {className}
                            </h4>
                            <p className="text-sm text-gray-600">
                                Specify which students should be promoted to the
                                next grade level.
                            </p>
                        </div>
                        <div className="mt-2 sm:mt-0 bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full border border-blue-200">
                            {students.length} Students
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <AlertCircle
                                size={16}
                                className="flex-shrink-0 mt-0.5"
                            />
                            <span>
                                All students are marked as promoted by default.
                                Change the status for students who should not
                                advance to the next grade level.
                            </span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Student
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Current Level
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Promotion Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full"
                                                        src="/studentProfile.png"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.firstName}{" "}
                                                        {student.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {student.massarCode}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {levels.find(
                                                    (level) =>
                                                        level.id ===
                                                        student.levelId,
                                                )?.name || "Unknown Level"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePromotionChange(
                                                            student.id,
                                                            true,
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm font-medium ${
                                                        promotionStatuses[
                                                            student.id
                                                        ]
                                                            ? "bg-green-100 text-green-800 border border-green-200"
                                                            : "bg-gray-100 text-gray-700 border border-gray-200"
                                                    }`}
                                                >
                                                    <Check size={16} />
                                                    Promote
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePromotionChange(
                                                            student.id,
                                                            false,
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm font-medium ${
                                                        !promotionStatuses[
                                                            student.id
                                                        ]
                                                            ? "bg-red-100 text-red-800 border border-red-200"
                                                            : "bg-gray-100 text-gray-700 border border-gray-200"
                                                    }`}
                                                >
                                                    <X size={16} />
                                                    Don't Promote
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                placeholder="Optional notes"
                                                value={
                                                    promotionNotes[
                                                        student.id
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    handleNotesChange(
                                                        student.id,
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-lamaSky"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={() => onClose(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={savePromotions}
                        className="px-4 py-2 bg-lamaSky text-white rounded-md text-sm font-medium hover:bg-lamaSky/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaSky disabled:opacity-70 flex items-center gap-1"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Save size={16} />
                                Save All Promotions
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
