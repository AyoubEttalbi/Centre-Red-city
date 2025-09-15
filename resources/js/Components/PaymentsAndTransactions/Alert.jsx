import React, { useState, useEffect } from "react";

const Alert = ({
    type = "success",
    message,
    className = "",
    duration = 5000,
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    if (!visible) return null;

    const styles = {
        success: "bg-green-50 text-green-800 border-green-200",
        error: "bg-red-50 text-red-800 border-red-200",
        warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
        info: "bg-blue-50 text-blue-800 border-blue-200",
    };

    const icons = {
        success: (
            <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        error: (
            <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        warning: (
            <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 7a1 1 0 01-1 1 1 1 0 110-2 1 1 0 011 1zm0 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        info: (
            <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-5a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    };

    return (
        <div
            className={`rounded-md border p-4 ${styles[type]} ${className}`}
            role="alert"
        >
            <div className="flex">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            onClick={() => setVisible(false)}
                            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                type === "success"
                                    ? "text-green-500 hover:bg-green-100 focus:ring-green-600"
                                    : type === "error"
                                      ? "text-red-500 hover:bg-red-100 focus:ring-red-600"
                                      : type === "warning"
                                        ? "text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600"
                                        : "text-blue-500 hover:bg-blue-100 focus:ring-blue-600"
                            }`}
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alert;
