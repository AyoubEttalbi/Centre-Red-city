import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import Menu from "@/Components/Menu";
import Navbar from "@/Components/Navbar";
import InboxPopup from "@/Components/InboxPopup";
import axios from "axios";

export default function DashboardLayout({ children }) {
    const { auth, users } = usePage().props;
    const [showInbox, setShowInbox] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCount, setUnreadCount] = useState(() => {
        // Initialize from localStorage if available
        const saved = localStorage.getItem("totalUnreadCount");
        return saved ? parseInt(saved, 10) : 0;
    });
    const { props } = usePage();
    const user = props.auth.user;

    // Function to update unread count and save to localStorage
    const updateUnreadCount = (count) => {
        setUnreadCount(count);
        localStorage.setItem("totalUnreadCount", count.toString());
    };

    useEffect(() => {
        // Fetch initial unread count
        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get("/unread-count");
                const totalCount = Object.values(
                    response.data.unread_count,
                ).reduce((sum, count) => sum + count, 0);
                updateUnreadCount(totalCount);
            } catch (error) {
                console.error("Failed to fetch unread count", error);
                // If fetch fails, try to use cached count
                const saved = localStorage.getItem("totalUnreadCount");
                if (saved) {
                    setUnreadCount(parseInt(saved, 10));
                }
            }
        };

        // Set up periodic sync for unread count
        const syncInterval = setInterval(fetchUnreadCount, 10000); // Sync every 30 seconds

        // Listen to unread count updates
        const channel = window.Echo.channel(
            `user.${auth.user.id}.notifications`,
        );
        channel.listen(".UnreadMessageCountUpdated", (e) => {
            const totalCount = Object.values(e.unread_count).reduce(
                (sum, count) => sum + count,
                0,
            );
            updateUnreadCount(totalCount);
        });

        // Initial fetch
        fetchUnreadCount();

        return () => {
            clearInterval(syncInterval);
            channel.stopListening(".UnreadMessageCountUpdated");
            window.Echo.leave(`user.${auth.user.id}.notifications`);
        };
    }, [auth.user.id]);

    useEffect(() => {
        if (!auth.user) return;

        // Initialize Echo and listen for presence channel
        window.Echo.join(`presence-online-users`)
            .here((users) => {
                setOnlineUsers(users.map((u) => u.id));
            })
            .joining((user) => {
                setOnlineUsers((prev) => [...prev, user.id]);
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter((id) => id !== user.id));
            });

        return () => {
            window.Echo.leave(`presence-online-users`);
        };
    }, [auth.user]);

    const handleClosePopup = async () => {
        try {
            await axios.post(`/message/${auth.user.id}/read`);
            updateUnreadCount(0); // Update unread count and save to localStorage
        } catch (error) {
            console.error("Failed to update unread count:", error);
        }
        setShowInbox(false);
    };

    // Enhance users with online status
    const usersWithStatus = (users.data || []).map((user) => ({
        ...user,
        status: onlineUsers.includes(user.id) ? "online" : "offline",
    }));

    return (
        <div className="flex">
            {/* LEFT - Sidebar */}
            <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center lg:justify-start gap-2"
                >
                    <img src="/logo.png" alt="logo" width={32} height={32} />
                    <span className="hidden lg:block font-bold">
                        CENTRE RED CITY
                    </span>
                </Link>
                <Menu />
            </div>

            {/* RIGHT - Main Content */}
            <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] flex flex-col">
                <Navbar auth={user} profile_image={props.auth.profile_image} />
                {children}

                {/* Floating message button */}
                {!showInbox && (
                    <button
                        onClick={() => setShowInbox(true)}
                        className="fixed bottom-6 right-6 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Inbox Popup */}
                {showInbox && (
                    <InboxPopup
                        auth={auth}
                        users={usersWithStatus}
                        onClose={handleClosePopup}
                    />
                )}
            </div>
        </div>
    );
}
