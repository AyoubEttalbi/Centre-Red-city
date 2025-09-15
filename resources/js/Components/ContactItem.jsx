// ContactItem Component with unread count badge
import React, { useMemo } from "react";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
import Avatar from "./Avatar";
const ContactItem = React.memo(
    ({ user, isActive, onClick, unreadCount, lastMessage, currentUserId }) => {
        const getLastMessagePreview = () => {
            if (!lastMessage) return "No messages yet";

            const isCurrentUserSender = lastMessage.sender_id === currentUserId;
            const prefix = isCurrentUserSender ? "You: " : "";
            return `${prefix}${lastMessage.message}`;
        };
        const formatTime = (dateString) => {
            if (!dateString) return "";

            const now = new Date();
            const date = new Date(dateString);
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else if (diffDays === 1) {
                return "Yesterday";
            } else if (diffDays < 7) {
                return date.toLocaleDateString([], { weekday: "short" });
            } else {
                return date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                });
            }
        };

        // Memoize the message status to prevent unnecessary re-renders
        const messageStatus = useMemo(() => {
            if (!lastMessage || lastMessage.sender_id !== currentUserId)
                return null;

            return lastMessage.is_read ? (
                <div className="flex items-center" title="Read">
                    <IoCheckmarkDone className="text-xs text-blue-500" />
                </div>
            ) : (
                <div className="flex items-center" title="Delivered">
                    <IoCheckmark className="text-xs text-gray-400" />
                </div>
            );
        }, [lastMessage, currentUserId]);

        return (
            <div
                className={`flex items-center p-3 cursor-pointer transition-colors relative ${isActive ? "bg-blue-50 border-r-2 border-blue-500" : "hover:bg-gray-50"}`}
                onClick={onClick}
            >
                <Avatar
                    src={user.profile_image}
                    status={user.status || "offline"}
                    size="md"
                />
                <div className="ml-3 flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-800 truncate">
                            {user.name}
                        </p>
                        <div className="flex items-center">
                            {unreadCount > 0 ? (
                                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            ) : null}
                            <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatTime(lastMessage?.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p
                            className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-gray-800" : "text-gray-500"}`}
                        >
                            {getLastMessagePreview()}
                        </p>
                        <div className="flex-shrink-0 ml-2">
                            {messageStatus}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison function to prevent unnecessary re-renders
        return (
            prevProps.user.id === nextProps.user.id &&
            prevProps.isActive === nextProps.isActive &&
            prevProps.onClick === nextProps.onClick &&
            prevProps.unreadCount === nextProps.unreadCount &&
            prevProps.lastMessage?.id === nextProps.lastMessage?.id &&
            prevProps.lastMessage?.is_read === nextProps.lastMessage?.is_read &&
            prevProps.lastMessage?.created_at ===
                nextProps.lastMessage?.created_at &&
            prevProps.lastMessage?.message === nextProps.lastMessage?.message &&
            prevProps.currentUserId === nextProps.currentUserId
        );
    },
);
export default ContactItem;
