import React, { useState, Suspense } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Printer,
    Users,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/Layouts/DashboardLayout";

// Add WhatsApp SVG icon
const WhatsAppIcon = () => (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="16" fill="#25D366"/>
        <path d="M21.6 10.4c-1.2-1.2-2.8-1.9-4.6-1.9-3.6 0-6.5 2.9-6.5 6.5 0 1.1.3 2.1.8 3l-1 3.7 3.8-1c.8.4 1.7.6 2.7.6 3.6 0 6.5-2.9 6.5-6.5 0-1.7-.7-3.3-1.9-4.4zm-4.6 10.2c-.8 0-1.6-.2-2.3-.5l-.2-.1-2.2.6.6-2.1-.1-.2c-.5-.7-.8-1.6-.8-2.5 0-2.7 2.2-4.9 4.9-4.9 1.3 0 2.5.5 3.4 1.4.9.9 1.4 2.1 1.4 3.4 0 2.7-2.2 4.9-4.9 4.9zm2.7-3.7c-.1-.1-.5-.2-1-.4-.2-.1-.4-.1-.5.1-.1.1-.2.3-.3.4-.1.1-.2.1-.4.1-.2 0-.7-.2-1.3-.7-.5-.4-.8-.9-.9-1.1-.1-.2 0-.3.1-.4.1-.1.2-.2.2-.3.1-.1.1-.2.2-.3.1-.1.1-.2 0-.4-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.4c-.1 0-.3 0-.5.2-.2.2-.6.6-.6 1.4 0 .8.6 1.6.9 1.9.1.1 1.7 2.6 4.1 3.4.6.2 1 .3 1.3.2.4-.1 1.2-.5 1.3-1 .1-.5.1-.9.1-1z" fill="#fff"/>
    </svg>
);

const Announcements = React.lazy(
    () => import("@/Pages/Menu/Announcements/Announcements"),
);
const Performance = React.lazy(() => import("@/Components/Performance"));
const MembershipCard = React.lazy(() => import("@/Components/MembershipCard"));
const StudentProfile = React.lazy(() => import("@/Components/StudentProfile"));
const StudentPromotionStatus = React.lazy(
    () => import("@/Components/StudentPromotionStatus"),
);
const FormModal = React.lazy(() => import("@/Components/FormModal"));

