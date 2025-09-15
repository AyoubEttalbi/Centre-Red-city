import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

const AttendanceModal = ({
    table,
    type,
    id,
    data,
    classes,
    students,
    onClose,
}) => {
    const { errors, filters } = usePage().props;

    const [formData, setFormData] = useState({
        student_id: data?.student_id || "",
        status: data?.status || "present",
        reason: data?.reason || "",
        date: data?.date || new Date().toISOString().split("T")[0],
        class_id: data?.classId || "",
        teacher_id: data?.teacher_id || filters?.teacher_id || "",
        subject: data?.subject || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // For virtual records (exists_in_db === false)
        if (data?.exists_in_db === false) {
            if (formData.status !== "present") {
                router.post(
                    route("attendances.store"),
                    {
                        date: formData.date,
                        class_id: data.classId,
                        teacher_id: formData.teacher_id,
                        subject: formData.subject,
                        attendances: [
                            {
                                student_id: data.student_id,
                                status: formData.status,
                                reason: formData.reason,
                                teacher_id: formData.teacher_id,
                                subject: formData.subject,
                            },
                        ],
                    },
                    {
                        onSuccess: () => {
                            onClose();
                            window.location.href = route("attendances.index", {
                                ...filters,
                                date: formData.date,
                                _timestamp: new Date().getTime(),
                            });
                        },
                        preserveScroll: true,
                    },
                );
            } else {
                onClose();
            }
        } else {
            // Handle existing records
            if (type === "create") {
                router.post(
                    route(`${table}.store`),
                    {
                        attendances: [{
                            ...formData,
                            teacher_id: formData.teacher_id,
                            subject: formData.subject,
                        }],
                        date: formData.date,
                        class_id: formData.class_id,
                        teacher_id: formData.teacher_id,
                        subject: formData.subject,
                    },
                    {
                        onSuccess: () => {
                            onClose();
                            window.location.href = route("attendances.index", {
                                ...filters,
                                date: formData.date,
                                _timestamp: new Date().getTime(),
                            });
                        },
                    },
                );
            } else {
                router.put(
                    route(`${table}.update`, id),
                    {
                        ...formData,
                        teacher_id: formData.teacher_id,
                        subject: formData.subject,
                    },
                    {
                        onSuccess: () => {
                            onClose();
                            window.location.href = route("attendances.index", {
                                ...filters,
                                date: formData.date,
                                _timestamp: new Date().getTime(),
                            });
                        },
                    },
                );
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">
                    {type === "create" ? "Create" : "Update"} Attendance Record
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    date: e.target.value,
                                })
                            }
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>

                    {/* Student Selection (Only for create mode) */}
                    {type === "create" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Student
                            </label>
                            <select
                                value={formData.student_id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        student_id: e.target.value,
                                    })
                                }
                                className="w-full p-2 border rounded-md"
                                required
                            >
                                <option value="">Select a student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.firstName} {student.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Display student name for update mode */}
                    {type === "update" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Student
                            </label>
                            <div className="w-full p-2 border rounded-md bg-gray-50">
                                {data.firstName} {data.lastName}
                            </div>
                        </div>
                    )}

                    {/* Status Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value,
                                })
                            }
                            className={`w-full p-2 border rounded-md ${
                                data.exists_in_db
                                    ? "border-indigo-300 bg-indigo-50"
                                    : ""
                            }`}
                            required
                        >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>

                    {/* Reason Input (Only for absent/late status) */}
                    {formData.status !== "present" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Reason
                            </label>
                            <input
                                type="text"
                                placeholder="Reason for absence"
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        reason: e.target.value,
                                    })
                                }
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    )}

                    {/* Error Display */}
                    {errors.attendances && (
                        <div className="text-red-500 text-sm">
                            {errors.attendances}
                        </div>
                    )}

                    {/* Submit and Cancel Buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            {type === "create" ? "Create" : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendanceModal;
