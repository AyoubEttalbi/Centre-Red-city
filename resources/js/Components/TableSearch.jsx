import { router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

const TableSearch = ({ routeName, filters, value, onChange }) => {
  const pageProps = usePage().props;
  const [searchTerm, setSearchTerm] = useState(
    value ?? pageProps.filters?.search ?? ""
  );

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const delay = setTimeout(() => {
      const cleanedSearch = searchTerm.trim(); 

      if (onChange) {
        onChange(cleanedSearch);
      } else {
        const params = {
          ...pageProps.filters,
          search: cleanedSearch,
        };

        if (routeName === "attendances.index") {
          params.date = pageProps.filters?.date || today;
        } else {
          delete params.date;
        }

        router.get(route(routeName), params, {
          preserveState: true,
          replace: true,
          preserveScroll: true,
        });
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleDateChange = (selectedDate) => {
    const finalDate = selectedDate > today ? today : selectedDate;

    if (selectedDate !== finalDate) {
      alert("Cannot select future dates. Showing today's attendance.");
    }

    router.get(
      route("attendances.index"),
      {
        ...filters,
        date: finalDate,
        search: searchTerm.trim(), // ✅ Also trimmed here
      },
      { preserveState: true, replace: true }
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 items-center">
      {/* Search Input */}
      <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <img src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none border-none focus:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Date Filter for Attendance Page */}
      {routeName === "attendances.index" && (
        <input
          type="date"
          min="2025-01-01"
          max={today}
          value={filters.date || today}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full md:w-auto flex items-center outline-none border-none focus:ring-0 gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 py-3"
        />
      )}
    </div>
  );
};

export default TableSearch;
