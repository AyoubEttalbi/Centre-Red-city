import { Link } from "@inertiajs/react";
import React from "react";

const TeacherInvoicesPagination = ({ links = [] }) => {
    if (!links || links.length <= 1) return null; // Don't render if no links or only one link

    return (
        <div className="mt-6 flex justify-center items-center space-x-1">
            {links.map((link, index) => {
                // Skip rendering if the link URL is null (often for '...')
                if (!link.url) {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-3 py-1 text-gray-500"
                        >
                            ...
                        </span>
                    );
                }

                // Use the URL directly since it already contains the filters
                const href = link.url;

                return (
                    <Link
                        key={index}
                        href={href}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${
                            link.active
                                ? "bg-lamaPurple text-white"
                                : "text-gray-700 hover:bg-gray-200"
                        } ${
                            !link.url ? "text-gray-400 cursor-not-allowed" : ""
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        preserveScroll
                        preserveState // Keep component state (like filters) when paginating
                    />
                );
            })}
        </div>
    );
};

export default TeacherInvoicesPagination;
