import { FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";
import { format } from "date-fns";
import FormModal from "./FormModal";
import AttendanceModal from "@/Pages/Attendance/AttendanceModal";
import { useState } from "react";
import { Edit } from "lucide-react";
import { router } from '@inertiajs/react';
import WhatsAppButton from './WhatsAppButton';

const AbsenceLogTableForStudent = ({ absences, studentId, studentClassId }) => {
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    // Defensive: ensure absences is always an array
    const safeAbsences = Array.isArray(absences) ? absences : [];
    // Function to format the date
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy");
        } catch (error) {
            return dateString;
        }
    };

    // Enrich absence data with student_id and class_id
    const enrichedAbsences = safeAbsences.map((absence) => ({
        ...absence,
        student_id: studentId,
        class_id: studentClassId,
    }));

    // Function to determine status badge style
    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case "absent":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <FaExclamationTriangle className="mr-1" />
                        Absent(e)
                    </span>
                );
            case "late":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        En retard
                    </span>
                );
            case "present":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Présent(e)
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const handleEditClick = (absence) => {
        setSelectedAbsence(absence);
        setShowUpdateModal(true);
    };

    return (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-200 text-black">
                <h2 className="text-xl font-bold flex items-center">
                    <FaCalendarAlt className="mr-2" /> Journal des absences
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Classe
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Enregistré par
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Motif
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {enrichedAbsences.map((absence) => (
                            <tr
                                key={absence.id}
                                className="hover:bg-gray-50 transition-colors duration-150"
                            >
                                <td className="p-3 text-sm text-gray-900">
                                    {formatDate(absence.date)}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {absence.class_name || absence.class || "-"}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {absence.recorded_by_name || absence.recorded_by || absence.recordedBy || "-"}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {getStatusBadge(absence.status)}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {absence.reason || "---"}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    <WhatsAppButton 
                                        studentId={absence.student_id}
                                        studentName="Élève"
                                        className="text-xs px-3 py-1.5"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty state */}
            {(safeAbsences.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                    Aucun enregistrement d'absence trouvé.
                </div>
            )}
        </div>
    );
};

export default AbsenceLogTableForStudent;