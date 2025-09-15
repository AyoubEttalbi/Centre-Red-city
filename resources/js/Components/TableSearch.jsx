import { router, usePage } from "@inertiajs/react";
import { useState } from "react";

const TableSearch = ({ routeName, filters, value, onChange }) => {
    const pageProps = usePage().props;
    const [searchTerm, setSearchTerm] = useState(
        value !== undefined ? value : pageProps.filters?.search || ""
    );

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const handleSearch = (e) => {
        const value = e.target.value.trim(); // Trim leading/trailing spaces
        setSearchTerm(value);
        if (onChange) {
            onChange(value);
        } else {
            // Only include date for attendances.index
            const params = {
                ...pageProps.filters,
                search: value,
            };
            if (routeName === "attendances.index") {
                params.date = pageProps.filters?.date || today;
            } else {
                delete params.date;
            }
            router.get(
                route(routeName),
                params,
            { preserveState: true, replace: true, preserveScroll: true },
        );
        }
    };

    const handleDateChange = (selectedDate) => {
        // Validate date selection
        const finalDate = selectedDate > today ? today : selectedDate;

        if (selectedDate !== finalDate) {
            alert("Cannot select future dates. Showing today's attendance.");
        }

        router.get(
            route("attendances.index"),
            {
                ...filters,
                date: finalDate,
                search: searchTerm,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
                <img src="/search.png" alt="" width={14} height={14} />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-[200px] p-2 bg-transparent outline-none border-none focus:ring-0"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {routeName === "attendances.index" && (
                <input
                    type="date"
                    min={"2025-01-01"}
                    max={today} // Native HTML attribute to restrict future dates
                    value={filters.date || today}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full md:w-auto flex items-center outline-none border-none focus:ring-0 gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 py-3"
                />
            )}
        </>
    );
};

export default TableSearch;
