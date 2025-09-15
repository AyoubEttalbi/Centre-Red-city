import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
    Check,
    X,
    ChevronDown,
    ChevronUp,
    CornerDownRight,
    Info,
    Loader2,
} from "lucide-react";

export default function StudentPromotionManager({
    student,
    promotionStatus,
    isAdmin = false,
    isAssistant = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPromoted, setIsPromoted] = useState(
        promotionStatus?.is_promoted ?? true,
    );
    const [notes, setNotes] = useState(promotionStatus?.notes || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const canEdit = isAdmin || isAssistant;

    // Reset the state when promotion status changes from props
    useEffect(() => {
        setIsPromoted(promotionStatus?.is_promoted ?? true);
        setNotes(promotionStatus?.notes || "");
    }, [promotionStatus]);

    const updatePromotion = () => {
        setIsSaving(true);
        setSaveSuccess(false);

        router.post(
            route("schoolyear.update-promotion"),
            {
                student_id: student.id,
                is_promoted: isPromoted,
                notes: notes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setSaveSuccess(true);

                    // Auto close after showing success message
                    setTimeout(() => {
                        setIsOpen(false);
                        setSaveSuccess(false);
                    }, 1500);
                },
                onError: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    // Color for promotion status badge
    const statusColor = isPromoted
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-red-100 text-red-800 border-red-200";

    return (
        <div className="rounded-md border border-gray-200 mb-2 shadow-sm hover:shadow-md transition-shadow">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                        Promotion Status
                    </span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}
                    >
                        {isPromoted ? "Promoted" : "Not Promoted"}
                    </span>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                    {isOpen ? (
                        <ChevronUp size={18} />
                    ) : (
                        <ChevronDown size={18} />
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="p-3 border-t border-gray-200">
                    {canEdit ? (
                        <>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm font-medium ${
                                            isPromoted
                                                ? "bg-green-100 text-green-800 border border-green-200"
                                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                        } ${isSaving ? "opacity-60 cursor-not-allowed" : "hover:bg-green-50"}`}
                                        onClick={() => setIsPromoted(true)}
                                        disabled={isSaving}
                                    >
                                        <Check size={16} />
                                        Promote
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm font-medium ${
                                            !isPromoted
                                                ? "bg-red-100 text-red-800 border border-red-200"
                                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                        } ${isSaving ? "opacity-60 cursor-not-allowed" : "hover:bg-red-50"}`}
                                        onClick={() => setIsPromoted(false)}
                                        disabled={isSaving}
                                    >
                                        <X size={16} />
                                        Don't Promote
                                    </button>
                                </div>

                                <div>
                                    <label
                                        htmlFor="notes"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        id="notes"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-lamaSky"
                                        placeholder="Add any notes about this promotion decision..."
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 flex gap-2 text-xs text-blue-800">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <Info size={14} />
                                    </div>
                                    <p>
                                        This will determine whether the student
                                        is promoted to the next grade level
                                        during year-end transitions.
                                        {!isPromoted &&
                                            " Not promoting a student will keep them at their current level."}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setIsOpen(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                                            saveSuccess
                                                ? "bg-green-100 text-green-800 border border-green-200"
                                                : "bg-lamaSky text-white"
                                        } 
                      disabled:opacity-70 min-w-[80px] justify-center`}
                                        onClick={updatePromotion}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                                Saving...
                                            </>
                                        ) : saveSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Saved!
                                            </>
                                        ) : (
                                            "Save"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Read-only view for users who can't edit
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <CornerDownRight
                                    size={16}
                                    className="text-gray-500"
                                />
                                <span className="text-sm text-gray-700">
                                    Status:{" "}
                                    <span
                                        className={`font-medium ${isPromoted ? "text-green-700" : "text-red-700"}`}
                                    >
                                        {isPromoted
                                            ? "Will be promoted"
                                            : "Won't be promoted"}
                                    </span>
                                </span>
                            </div>

                            {notes && (
                                <div className="ml-6 text-sm text-gray-600">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {notes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
