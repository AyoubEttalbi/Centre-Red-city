// ChatMessage Component with double checkmarks
import React from "react";
import { IoCheckmarkDone, IoCheckmark } from "react-icons/io5";
const ChatMessage = ({ message = {}, isUser }) => {
    const formatTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div
            className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                    isUser
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
            >
                <p className="text-sm">{message.message}</p>
                <div className="flex items-center justify-end mt-1 space-x-1">
                    <div className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                    </div>
                    {isUser && (
                        <div className="flex items-center ml-1">
                            {message.is_read ? (
                                <div className="flex" title="Read">
                                    <IoCheckmarkDone className="text-xs text-blue-300" />
                                </div>
                            ) : (
                                <div className="flex" title="Delivered">
                                    <IoCheckmark className="text-xs text-gray-300" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ChatMessage;
