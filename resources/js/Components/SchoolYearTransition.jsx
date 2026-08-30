import React, { useState } from "react";
import {
    ArrowRightCircle,
    CalendarPlus,
    ChevronRight,
    Info,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import Alert from "@/Components/PaymentsAndTransactions/Alert";

function SchoolYearTransition() {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmStep, setConfirmStep] = useState(1);
    const [confirmText, setConfirmText] = useState("");
    const [errors, setErrors] = useState(null);

    const handleTransition = () => {
        if (confirmText !== "CONFIRM") {
            setErrors("Veuillez taper CONFIRM pour continuer la transition.");
            return;
        }

        setIsProcessing(true);

        // Call to backend API to process the school year transition
        router.post(
            route("schoolyear.transition"),
            {},
            {
                preserveScroll: true,
                onSuccess: (response) => {
                    setIsProcessing(false);
                    setShowModal(false);
                    setConfirmStep(1);
                    setConfirmText("");
                },
                onError: (errors) => {
                    setIsProcessing(false);
                    setErrors(errors);
                },
            },
        );
    };

    const steps = [
        "Retirer niveau et classe de tous les élèves actifs pour réaffectation manuelle l'année prochaine (snapshot niveau/classe + date historisé dans student_promotions)",
        "Supprimer toutes les affectations classes des enseignants (table classes_teacher, rollback-safe) et réinitialiser le compteur classes.number_of_teachers — matières conservées",
        "Archiver tous les abonnements actifs (is_active=false, end_date=aujourd'hui, soft delete) — gardés pour l'historique",
        "Désactiver les paiements enseignants actifs (teacher_membership_payments.is_active=false) pour isoler les stats de la nouvelle année",
        "Passer élèves, enseignants et assistants actifs en inactif (réactivation manuelle requise)",
        "Créer un enregistrement SchoolYear de l'année clôturée avec statistiques détaillées",
    ];

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 md:mt-4">
            {/* Message flash de la transition (succès / erreur) */}
            {flash?.message && (
                <div className="mb-4">
                    <Alert type="success" message={flash.message} />
                </div>
            )}
            {flash?.error && (
                <div className="mb-4">
                    <Alert type="error" message={flash.error} />
                </div>
            )}
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="font-semibold text-2xl">
                        Gestion de l'année scolaire
                    </h1>
                </div>
            </div>

            <div className="bg-gradient-to-r from-lamaSky/10 to-lamaPurple/10 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-medium text-gray-800">
                            Clôturer l'année scolaire en cours
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Réinitialisez niveau et classe des élèves actifs,
                            supprimez les affectations enseignants et archivez les
                            abonnements pour démarrer la nouvelle année. Toutes
                            les données restent en base pour l'historique
                            (promotions enregistrées par année).
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-lamaSky/90 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <CalendarPlus className="w-5 h-5" />
                        Démarrer une nouvelle année scolaire
                    </button>
                </div>
            </div>

            {/* Modal de confirmation */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-lamaSky to-lamaPurple p-4">
                            <h3 className="text-white font-medium text-lg">
                                Transition d'année scolaire
                            </h3>
                        </div>

                        <div className="p-6">
                            {confirmStep === 1 ? (
                                <>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="text-amber-500 mt-1">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-1">
                                                Important : Cette action est
                                                irréversible
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                Démarrer une nouvelle année scolaire
                                                entraînera les changements suivants
                                                :
                                            </p>
                                            <ul className="mt-3 space-y-2">
                                                {steps.map((step, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center gap-2 text-sm text-gray-700"
                                                    >
                                                        <ChevronRight className="w-4 h-4 text-lamaSky" />
                                                        {step}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note :</strong> Toutes les données
                                            historiques seront conservées dans la
                                            base. Ce processus ne supprimera que
                                            les associations des profils actifs
                                            tout en gardant l'accès aux anciens
                                            dossiers.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                        <h4 className="font-medium text-red-800 mb-1">
                                            Confirmation finale requise
                                        </h4>
                                        <p className="text-sm text-red-700">
                                            Vous êtes sur le point de démarrer une
                                            nouvelle année scolaire. Cela retirera
                                            niveau et classe de tous les élèves
                                            actifs (réaffectation manuelle ensuite),
                                            supprimera les affectations enseignants,
                                            archivera les abonnements et désactivera
                                            les paiements enseignants. Les données
                                            resteront en base pour l'historique,
                                            mais les associations actives seront
                                            supprimées.
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Tapez <strong>CONFIRM</strong> ci-dessous pour
                                        continuer :
                                    </p>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) =>
                                            setConfirmText(e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                        placeholder="Tapez CONFIRM ici"
                                    />
                                </>
                            )}

                            {errors && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    {typeof errors === "string"
                                        ? errors
                                        : "Une erreur est survenue lors du processus de transition."}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setConfirmStep(1);
                                        setConfirmText("");
                                        setErrors(null);
                                    }}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 text-sm hover:bg-gray-50"
                                    disabled={isProcessing}
                                >
                                    Annuler
                                </button>
                                {confirmStep === 1 ? (
                                    <button
                                        onClick={() => setConfirmStep(2)}
                                        className="px-3 py-1.5 bg-lamaSky text-white rounded text-sm hover:bg-lamaSky/90 flex items-center gap-1"
                                    >
                                        Étape suivante
                                        <ArrowRightCircle className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleTransition}
                                        disabled={
                                            isProcessing ||
                                            confirmText !== "CONFIRM"
                                        }
                                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1 disabled:opacity-70"
                                    >
                                        {isProcessing
                                            ? "Traitement..."
                                            : "Confirmer la transition"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SchoolYearTransition;
