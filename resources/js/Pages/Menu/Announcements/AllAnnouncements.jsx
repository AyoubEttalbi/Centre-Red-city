import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import {
    CalendarDaysIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    BellAlertIcon,
    ClockIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "@/Layouts/DashboardLayout";

/**
 * ViewAllAnnouncements Component
 *
 * Displays all announcements with filtering capabilities
 *
 * @param {Object[]} announcements - Array of announcement objects
 * @returns {JSX.Element} Rendered component
 */
const ViewAllAnnouncements = ({ announcements = [] }) => {
    const { auth } = usePage().props;
    const userRole = auth.user?.role || "all";

    // State for filters
    const [filters, setFilters] = useState({
        visibility: "all", // 'all', 'teacher', 'assistant', or 'mine'
        status: "active", // 'all', 'active', 'scheduled', 'expired'
        search: "",
    });

    const [showFilters, setShowFilters] = useState(false);

    // Format date to a user-friendly string
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Calculate days remaining for an announcement
    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;

        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    // Filter announcements based on current filters
    const filteredAnnouncements = React.useMemo(() => {
        if (!announcements?.length) return [];

        const now = new Date();

        return announcements
            .filter((announcement) => {
                // Filter by visibility
                const visibilityMatch =
                    filters.visibility === "all" ||
                    (filters.visibility === "mine" &&
                        announcement.visibility === userRole) ||
                    filters.visibility === announcement.visibility;

                // Filter by status
                let statusMatch = true;
                const startDate = announcement.date_start
                    ? new Date(announcement.date_start)
                    : null;
                const endDate = announcement.date_end
                    ? new Date(announcement.date_end)
                    : null;

                if (filters.status === "active") {
                    statusMatch =
                        (!startDate || startDate <= now) &&
                        (!endDate || endDate >= now);
                } else if (filters.status === "scheduled") {
                    statusMatch = startDate && startDate > now;
                } else if (filters.status === "expired") {
                    statusMatch = endDate && endDate < now;
                }

                // Filter by search term
                const searchMatch =
                    filters.search === "" ||
                    announcement.title
                        .toLowerCase()
                        .includes(filters.search.toLowerCase()) ||
                    announcement.content
                        .toLowerCase()
                        .includes(filters.search.toLowerCase());

                return visibilityMatch && statusMatch && searchMatch;
            })
            .sort(
                (a, b) =>
                    new Date(b.date_announcement) -
                    new Date(a.date_announcement),
            );
    }, [announcements, filters, userRole]);

    // Get announcement status
    const getAnnouncementStatus = (announcement) => {
        const now = new Date();
        const startDate = announcement.date_start
            ? new Date(announcement.date_start)
            : null;
        const endDate = announcement.date_end
            ? new Date(announcement.date_end)
            : null;

        if (startDate && startDate > now) {
            return {
                label: "Prévu",
                className: "bg-amber-50 text-amber-700 border border-amber-200",
                icon: <ClockIcon className="h-3.5 w-3.5" />,
            };
        } else if (endDate && endDate < now) {
            return {
                label: "Expiré",
                className: "bg-gray-50 text-gray-600 border border-gray-200",
                icon: <XMarkIcon className="h-3.5 w-3.5" />,
            };
        } else {
            return {
                label: "Actif",
                className:
                    "bg-emerald-50 text-emerald-700 border border-emerald-200",
                icon: <BellAlertIcon className="h-3.5 w-3.5" />,
            };
        }
    };

    // Get visibility badge style
    const getVisibilityBadge = (visibility) => {
        const styles = {
            all: {
                className: "bg-blue-50 text-blue-700 border border-blue-200",
                label: "Tout le monde",
                icon: <UserGroupIcon className="h-3.5 w-3.5" />,
            },
            teacher: {
                className:
                    "bg-indigo-50 text-indigo-700 border border-indigo-200",
                label: "Enseignants uniquement",
                icon: <UserGroupIcon className="h-3.5 w-3.5" />,
            },
            assistant: {
                className:
                    "bg-purple-50 text-purple-700 border border-purple-200",
                label: "Assistants uniquement",
                icon: <UserGroupIcon className="h-3.5 w-3.5" />,
            },
        };

        return (
            styles[visibility] || {
                className: "bg-gray-50 text-gray-700 border border-gray-200",
                label: visibility.charAt(0).toUpperCase() + visibility.slice(1),
                icon: <UserGroupIcon className="h-3.5 w-3.5" />,
            }
        );
    };

    // Toggle filter panel
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            visibility: "all",
            status: "all",
            search: "",
        });
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Counter for unfiltered vs filtered announcements
    const totalAnnouncementsCount = announcements.length;
    const filteredAnnouncementsCount = filteredAnnouncements.length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with title and search/filter controls */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                            <BellAlertIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">
                                Annonces
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {filteredAnnouncementsCount ===
                                totalAnnouncementsCount
                                    ? `Affichage de toutes les ${totalAnnouncementsCount} annonces`
                                    : `Affichage de ${filteredAnnouncementsCount} sur ${totalAnnouncementsCount} annonces`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher des annonces..."
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange("search", e.target.value)
                                }
                            />
                            {filters.search && (
                                <button
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() =>
                                        handleFilterChange("search", "")
                                    }
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={toggleFilters}
                            className={`inline-flex items-center px-3 py-2 border ${showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300 text-gray-700 bg-white"} shadow-sm text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                        >
                            <FunnelIcon className="h-4 w-4 mr-1.5" />
                            Filtres
                        </button>
                    </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-700">
                                Filtrer les annonces
                            </h3>
                            <button
                                onClick={resetFilters}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 sm:mt-0 flex items-center"
                            >
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                Réinitialiser tous les filtres
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Statut
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        "all",
                                        "active",
                                        "scheduled",
                                        "expired",
                                    ].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() =>
                                                handleFilterChange(
                                                    "status",
                                                    status,
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                                                filters.status === status
                                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Visibilité
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        "all",
                                        "mine",
                                        "teacher",
                                        "assistant",
                                    ].map((visibility) => (
                                        <button
                                            key={visibility}
                                            onClick={() =>
                                                handleFilterChange(
                                                    "visibility",
                                                    visibility,
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                                                filters.visibility ===
                                                visibility
                                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {visibility === "all"
                                                ? "Tout le monde"
                                                : visibility === "mine"
                                                  ? "Pour moi"
                                                  : visibility
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    visibility.slice(1) +
                                                    "s"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Announcements list */}
            <div className="divide-y divide-gray-100">
                {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gray-100">
                            <BellAlertIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-3 text-base font-medium text-gray-900">
                            Aucune annonce trouvée
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Essayez d'ajuster vos filtres ou revenez plus tard pour
                            de nouvelles annonces.
                        </p>
                        {(filters.status !== "all" ||
                            filters.visibility !== "all" ||
                            filters.search !== "") && (
                            <button
                                onClick={resetFilters}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Réinitialiser tous les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    filteredAnnouncements.map((announcement, index) => {
                        const status = getAnnouncementStatus(announcement);
                        const visibility = getVisibilityBadge(
                            announcement.visibility,
                        );
                        const daysRemaining = getDaysRemaining(
                            announcement.date_end,
                        );

                        return (
                            <div
                                key={announcement.id}
                                className={`px-6 py-5 hover:bg-gray-50 transition-colors duration-150 ${
                                    index === filteredAnnouncements.length - 1
                                        ? "rounded-b-xl"
                                        : ""
                                }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    {/* Left content - title and content */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1.5">
                                            <h2 className="font-semibold text-lg text-gray-800">
                                                {announcement.title}
                                            </h2>

                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                                                >
                                                    {status.icon}
                                                    <span>{status.label}</span>
                                                </span>

                                                <span
                                                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${visibility.className}`}
                                                >
                                                    {visibility.icon}
                                                    <span>
                                                        {visibility.label}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 leading-relaxed mb-3">
                                            {announcement.content}
                                        </div>

                                        <div className="flex flex-wrap items-center text-xs text-gray-500 space-x-4">
                                            <span className="flex items-center">
                                                <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                Publié :{" "}
                                                {formatDate(
                                                    announcement.date_announcement,
                                                )}
                                            </span>

                                            <span className="flex items-center whitespace-nowrap">
                                                <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                Actif :{" "}
                                                {formatDate(
                                                    announcement.date_start,
                                                )}{" "}
                                                —{" "}
                                                {formatDate(
                                                    announcement.date_end,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right content - card with days remaining */}
                                    {daysRemaining !== null &&
                                        daysRemaining > 0 && (
                                            <div className="flex-shrink-0 w-full md:w-auto">
                                                <div
                                                    className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                                                        daysRemaining <= 3
                                                            ? "bg-red-50 border border-red-200 text-red-800"
                                                            : "bg-blue-50 border border-blue-200 text-blue-800"
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium">
                                                        Expire dans
                                                    </span>
                                                    <div className="flex items-end mt-1">
                                                        <span className="text-2xl font-bold">
                                                            {daysRemaining}
                                                        </span>
                                                        <span className="text-xs ml-1 mb-0.5">
                                                            jour
                                                            {daysRemaining !== 1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ViewAllAnnouncements;
ViewAllAnnouncements.layout = (page) => <DashboardLayout children={page} />;
