import { Link } from "@inertiajs/react";
import React from "react";

// Helper function to add current filters to pagination links
const addFiltersToUrl = (url, filters) => {
    if (!url) return "#"; // Return a safe default if URL is null or undefined
    try {
        const urlObject = new URL(url);
        Object.keys(filters).forEach((key) => {
            if (filters[key]) {
                // Only add filter if it has a value
                urlObject.searchParams.set(key, filters[key]);
            }
        });
        return urlObject.toString();
    } catch (error) {
        // Log the error and return a safe default if URL parsing fails
        console.error(`Invalid URL encountered in pagination: ${url}`, error);
        return "#";
    }
};

const Pagination = ({ links = [], filters = {} }) => {
    if (!links || links.length <= 3) return null; // Don't render if only prev, current, next

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

                // Determine the URL, adding filters if necessary
                const href =
                    Object.keys(filters).length > 0
                        ? addFiltersToUrl(link.url, filters)
                        : link.url;

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

export default Pagination;
