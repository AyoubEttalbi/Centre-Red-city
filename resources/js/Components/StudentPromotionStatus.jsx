import React from "react";
import {
    GraduationCap,
    CheckCircle,
    XCircle,
    MessageCircle,
} from "lucide-react";

export default function StudentPromotionStatus({ promotionStatus }) {
    if (!promotionStatus) {
        return (
            <div className="border border-gray-200 rounded-md p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="text-blue-500" size={20} />
                    <h3 className="font-medium text-gray-700">
                        Statut de promotion
                    </h3>
                </div>
                <div className="bg-blue-50 rounded-md p-3 text-sm text-blue-700">
                    Le statut de promotion n'a pas encore été défini pour cet
                    élève.
                </div>
            </div>
        );
    }

    const isPromoted = promotionStatus.is_promoted;
    const notes = promotionStatus.notes;

    return (
        <div className="border border-gray-200 rounded-md p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="text-blue-500" size={20} />
                <h3 className="font-medium text-gray-700">
                    Statut de promotion
                </h3>
            </div>

            <div
                className={`p-3 rounded-md ${isPromoted ? "bg-green-50" : "bg-red-50"}`}
            >
                <div className="flex items-center gap-2">
                    {isPromoted ? (
                        <>
                            <CheckCircle size={20} className="text-green-600" />
                            <span className="font-medium text-green-800">
                                Sera promu au niveau supérieur
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircle size={20} className="text-red-600" />
                            <span className="font-medium text-red-800">
                                Restera au niveau actuel
                            </span>
                        </>
                    )}
                </div>

                {notes && (
                    <div className="mt-3 border-t border-gray-200 pt-3 flex gap-2 text-gray-700">
                        <MessageCircle
                            size={18}
                            className="text-gray-500 flex-shrink-0 mt-1"
                        />
                        <div className="text-sm">
                            <div className="font-medium mb-1">
                                Notes de l'enseignant :
                            </div>
                            <p>{notes}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
                Dernière mise à jour :{" "}
                {new Date(promotionStatus.updated_at).toLocaleString("fr-FR")}
            </div>
        </div>
    );
}
