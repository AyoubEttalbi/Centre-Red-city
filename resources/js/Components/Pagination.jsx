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
    if (!links || links.length <= 3) return null;

    // Responsive: show fewer page numbers on small screens
    // Always show first, prev, current, next, last, and ellipsis if needed
    const getVisibleLinks = () => {
        if (window.innerWidth >= 640) return links; // sm and up: show all
        // mobile: show first, prev, current, next, last, and ellipsis
        const currentIdx = links.findIndex((l) => l.active);
        const result = [];
        for (let i = 0; i < links.length; i++) {
            if (
                i === 0 || // first
                i === links.length - 1 || // last
                i === currentIdx || // current
                i === currentIdx - 1 || // prev
                i === currentIdx + 1 // next
            ) {
                result.push({ ...links[i], _show: true });
            } else if (
                (i === 1 && currentIdx > 3) ||
                (i === links.length - 2 && currentIdx < links.length - 4)
            ) {
                // ellipsis after first or before last
                result.push({ label: '...', url: null, _show: true });
            } else {
                result.push({ ...links[i], _show: false });
            }
        }
        // Remove consecutive hidden
        return result.filter((l, idx, arr) => l._show);
    };

    const visibleLinks = typeof window !== 'undefined' ? getVisibleLinks() : links;

    return (
        <div className="mt-6 overflow-x-auto w-full">
            <div className="flex justify-center items-center gap-1 flex-nowrap min-w-[320px] sm:space-x-1">
                {visibleLinks.map((link, index) => {
                    if (!link.url) {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-3 py-1 text-gray-500 select-none"
                            >
                                ...
                            </span>
                        );
                    }
                    const href =
                        Object.keys(filters).length > 0
                            ? addFiltersToUrl(link.url, filters)
                            : link.url;
                    return (
                        <Link
                            key={index}
                            href={href}
                            className={`min-w-[36px] px-2 sm:px-3 py-2 sm:py-1 rounded-md text-base sm:text-sm font-medium transition-colors duration-200 ease-in-out text-center ${
                                link.active
                                    ? "bg-lamaPurple text-white"
                                    : "text-gray-700 hover:bg-gray-200"
                            } ${
                                !link.url ? "text-gray-400 cursor-not-allowed" : ""
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            preserveScroll
                            preserveState
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Pagination;
