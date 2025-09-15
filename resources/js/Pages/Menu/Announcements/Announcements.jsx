import { usePage } from "@inertiajs/react";
import { useMemo } from "react";
import { Link } from "@inertiajs/react";
import { CalendarIcon, UsersIcon, BellIcon } from "@heroicons/react/24/outline";

/**
 * Announcements Component
 *
 * Displays filtered announcements based on user role, date visibility, and optionally schoolId
 *
 * @param {Object[]} announcements - Array of announcement objects
 * @param {string} userRole - Current user's role (admin, teacher, assistant, etc.)
 * @param {number} limit - Maximum number of announcements to display
 * @param {string|number} schoolId - Selected school id for filtering
 * @returns {JSX.Element} Rendered component
 */
const Announcements = ({ announcements = [], userRole = "all", limit = 3, schoolId }) => {
    const { props } = usePage();
    const role = props.auth.user.role;
    // Filter and sort announcements based on visibility, date range, school, and limit
    const filteredAnnouncements = useMemo(() => {
        if (!announcements?.length) return [];

        const now = new Date();

        return [...announcements]
            .filter((announcement) => {
                // If announcement.school_id exists, filter by schoolId
                if (schoolId && announcement.school_id && String(announcement.school_id) !== String(schoolId)) {
                    return false;
                }
                // Admin can see all announcements regardless of visibility setting
                // Other roles can only see announcements targeted to them or 'all'
                const hasVisibilityAccess =
                    userRole === "admin" ||
                    announcement.visibility === "all" ||
                    announcement.visibility === userRole;

                // Check if within active date range
                const isWithinDateRange =
                    (!announcement.date_start ||
                        new Date(announcement.date_start) <= now) &&
                    (!announcement.date_end ||
                        new Date(announcement.date_end) >= now);

                return hasVisibilityAccess && isWithinDateRange;
            })
            .sort(
                (a, b) =>
                    new Date(b.date_announcement) -
                    new Date(a.date_announcement),
            )
            .slice(0, limit);
    }, [announcements, userRole, limit, schoolId]);

    // Format date to a user-friendly string
    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("fr-FR");
    };

    // Get appropriate background color based on announcement visibility
    const getVisibilityStyles = (visibility) => {
        const styles = {
            teacher: {
                bg: "bg-blue-50",
                border: "border-blue-200",
                icon: "text-blue-500",
            },
            assistant: {
                bg: "bg-purple-50",
                border: "border-purple-200",
                icon: "text-purple-500",
            },
            admin: {
                bg: "bg-red-50",
                border: "border-red-200",
                icon: "text-red-500",
            },
            all: {
                bg: "bg-green-50",
                border: "border-green-200",
                icon: "text-green-500",
            },
        };

        return (
            styles[visibility] || {
                bg: "bg-gray-50",
                border: "border-gray-200",
                icon: "text-gray-500",
            }
        );
    };

    // Render announcement cards
    const renderAnnouncementCards = () => {
        if (filteredAnnouncements.length === 0) {
            return (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                    <BellIcon className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                        Aucune annonce disponible
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {filteredAnnouncements.map((announcement) => {
                    const styles = getVisibilityStyles(announcement.visibility);

                    return (
                        <div
                            key={announcement.id}
                            className={`${styles.bg} border ${styles.border} rounded-lg p-4 transition duration-150 hover:shadow-sm`}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-medium text-gray-800">
                                    {announcement.title}
                                </h2>
                                <span className="text-xs bg-white px-2 py-1 rounded-md border border-gray-100 text-gray-500 flex items-center">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    {formatDate(announcement.date_announcement)}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {announcement.content}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                                <span
                                    className={`text-xs flex items-center ${styles.icon}`}
                                >
                                    <UsersIcon className="h-3 w-3 mr-1" />
                                    {announcement.visibility === "all"
                                        ? "Tout le monde"
                                        : announcement.visibility
                                              .charAt(0)
                                              .toUpperCase() +
                                          announcement.visibility.slice(1)}
                                </span>

                                {announcement.content.length > 120 && (
                                    <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">
                                        Lire la suite
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Determine width based on URL
    const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
    const containerWidth = isDashboard ? 'w-full' : 'w-full';

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${containerWidth}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                    <BellIcon className="h-5 w-5 text-gray-500" />
                    <h1 className="font-semibold text-gray-800">Annonces</h1>
                </div>

                <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">
                        {userRole === "all"
                            ? "Tous les utilisateurs"
                            : userRole.charAt(0).toUpperCase() +
                              userRole.slice(1)}
                    </span>

                    <Link
                        href="/ViewAllAnnouncements"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                        Voir tout
                    </Link>
                </div>
            </div>

            <div className="p-4">
                {announcements === null ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-pulse flex space-x-2">
                            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                ) : (
                    renderAnnouncementCards()
                )}
            </div>
        </div>
    );
};

export default Announcements;
