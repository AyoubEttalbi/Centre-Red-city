import React from "react";
import {
    GraduationCap,
    AlertCircle,
    ArrowUpRight,
    Check,
    X,
    HelpCircle,
} from "lucide-react";

export default function PromotionGuide({
    onSetupClick,
    showPromotionTools = false,
}) {
    return (
        <div className="mb-4">
            {!showPromotionTools ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <AlertCircle size={18} />
                    </div>
                    <div>
                        <h3 className="text-blue-800 font-medium text-sm">
                            Préparer la promotion de fin d'année
                        </h3>
                        <p className="text-blue-700 text-sm mt-1">
                            Vous pouvez gérer quels élèves doivent être promus au
                            niveau supérieur à la fin de l'année scolaire.
                        </p>
                        <button
                            onClick={onSetupClick}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                            <GraduationCap size={16} />
                            Configurer la promotion des élèves
                        </button>

                        <details className="mt-3 text-sm text-blue-700">
                            <summary className="cursor-pointer flex items-center gap-1">
                                <HelpCircle size={14} />
                                <span>
                                    Comment fonctionne le processus de promotion ?
                                </span>
                            </summary>
                            <div className="mt-2 pl-2 border-l-2 border-blue-200">
                                <ol className="list-decimal pl-5 space-y-1">
                                    <li>
                                        Cliquez sur le bouton ci-dessus pour
                                        configurer la promotion de tous les élèves
                                        de cette classe
                                    </li>
                                    <li>
                                        Définissez le statut de promotion pour
                                        chaque élève (promu ou non promu)
                                    </li>
                                    <li>
                                        Ajoutez des notes optionnelles pour toute
                                        circonstance particulière
                                    </li>
                                    <li>
                                        Après l'enregistrement, vous pouvez
                                        toujours modifier le statut de promotion
                                        de chaque élève individuellement
                                    </li>
                                    <li>
                                        À la fin de l'année scolaire, ces
                                        paramètres détermineront quels élèves
                                        passeront au niveau supérieur
                                    </li>
                                </ol>
                            </div>
                        </details>
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <h3 className="text-green-800 font-medium text-sm flex items-center gap-1">
                        <GraduationCap size={16} />
                        Gestion de la promotion des élèves
                    </h3>
                    <p className="text-green-700 text-sm mt-1">
                        Cliquez sur la section "Statut de promotion" d'un élève
                        pour modifier son statut de promotion.
                    </p>

                    <div className="mt-3 flex flex-col gap-2 text-sm">
                        <div className="flex items-start gap-2">
                            <div className="flex h-5 items-center">
                                <Check size={16} className="text-green-600" />
                            </div>
                            <p className="text-green-700">
                                <span className="font-medium">Élèves promus</span>{" "}
                                passeront au niveau supérieur à la fin de l'année
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="flex h-5 items-center">
                                <X size={16} className="text-red-600" />
                            </div>
                            <p className="text-red-700">
                                <span className="font-medium">Élèves non promus</span>{" "}
                                resteront à leur niveau actuel
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="flex h-5 items-center">
                                <ArrowUpRight size={16} className="text-blue-600" />
                            </div>
                            <p className="text-blue-700">
                                <span className="font-medium">Notes</span> peuvent
                                être ajoutées pour expliquer les décisions de
                                promotion
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