const SingleStudentPage = ({
    student,
    Alllevels,
    Allclasses,
    Allschools,
    Alloffers,
    Allteachers,
    memberships,
}) => {
    const role = usePage().props.auth.user.role;
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [showDeletedMemberships, setShowDeletedMemberships] = useState(false);

    return (
        <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
            {/* GAUCHE */}
            <div className="w-full xl:w-2/3">
                {/* HAUT */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* CARTE INFO UTILISATEUR */}
                    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
                        <div className="w-1/3">
                            <img
                                src={
                                    student.profile_image
                                        ? student.profile_image
                                        : "/studentProfile.png"
                                }
                                alt={student.name}
                                width={144}
                                height={144}
                                className="w-36 h-36 rounded-full object-cover"
                            />
                        </div>
                        <div className="w-2/3 flex flex-col justify-between gap-4">
                            {/* Ligne des boutons d'action */}
                            <div className="flex justify-end items-center gap-3">
                                {/* Bouton Imprimer/PDF */}
                                <a
                                    href={route("students.downloadPdf", {
                                        student: student.id,
                                    })}
                                    className="inline-flex items-center gap-2   text-black rounded-lg shadow-sm  hover:shadow-md transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    title="Télécharger le profil de l'élève en PDF"
                                >
                                    <Printer className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                                </a>

                                {/* WhatsApp Button */}
                                {(() => {
                                    const rawNumber = student.guardianNumber || student.phoneNumber;
                                    const waNumber = rawNumber ? rawNumber.replace(/\D/g, "") : "";
                                    // Prefer WhatsApp Web for desktop
                                    const waLink = waNumber ? `https://web.whatsapp.com/send?phone=${waNumber}` : null;
                                    return waLink ? (
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Contacter le tuteur sur WhatsApp"
                                            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-green-600 transition-colors"
                                        >
                                            <WhatsAppIcon />
                                        </a>
                                    ) : null;
                                })()}

                                {/* Bouton Modifier (admin/assistant uniquement) */}
                                {(role === "admin" || role === "assistant") && (
                                    <div className="relative">
                                        <Suspense
                                            fallback={
                                                <span>Chargement...</span>
                                            }
                                        >
                                            <FormModal
                                                table="student"
                                                type="update"
                                                icon={"updateIcon2"}
                                                data={student}
                                                id={student.id}
                                                levels={Alllevels}
                                                classes={Allclasses}
                                                schools={Allschools}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
                                                buttonContent={
                                                    <>
                                                        <svg
                                                            className="w-4 h-4 group-hover:scale-110 transition-transform duration-150"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                        <span className="hidden sm:inline">
                                                            Modifier le profil
                                                        </span>
                                                        <span className="sm:hidden">
                                                            Modifier
                                                        </span>
                                                    </>
                                                }
                                                title="Modifier les informations de l'élève"
                                            />
                                        </Suspense>
                                    </div>
                                )}
                            </div>
                            {/* Nom de l'élève et statut */}
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-semibold">
                                    {student.firstName} {student.lastName}
                                </h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        student.status === "inactive"
                                            ? "bg-red-100 text-red-800 border border-red-200"
                                            : "bg-green-100 text-green-800 border border-green-200"
                                    }`}
                                >
                                    {student.status === "inactive"
                                        ? "Inactif"
                                        : "Actif"}
                                </span>
                            </div>
                            {/* Bio */}
                            <p className="text-sm text-gray-500">
                                {student.bio || "Aucune biographie disponible."}
                            </p>
                            {/* Détails de l'élève */}
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <img
                                        src="/school.png"
                                        alt="École"
                                        width={14}
                                        height={14}
                                    />
                                    <span>
                                        {Allschools.find(
                                            (school) =>
                                                school.id === student.schoolId,
                                        )?.name || ""}
                                    </span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <img
                                        src="/date.png"
                                        alt="Date"
                                        width={14}
                                        height={14}
                                    />
                                    <span>
                                        {student.created_at
                                            ? new Intl.DateTimeFormat("fr-FR", {
                                                  day: "2-digit",
                                                  month: "long",
                                                  year: "numeric",
                                              }).format(
                                                  new Date(student.created_at),
                                              )
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <img
                                        src="/mail.png"
                                        alt="E-mail"
                                        width={14}
                                        height={14}
                                    />
                                    <span>
                                        {student.email ||
                                            "N/A"}
                                    </span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <img
                                        src="/phone.png"
                                        alt="Téléphone"
                                        width={14}
                                        height={14}
                                    />
                                    <span>
                                        {student.guardianNumber || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* PETITES CARTES */}
                    <div className="flex-1 flex gap-4 justify-between flex-wrap">
                        {/* CARTE */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <img
                                src="/singleAttendance.png"
                                alt="Présence"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <div className="">
                                <h1 className="text-xl font-semibold">
                                    {student.attendance || "99%"}
                                </h1>
                                <span className="text-sm text-gray-400">
                                    Présence
                                </span>
                            </div>
                        </div>
                        {/* CARTE */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <img
                                src="/singleBranch.png"
                                alt="Niveau"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <div className="">
                                <h1 className="text-xl font-semibold">
                                    {Alllevels.find(
                                        (level) => level.id === student.levelId,
                                    )?.name || ""}
                                </h1>
                                <span className="text-sm text-gray-400">
                                    Niveau
                                </span>
                            </div>
                        </div>
                        {/* CARTE Statut */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6 text-lamaSky"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 00-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <polyline points="16 11 18 13 22 9"></polyline>
                            </svg>
                            <div className="">
                                <div className="text-xl font-semibold">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            student.status === "inactive"
                                                ? "bg-red-100 text-red-800 border border-red-200"
                                                : "bg-green-100 text-green-800 border border-green-200"
                                        }`}
                                    >
                                        {student.status === "inactive"
                                            ? "Inactif"
                                            : "Actif"}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-400">
                                    Statut
                                </span>
                            </div>
                        </div>
                        {/* CARTE - Offres */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <img
                                src="/singleLesson.png"
                                alt="Offre"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <div className="">
                                <h1 className="text-xl font-semibold">
                                    {student.memberships.length || "0"}
                                </h1>
                                <span className="text-sm text-gray-400">
                                    Offres
                                </span>
                            </div>
                        </div>
                        {/* CARTE - Classe */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <img
                                src="/singleClass.png"
                                alt="Classe"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <div className="">
                                <h1 className="text-xl font-semibold">
                                    {Allclasses.find(
                                        (classs) =>
                                            classs.id === student.classId,
                                    )?.name || "6A"}
                                </h1>
                                <span className="text-sm text-gray-400">
                                    Classe
                                </span>
                            </div>
                        </div>
                        {/* CARTE - Assurance */}
                        <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] border border-blue-200">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    {student.assurance_paid
                                        ? `Payée (${student.assurance_invoice?.amount} DH)`
                                        : "Non payée"}
                                </h1>
                                <span className="text-sm text-gray-400">
                                    Assurance
                                    {student.assurance_paid && student.assurance_invoice?.date && (
                                        <> — {new Date(student.assurance_invoice.date).toLocaleDateString("fr-FR")}</>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Statut de promotion */}
                {(role === "admin" || role === "assistant") && (
                    <div className="mt-4">
                        <Suspense fallback={<span>Chargement...</span>}>
                            <StudentPromotionStatus
                                promotionStatus={student.promotion}
                            />
                        </Suspense>
                    </div>
                )}
                {/* Informations supplémentaires sur l'élève */}
                <div className="mt-2">
                    <button
                        onClick={() => setShowMoreInfo(!showMoreInfo)}
                        className="flex items-center justify-center w-full py-2 px-4 bg-lamaSky text-white rounded-md text-sm font-medium hover:bg-lamaSky/90 transition-colors"
                    >
                        {showMoreInfo ? (
                            <>
                                Afficher moins{" "}
                                <ChevronUp className="ml-1 w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Voir plus{" "}
                                <ChevronDown className="ml-1 w-4 h-4" />
                            </>
                        )}
                    </button>
                    {showMoreInfo && (
                        <div className="mt-4 bg-white rounded-md shadow-md border border-gray-100 animate-fadeIn overflow-hidden">
                            <div className="bg-lamaSky/10 px-6 py-3 border-b border-gray-100">
                                <h3 className="text-lg font-medium text-gray-800">
                                    Informations supplémentaires sur l'élève
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-lamaSkyLight/30 p-4 rounded-lg">
                                        <h4 className="text-lamaSky font-medium mb-3 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            Informations personnelles
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    Date de naissance
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {student.dateOfBirth
                                                        ? new Date(
                                                              student.dateOfBirth,
                                                          ).toLocaleDateString(
                                                              "fr-FR",
                                                          )
                                                        : "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    Numéro de l'élève
                                                </div>
                                                <div className="font-medium text-sm">
                                                    { student.phoneNumber||
                                                        "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    Nom du tuteur
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {student.guardianName || "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    CIN
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {student.CIN || "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <div className="text-gray-600 text-sm">
                                                    Adresse
                                                </div>
                                                <div className="font-medium text-sm text-right">
                                                    {student.address || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-lamaPurpleLight/30 p-4 rounded-lg">
                                        <h4 className="text-lamaPurple font-medium mb-3 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                                                />
                                            </svg>
                                            Informations académiques
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between border-b border-purple-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    Code Massar
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {student.massarCode ||
                                                        "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-b border-purple-100 pb-2">
                                                <div className="text-gray-600 text-sm">
                                                    Date de facturation
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {student.billingDate
                                                        ? new Date(
                                                              student.billingDate,
                                                          ).toLocaleDateString(
                                                              "fr-FR",
                                                          )
                                                        : "N/A"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <div className="text-gray-600 text-sm">
                                                    Statut
                                                </div>
                                                <div className="font-medium text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${
                                                            student.status ===
                                                            "active"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                    >
                                                        {student.status ===
                                                        "active"
                                                            ? "Actif"
                                                            : "Inactif"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg md:col-span-2">
                                        <h4 className="text-amber-600 font-medium mb-3 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Informations de santé
                                        </h4>
                                        {student.hasDisease ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white p-3 rounded-md border border-amber-100">
                                                    <div className="text-amber-700 text-xs mb-1">
                                                        Condition médicale
                                                    </div>
                                                    <div className="font-medium text-gray-800">
                                                        {student.diseaseName ||
                                                            "N/A"}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-md border border-amber-100">
                                                    <div className="text-amber-700 text-xs mb-1">
                                                        Médication
                                                    </div>
                                                    <div className="font-medium text-gray-800">
                                                        {student.medication ||
                                                            "N/A"}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-md border border-amber-100">
                                                    <div className="text-amber-700 text-xs mb-1">
                                                        Assurance
                                                    </div>
                                                    <div className="font-medium text-gray-800">
                                                        {student.assurance
                                                            ? "Oui"
                                                            : "Non"}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white p-4 rounded-md border border-amber-100 flex items-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-3 text-green-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span className="text-gray-700 font-medium">
                                                    L'élève est en bonne santé
                                                    sans conditions médicales
                                                    signalées.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* BAS */}
                {/* Adhésions section: use flex-col and w-full ONLY on small screens, revert to old flex-row and spacing for md+. */}
                <div className="mt-4 bg-white rounded-md p-4">
                    {/* Adhésions Heading for mobile */}

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
                        <div className="flex flex-col md:flex-row md:items-center md:mb-6 gap-2 md:gap-2 text-blue-600 font-medium mr-4">
                            <span className="flex flex-row items-center">
                                <Users className="h-5 w-5 mr-3" />
                                Adhésions :
                                {student.memberships && student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length > 0 && (
                                    <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length} impayée(s)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Suspense fallback={<span>Chargement...</span>}>
                                <FormModal
                                    table="membership"
                                    type="create"
                                    id={student.id}
                                    offers={Alloffers}
                                    teachers={Allteachers}
                                    studentId={student.id}
                                    className="w-full md:w-auto"
                                />
                            </Suspense>
                        </div>
                    </div>
                    {student.memberships ? (
                        <>
                            {student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-md text-sm">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-amber-800">Adhésions impayées</h3>
                                            <p className="text-amber-700 mt-1">
                                                Cet élève a {student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length} adhésion{student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length === 1 ? "" : "s"} impayée{student.memberships.filter((m) => m.payment_status !== "paid" && !m.deleted_at).length === 1 ? "" : "s"}.<br />
                                                Ajoutez une facture pour compléter le processus de paiement.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Toggle button for deleted memberships */}
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-800">Adhésions</h3>
                                    {student.memberships.filter(m => m.deleted_at).length > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                            {student.memberships.filter(m => m.deleted_at).length} supprimée{student.memberships.filter(m => m.deleted_at).length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowDeletedMemberships(!showDeletedMemberships)}
                                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                        student.memberships.filter(m => m.deleted_at).length === 0
                                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    disabled={student.memberships.filter(m => m.deleted_at).length === 0}
                                >
                                    {showDeletedMemberships ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Masquer les supprimées
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-6 6-6-6" />
                                            </svg>
                                            Afficher les supprimées
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="w-full md:max-w-lg md:p-6 md:bg-white md:rounded-lg md:shadow-md md:border md:border-gray-200">
                                <Suspense fallback={<span>Chargement...</span>}>
                                    <MembershipCard
                                        Student_memberships={showDeletedMemberships ? student.memberships : student.memberships.filter(m => !m.deleted_at)}
                                        teachers={Allteachers}
                                        offers={Alloffers}
                                        studentId={student.id}
                                        className="w-full"
                                    />
                                </Suspense>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <img
                                src="/student.png"
                                alt="Élève"
                                width={64}
                                height={64}
                                className="mb-4"
                            />
                            <h1 className="text-2xl font-semibold text-gray-700">Aucune adhésion</h1>
                        </div>
                    )}
                </div>
                {/* Profil de l'élève avec notes, factures et présence */}
                <Suspense fallback={<span>Chargement...</span>}>
                    <StudentProfile
                        Student_memberships={student.memberships}
                        invoices={student.invoices}
                        studentId={student.id}
                        studentClassId={student.classId}
                        attendances={student.attendances}
                        results={student.results}
                        student={student}
                        Allclasses={Allclasses}
                        Allschools={Allschools}
                    />
                </Suspense>
            </div>
            {/* DROITE */}
            <div className="w-full xl:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-md">
                    <h1 className="text-xl font-semibold">Raccourcis</h1>
                    <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
                        <Link
                            className="p-3 rounded-md bg-lamaPurpleLight"
                            href="/teachers"
                        >
                            Enseignants de l'élève
                        </Link>
                        <Link
                            className="p-3 rounded-md bg-lamaSkyLight"
                            href="/attendances"
                        >
                            Présences de l'élève
                        </Link>
                        <Link
                            className="p-3 rounded-md bg-pink-50"
                            href="/classes"
                        >
                            Classes de l'élève
                        </Link>
                        <Link
                            className="p-3 rounded-md bg-lamaYellowLight"
                            href="/results"
                        >
                            Résultats de l'élève
                        </Link>
                    </div>
                </div>
                <Suspense fallback={<span>Chargement...</span>}>
                    <Performance student={student} />
                </Suspense>
                <Suspense fallback={<span>Chargement...</span>}>
                    <Announcements />
                </Suspense>
            </div>
        </div>
    );
};
SingleStudentPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default SingleStudentPage;
