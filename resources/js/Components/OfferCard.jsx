import { useState } from "react";
import {
    Check,
    X,
    Edit2,
    Trash2,
    Plus,
    Book,
    Percent,
    ChevronDown,
    MinusCircle,
    PlusCircle,
    Pencil,
    DollarSign,
    ChevronUp,
} from "lucide-react";
import { usePage } from "@inertiajs/react";
import FormModal from "./FormModal";
import DeleteConfirmation from "./DeleteConfirmation";

const OfferCard = ({
    offer,
    isEditMode,
    toggleEditMode,
    currentEditData,
    handleInputChange,
    handleSaveChanges,
    toggleDropdown,
    dropdownStates,
    handleAddSubject,
    handleRemoveSubject,
    handlePercentageChange,
    incrementPercentage,
    decrementPercentage,
    availableSubjects,
    getSubjectName,
    levels,
    subjects,
}) => {
    const role = usePage().props.auth.user.role;
    const [openDeleteModal, setOpenDeleteModal] = useState(false);

    return (
        <div
            className={`relative p-8 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden ${isEditMode ? "ring-2 ring-lamaPurple ring-opacity-50" : ""}`}
        >
            {/* Action Buttons */}
            {openDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <DeleteConfirmation
                        route="offers"
                        id={offer.id}
                        onDelete={() => {
                            console.log("Delete confirmed");
                            setOpenDeleteModal(false); // Close the modal after deletion
                        }}
                        onClose={() => setOpenDeleteModal(false)} // Pass onClose to close the modal
                    />
                </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                {isEditMode ? (
                    <>
                        <button
                            onClick={() => handleSaveChanges(offer.id)}
                            className="p-2 bg-lamaPurpleLight rounded-full shadow-md hover:bg-lamaPurple transition-colors"
                        >
                            <Check className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={() => toggleEditMode(offer.id)}
                            className="p-2 bg-red-50 rounded-full shadow-md hover:bg-red-100 transition-colors"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => toggleEditMode(offer.id)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-lamaPurpleLight transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={() => setOpenDeleteModal(true)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </>
                )}
            </div>

            {/* Price Tag */}
            <div
                className={`absolute -top-1 -left-1 bg-lamaYellow px-4 py-1.5 rounded-br-xl rounded-tl-md text-gray-800 flex items-center gap-1 shadow-md ${isEditMode ? "bg-opacity-90" : ""}`}
            >
                {/* <DollarSign className="w-4 h-4" /> */}
                {isEditMode ? (
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={currentEditData.price}
                            onChange={(e) =>
                                handleInputChange(
                                    offer.id,
                                    "price",
                                    e.target.value,
                                )
                            }
                            className="w-16 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 font-bold p-0"
                        />
                        <div className="flex flex-col ml-1">
                            <button
                                onClick={() =>
                                    handleInputChange(
                                        offer.id,
                                        "price",
                                        Number.parseFloat(
                                            currentEditData.price,
                                        ) + 1,
                                    )
                                }
                                className="text-gray-700 hover:text-gray-900"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() =>
                                    handleInputChange(
                                        offer.id,
                                        "price",
                                        Math.max(
                                            0,
                                            Number.parseFloat(
                                                currentEditData.price,
                                            ) - 1,
                                        ),
                                    )
                                }
                                className="text-gray-700 hover:text-gray-900"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <span className="font-bold">{offer.price} DH</span>
                )}
            </div>

            {/* Offer Header */}
            <div className="mt-8 mb-6 relative z-10">
                {isEditMode ? (
                    <div className="relative group/edit">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={currentEditData.offer_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        offer.id,
                                        "offer_name",
                                        e.target.value,
                                    )
                                }
                                className="text-2xl font-bold text-gray-800 bg-transparent focus:outline-none focus:ring-0 w-full pb-1 border-b border rounded-lg border-gray-300 focus:border-lamaPurple "
                            />
                            <Pencil className="ml-2 w-4 h-4 text-black opacity-70" />
                        </div>
                    </div>
                ) : (
                    <h3 className="text-2xl font-bold text-gray-800">
                        {offer.offer_name}
                    </h3>
                )}
            </div>

            {/* Subjects */}
            <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Book className="w-5 h-5 text-lamaPurple" />
                    <p className="font-medium text-base">Subjects</p>
                    {isEditMode && (
                        <button
                            onClick={() => toggleDropdown(offer.id)}
                            className="p-1 rounded-full hover:bg-lamaPurpleLight transition-colors"
                        >
                            <Plus className="w-4 h-4 text-gray-700" />
                        </button>
                    )}
                </div>

                {isEditMode && dropdownStates[offer.id] && (
                    <div className="relative mb-3">
                        <div className="relative">
                            <select
                                onChange={(e) =>
                                    handleAddSubject(offer.id, e.target.value)
                                }
                                className="w-full px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-lamaPurple border border-gray-200"
                            >
                                <option value="">Select subject</option>
                                {availableSubjects.map((subj) => (
                                    <option
                                        key={
                                            typeof subj === "object"
                                                ? subj.id
                                                : subj
                                        }
                                        value={
                                            typeof subj === "object"
                                                ? subj.name
                                                : subj
                                        }
                                    >
                                        {typeof subj === "object"
                                            ? subj.name
                                            : subj}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {currentEditData.subjects?.map((subject, idx) => (
                        <span
                            key={idx}
                            className="px-4 py-1.5 bg-lamaPurpleLight rounded-full text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                            {getSubjectName(subject)}
                            {isEditMode && (
                                <button
                                    onClick={() =>
                                        handleRemoveSubject(offer.id, idx)
                                    }
                                    className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* Percentage Breakdown */}
            <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Percent className="w-5 h-5 text-lamaPurple" />
                    <p className="font-medium text-base">Répartition</p>
                </div>

                {Object.entries(
                    isEditMode ? currentEditData.percentage : offer.percentage,
                ).map(([subject, percent], index) => (
                    <div
                        key={subject}
                        className="flex justify-between items-center text-gray-700 py-2.5 px-4 rounded-lg bg-lamaPurpleLight"
                    >
                        <span className="text-base font-medium">
                            {getSubjectName(subject)}
                        </span>
                        {isEditMode ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() =>
                                        decrementPercentage(offer.id, subject)
                                    }
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <MinusCircle className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    value={percent}
                                    onChange={(e) =>
                                        handlePercentageChange(
                                            offer.id,
                                            subject,
                                            e.target.value,
                                        )
                                    }
                                    className="w-12 bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base font-bold text-gray-800"
                                />
                                <span className="text-base font-bold text-gray-800">
                                    %
                                </span>
                                <button
                                    onClick={() =>
                                        incrementPercentage(offer.id, subject)
                                    }
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <span className="text-base font-bold text-gray-800">
                                {percent}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OfferCard;
