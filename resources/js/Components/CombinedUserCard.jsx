import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { UserPlus, UserX } from "lucide-react";



const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}/${(year + 1).toString().slice(-2)}`;
};

const CombinedUserCard = ({ stats }) => {
    const [open, setOpen] = useState(false);
    // Initialize with stats month if available, otherwise use current month
    const [studentStatsMonth, setStudentStatsMonth] = useState(() => {
        if (stats?.month) {
            return stats.month;
        }
        // Default to current month in YYYY-MM format
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });


    // Show stats (fallback to 0 if missing)
    const inscribed = stats?.inscribed ?? 0;
    const abandoned = stats?.abandoned ?? 0;

    // Handle filter changes
    const handleMonthChange = (newMonth) => {
        setStudentStatsMonth(newMonth);
        setOpen(false);
        // Preserve existing filters and add the new month filter
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('student_stats_month', newMonth);
        router.get(route("dashboard"), Object.fromEntries(currentParams), { 
            preserveState: true, 
            preserveScroll: true 
        });
    };

    return (
        <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px] relative cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-center">
                <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
                    {getCurrentSchoolYear()}
                </span>
                <button onClick={() => setOpen(!open)} className="ml-2 ">
                    <img src="/more.png" alt="filter" width={20} height={20} />
                </button>
            </div>
            <div className="my-2 flex flex-col gap-2">
                <div className="flex items-center gap-2  text-blue-500">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Inscrits:</span>
                    <span className="text-xl font-bold  text-blue-500">{inscribed}</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                    <UserX className="w-5 h-5 text-red-500" />
                    <span className="font-semibold">Abandons:</span>
                    <span className="text-xl font-bold text-red-500">{abandoned}</span>
                </div>
            </div>
            <h2 className="capitalize text-sm font-medium text-gray-500">Mouvement mensuel</h2>
            {/* Month filter input */}
            {open && (
                <div className="absolute top-8 right-2 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 p-2">
                    <div className="relative">
                        <svg
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <input
                            type="month"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            value={studentStatsMonth}
                            onChange={(e) => {
                                setStudentStatsMonth(e.target.value);
                                handleMonthChange(e.target.value);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombinedUserCard; 