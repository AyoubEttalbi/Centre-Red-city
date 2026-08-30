import React from "react";
import { FaHistory } from "react-icons/fa";
import { GraduationCap, CheckCircle, XCircle, UserPlus, UserMinus } from "lucide-react";

export default function StudentAcademicHistory({ promotionsHistory = [], movements = [], student }) {
    const hasPromotions = promotionsHistory && promotionsHistory.length > 0;
    const hasMovements = movements && movements.length > 0;
    const hasAny = hasPromotions || hasMovements;
    const isUnassigned = student && (student.levelId == null || student.classId == null);

    // Build one merged event array sorted desc — Phase 1 #3
    // promotionsHistory is already sorted school_year desc from controller
    const events = (() => {
        const yearEvents = (promotionsHistory || []).map((p) => ({
            type: "year",
            date: p.updated_at || p.created_at,
            data: p,
        }));
        const moveEvents = (movements || []).map((m) => ({
            type: m.movement_type, // 'inscribed' | 'abandoned'
            date: m.movement_date,
            data: m,
        }));
        const all = [...yearEvents, ...moveEvents];
        all.sort((a, b) => new Date(b.date) - new Date(a.date));
        return all;
    })();

    // For progression connector: need older entry per promotion
    // promotionsHistory is desc, so older = next index
    const progressionFor = (entry, idxInPromotionsHistory) => {
        // idxInPromotionsHistory is index inside promotionsHistory (desc)
        // Oldest (last in array) gets no connector
        const promosDesc = promotionsHistory;
        if (idxInPromotionsHistory === promosDesc.length - 1) return null;
        const older = promosDesc[idxInPromotionsHistory + 1];
        const olderName = older.level_name || "Non affecté";
        const currentName = entry.level_name || "Non affecté";
        return `Niveau ${olderName} → Niveau ${currentName}`;
    };

    // Map school_year to its index in desc array for connector lookup
    const schoolYearIndexMap = {};
    (promotionsHistory || []).forEach((p, i) => {
        schoolYearIndexMap[p.school_year] = i;
    });

    return (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header — same as Résultats / Factures */}
            <div className="p-4 bg-gray-200 text-black">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center">
                        <FaHistory className="mr-2" /> Historique académique
                    </h2>
                    {hasPromotions && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                            {promotionsHistory.length} année{promotionsHistory.length > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            {/* Warning when current assignment missing */}
            {isUnassigned && (
                <div className="p-3 bg-amber-50 border-b border-amber-200">
                    <div className="flex items-start">
                        <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            Niveau/classe actuels non affectés. Veuillez réaffecter l'élève pour la nouvelle année scolaire via « Modifier le profil ».
                        </p>
                    </div>
                </div>
            )}

            {hasAny ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type / Année scolaire
                                </th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Détails
                                </th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Notes / Motif
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {events.map((ev, i) => {
                                if (ev.type === "year") {
                                    const entry = ev.data;
                                    const dateStr = entry.updated_at || entry.created_at;
                                    const formattedDate = dateStr
                                        ? new Date(dateStr).toLocaleDateString("fr-FR", {
                                              day: "2-digit",
                                              month: "long",
                                              year: "numeric",
                                          })
                                        : "—";
                                    // Use year_label when present (Phase2), fallback to computed
                                    const academicLabel = entry.year_label
                                        ? entry.year_label
                                        : `${entry.school_year} – ${entry.school_year + 1}`;
                                    const isPromoted = entry.is_promoted;
                                    const idx = schoolYearIndexMap[entry.school_year];
                                    const progression = progressionFor(entry, idx);

                                    return (
                                        <tr
                                            key={`year-${entry.id}`}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="p-3 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 w-fit">
                                                        {academicLabel}
                                                    </span>
                                                    {/* 1. Promotion decision per year */}
                                                    {isPromoted ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Promu au niveau suivant
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                                            <XCircle className="w-3.5 h-3.5" /> Reste au même niveau
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                            {entry.level_name || <span className="italic text-gray-400">Non affecté</span>}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                            {entry.class_name || <span className="italic text-gray-400">Non affectée</span>}
                                                        </span>
                                                    </div>
                                                    {/* 2. Progression between years */}
                                                    {progression && (
                                                        <span className="text-xs text-gray-500 italic">
                                                            {progression}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{formattedDate}</td>
                                            <td className="p-3 text-sm text-gray-900 max-w-[220px]">
                                                {entry.notes ? (
                                                    <span className="text-gray-700 text-xs bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                                                        {entry.notes}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    // movement: inscribed / abandoned — compact row
                                    const m = ev.data;
                                    const formattedDate = m.movement_date
                                        ? new Date(m.movement_date).toLocaleDateString("fr-FR", {
                                              day: "2-digit",
                                              month: "long",
                                              year: "numeric",
                                          })
                                        : "—";
                                    const isInscribed = ev.type === "inscribed";
                                    return (
                                        <tr
                                            key={`mov-${m.id}`}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="p-3 whitespace-nowrap">
                                                {isInscribed ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                        <UserPlus className="w-3.5 h-3.5" /> Inscription
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                        <UserMinus className="w-3.5 h-3.5" /> Abandon
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-gray-900">
                                                <span className="text-xs text-gray-600">
                                                    {m.reason || (isInscribed ? "Inscription" : "Abandon")}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{formattedDate}</td>
                                            <td className="p-3 text-sm text-gray-500 max-w-[220px] truncate">
                                                {m.notes || <span className="text-gray-400">—</span>}
                                            </td>
                                        </tr>
                                    );
                                }
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    Aucun historique académique enregistré pour cet élève.
                    <br />
                    <span className="text-xs text-gray-400">
                        L'historique apparaîtra ici après la clôture de l'année scolaire (niveau et classe avec date).
                    </span>
                </div>
            )}
        </div>
    );
}
