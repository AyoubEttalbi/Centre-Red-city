import React from "react";

// Avatar Component
const Avatar = ({ src, status, size = "md" }) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };

    const statusColors = {
        online: "bg-green-500",
        away: "bg-yellow-500",
        offline: "bg-gray-400",
        busy: "bg-red-500",
    };

    return (
        <div className="relative">
            {src ? (
                <img
                    src={src}
                    alt="avatar"
                    className={`rounded-full ${sizeClasses[size]} object-cover border border-gray-200`}
                />
            ) : (
                <div
                    className={`rounded-full ${sizeClasses[size]} bg-gray-300 flex items-center justify-center border border-gray-200`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-500"
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
                </div>
            )}
            {status && (
                <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColors[status]} rounded-full border-2 border-white`}
                ></span>
            )}
        </div>
    );
};
export default Avatar;
