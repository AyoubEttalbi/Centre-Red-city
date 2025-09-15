import DashboardLayout from "@/Layouts/DashboardLayout";
import React, { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    PlusCircleIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function AnnouncementsPage({ announcements }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmingAnnouncementDeletion, setConfirmingAnnouncementDeletion] =
        useState(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
    const role = usePage().props.auth.user.role;
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadge = (announcement) => {
        const now = new Date();
        const startDate = new Date(announcement.date_start);
        const endDate = new Date(announcement.date_end);

        if (now < startDate) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Prévu
                </span>
            );
        } else if (now > endDate) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Expiré
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Actif
                </span>
            );
        }
    };

    const getVisibilityBadge = (visibility) => {
        const colors = {
            all: "bg-blue-100 text-blue-800",
            teacher: "bg-purple-100 text-purple-800",
            assistant: "bg-pink-100 text-pink-800",
        };

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[visibility]}`}
            >
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
            </span>
        );
    };

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        title: "",
        content: "",
        date_announcement: new Date().toISOString().split("T")[0],
        date_start: "",
        date_end: "",
        visibility: "all",
    });

    const createAnnouncement = (e) => {
        e.preventDefault();
        post(route("announcements.store"), {
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
            },
        });
    };

    const updateAnnouncement = (e) => {
        e.preventDefault();
        put(route("announcements.update", editingAnnouncement.id), {
            onSuccess: () => {
                reset();
                setEditingAnnouncement(null);
            },
        });
    };

    const deleteAnnouncement = () => {
        destroy(
            route("announcements.destroy", confirmingAnnouncementDeletion.id),
            {
                onSuccess: () => setConfirmingAnnouncementDeletion(null),
            },
        );
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        reset();
    };

    const closeEditModal = () => {
        setEditingAnnouncement(null);
        reset();
    };

    const openEditModal = (announcement) => {
        setEditingAnnouncement(announcement);
        setData({
            title: announcement.title,
            content: announcement.content,
            date_announcement: announcement.date_announcement
                ? announcement.date_announcement.split("T")[0]
                : new Date().toISOString().split("T")[0],
            date_start: announcement.date_start.split("T")[0],
            date_end: announcement.date_end.split("T")[0],
            visibility: announcement.visibility,
        });
    };

    const openViewModal = (announcement) => {
        setViewingAnnouncement(announcement);
    };

    return (
        <>
            <Head title="Annonces" />

            <div className="py-6">
                <div className="max-full mx-auto sm:px-6 lg:px-10">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold text-gray-800">
                                    Annonces
                                </h1>
                                {role === "admin" && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300"
                                    >
                                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                                        Nouvelle annonce
                                    </button>
                                )}
                            </div>

                            {announcements && announcements.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Titre
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Date de l'annonce
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Plage de dates
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Statut
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Visibilité
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {announcements.map(
                                                (announcement) => (
                                                    <tr key={announcement.id}>
                                                        <td
                                                            className="px-6 py-4 whitespace-nowrap"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    announcement,
                                                                )
                                                            }
                                                        >
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {
                                                                    announcement.title
                                                                }
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="px-6 py-4 whitespace-nowrap"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    announcement,
                                                                )
                                                            }
                                                        >
                                                            <div className="text-sm text-gray-500">
                                                                {announcement.date_announcement
                                                                    ? formatDate(
                                                                          announcement.date_announcement,
                                                                      )
                                                                    : "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {formatDate(
                                                                    announcement.date_start,
                                                                )}{" "}
                                                                -{" "}
                                                                {formatDate(
                                                                    announcement.date_end,
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(
                                                                announcement,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getVisibilityBadge(
                                                                announcement.visibility,
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        announcement,
                                                                    )
                                                                }
                                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                            >
                                                                <EyeIcon className="w-5 h-5" />
                                                            </button>
                                                            {role ===
                                                                "admin" && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                announcement,
                                                                            )
                                                                        }
                                                                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                                                                    >
                                                                        <PencilIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setConfirmingAnnouncementDeletion(
                                                                                announcement,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        <TrashIcon className="w-5 h-5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        Aucune annonce
                                    </h3>
                                    {role === "admin" && (
                                        <>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Commencez par créer une nouvelle
                                                annonce.
                                            </p>
                                            <div className="mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowCreateModal(true)
                                                    }
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    <PlusCircleIcon
                                                        className="-ml-1 mr-2 h-5 w-5"
                                                        aria-hidden="true"
                                                    />
                                                    Nouvelle annonce
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Announcement Modal */}
            {role === "admin" && (
                <Modal show={showCreateModal} onClose={closeCreateModal}>
                    <form onSubmit={createAnnouncement} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Créer une nouvelle annonce
                        </h2>

                        <div className="mb-4">
                            <InputLabel htmlFor="title" value="Titre" />
                            <TextInput
                                id="title"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.title}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="content" value="Contenu" />
                            <textarea
                                id="content"
                                className="mt-1 block w-full"
                                value={data.content}
                                onChange={(e) =>
                                    setData("content", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.content}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="date_announcement"
                                value="Date de l'annonce"
                            />
                            <TextInput
                                id="date_announcement"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_announcement}
                                onChange={(e) =>
                                    setData("date_announcement", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_announcement}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="date_start"
                                value="Date de début"
                            />
                            <TextInput
                                id="date_start"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_start}
                                onChange={(e) =>
                                    setData("date_start", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_start}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="date_end" value="Date de fin" />
                            <TextInput
                                id="date_end"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_end}
                                onChange={(e) =>
                                    setData("date_end", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_end}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="visibility"
                                value="Visibilité"
                            />
                            {/* Fixed Select component using shadcn/ui pattern */}
                            <Select
                                value={data.visibility}
                                onValueChange={(value) =>
                                    setData("visibility", value)
                                }
                            >
                                <SelectTrigger className="mt-1 w-full">
                                    <SelectValue placeholder="Sélectionner la visibilité" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous les utilisateurs
                                    </SelectItem>
                                    <SelectItem value="teacher">
                                        Enseignants seulement
                                    </SelectItem>
                                    <SelectItem value="assistant">
                                        Assistants seulement
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errors.visibility}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex justify-end mt-6">
                            <SecondaryButton
                                onClick={closeCreateModal}
                                className="mr-2"
                            >
                                Annuler
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing
                                    ? "Création en cours..."
                                    : "Créer l'annonce"}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Announcement Modal */}
            <Modal show={!!editingAnnouncement} onClose={closeEditModal}>
                {editingAnnouncement && role === "admin" && (
                    <form onSubmit={updateAnnouncement} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Modifier l'annonce
                        </h2>

                        <div className="mb-4">
                            <InputLabel htmlFor="edit_title" value="Titre" />
                            <TextInput
                                id="edit_title"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.title}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="edit_content"
                                value="Contenu"
                            />
                            <textarea
                                id="edit_content"
                                className="mt-1 block w-full"
                                value={data.content}
                                onChange={(e) =>
                                    setData("content", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.content}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="edit_date_announcement"
                                value="Date de l'annonce"
                            />
                            <TextInput
                                id="edit_date_announcement"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_announcement}
                                onChange={(e) =>
                                    setData("date_announcement", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_announcement}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="edit_date_start"
                                value="Date de début"
                            />
                            <TextInput
                                id="edit_date_start"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_start}
                                onChange={(e) =>
                                    setData("date_start", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_start}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="edit_date_end"
                                value="Date de fin"
                            />
                            <TextInput
                                id="edit_date_end"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.date_end}
                                onChange={(e) =>
                                    setData("date_end", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.date_end}
                                className="mt-2"
                            />
                        </div>

                        <div className="mb-4">
                            <InputLabel
                                htmlFor="edit_visibility"
                                value="Visibilité"
                            />
                            {/* Fixed Select component using shadcn/ui pattern */}
                            <Select
                                value={data.visibility}
                                onValueChange={(value) =>
                                    setData("visibility", value)
                                }
                            >
                                <SelectTrigger className="mt-1 w-full">
                                    <SelectValue placeholder="Sélectionner la visibilité" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous les utilisateurs
                                    </SelectItem>
                                    <SelectItem value="teacher">
                                        Enseignants seulement
                                    </SelectItem>
                                    <SelectItem value="assistant">
                                        Assistants seulement
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errors.visibility}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex justify-end mt-6">
                            <SecondaryButton
                                onClick={closeEditModal}
                                className="mr-2"
                            >
                                Annuler
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing
                                    ? "Mise à jour en cours..."
                                    : "Mettre à jour l'annonce"}
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </Modal>

            {/* View Announcement Modal */}
            <Modal
                show={!!viewingAnnouncement}
                onClose={() => setViewingAnnouncement(null)}
            >
                {viewingAnnouncement && (
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {viewingAnnouncement.title}
                            </h2>
                            <div className="flex space-x-2">
                                {getStatusBadge(viewingAnnouncement)}
                                {getVisibilityBadge(
                                    viewingAnnouncement.visibility,
                                )}
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                            {viewingAnnouncement.date_announcement ? (
                                <div className="mb-1">
                                    Date de l'annonce:{" "}
                                    {formatDate(
                                        viewingAnnouncement.date_announcement,
                                    )}
                                </div>
                            ) : null}
                            Période active:{" "}
                            {formatDate(viewingAnnouncement.date_start)} -{" "}
                            {formatDate(viewingAnnouncement.date_end)}
                        </div>

                        <div className="mt-4 prose max-w-none">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: viewingAnnouncement.content.replace(
                                        /\n/g,
                                        "<br>",
                                    ),
                                }}
                            />
                        </div>

                        <div className="mt-6 flex justify-end">
                            <SecondaryButton
                                onClick={() => setViewingAnnouncement(null)}
                            >
                                Fermer
                            </SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                show={!!confirmingAnnouncementDeletion}
                onClose={() => setConfirmingAnnouncementDeletion(null)}
            >
                {confirmingAnnouncementDeletion && (
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-900">
                            Êtes-vous sûr de vouloir supprimer cette annonce ?
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Une fois cette annonce supprimée, toutes ses
                            ressources et données seront définitivement supprimées.
                        </p>

                        <div className="mt-6 flex justify-end">
                            <SecondaryButton
                                onClick={() =>
                                    setConfirmingAnnouncementDeletion(null)
                                }
                                className="mr-2"
                            >
                                Annuler
                            </SecondaryButton>

                            <DangerButton
                                onClick={deleteAnnouncement}
                                disabled={processing}
                            >
                                {processing
                                    ? "Suppression en cours..."
                                    : "Supprimer l'annonce"}
                            </DangerButton>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

AnnouncementsPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
