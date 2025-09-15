import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const CountChart = ({ schoolId }) => {
    const {
        membershipStats = {
            paidCount: 0,
            unpaidCount: 0,
            month: "",
            error: null,
        },
    } = usePage().props;

   

    const {
        paidCount,
        unpaidCount,
        month: initialMonth,
        error,
    } = membershipStats;

    const [selectedMonth, setSelectedMonth] = useState(
        initialMonth || new Date().toISOString().slice(0, 7),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [animatedTotal, setAnimatedTotal] = useState(0);
    const [animatedPaid, setAnimatedPaid] = useState(0);
    const [animatedUnpaid, setAnimatedUnpaid] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const safePaid = Number.isFinite(paidCount) ? paidCount : 0;
    const safeUnpaid = Number.isFinite(unpaidCount) ? unpaidCount : 0;

    const total = safePaid + safeUnpaid;
    const paidPercent = total ? Math.round((safePaid / total) * 100) : 0;
    const unpaidPercent = 100 - paidPercent;

    // Ensure we always have data for the chart, even if it's zero
    const data = [
        {
            name: "Paid",
            count: safePaid,
            fill: "#A0D8EF",
        },
        {
            name: "Unpaid",
            count: safeUnpaid,
            fill: "#FFD54F",
        },
    ];

    // If no data, show a placeholder
    if (total === 0) {
        data.push({
            name: "No Data",
            count: 1,
            fill: "#E5E7EB",
        });
    }

    // Animation for numbers
    useEffect(() => {
        // Ensure chart is visible when data changes
        if (!isLoading) {
            setIsVisible(true);
        }

        const animateNumber = (start, end, setter, duration = 1000) => {
            const startTime = Date.now();
            const animate = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.round(
                    start + (end - start) * easeOutQuart,
                );
                setter(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        };

        // Reset and animate numbers
        setAnimatedTotal(0);
        setAnimatedPaid(0);
        setAnimatedUnpaid(0);

        const delay = 300; // Delay to sync with chart animation
        setTimeout(() => {
            animateNumber(0, total, setAnimatedTotal, 1200);
            animateNumber(0, safePaid, setAnimatedPaid, 1000);
            animateNumber(0, safeUnpaid, setAnimatedUnpaid, 1000);
        }, delay);
    }, [total, safePaid, safeUnpaid, isLoading]);

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
        setIsLoading(true);
        setIsVisible(false);

        router.get(
            route("dashboard"),
            { month: newMonth, school_id: schoolId },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsLoading(false);
                    // Ensure chart becomes visible after data loads
                    setTimeout(() => setIsVisible(true), 100);
                },
            },
        );
    };

    return (
        <div className="bg-none w-full h-full p-3 sm:p-6 shadow-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
                <h1
                    className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-100 
                       transform transition-all duration-500 ease-out
                       ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}"
                >
                    Membership Payments
                </h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                       text-xs sm:text-sm px-2 py-1 rounded-lg w-full sm:w-auto
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600"
                        max={new Date().toISOString().slice(0, 7)}
                        min={"2022-01"}
                    />
                    {isLoading && (
                        <div
                            className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 dark:border-white border-t-transparent 
                           transition-opacity duration-300"
                        />
                    )}
                </div>
            </div>

            {error ? (
                <div
                    className="text-red-500 text-center mt-4 transform transition-all duration-500 ease-out
                        animate-pulse"
                >
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                </div>
            ) : (
                <>
                    <div
                        className={`relative w-full h-[200px] sm:h-[240px] lg:h-[280px] 
                          transform transition-all duration-700 ease-out
                          ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
                    >
                        <ResponsiveContainer>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="35%"
                                outerRadius="95%"
                                barSize={20}
                                data={data}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    minAngle={15}
                                    background
                                    clockWise
                                    dataKey="count"
                                    cornerRadius={10}
                                    animationDuration={1500}
                                    animationBegin={200}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white 
                               transform transition-all duration-700 ease-out delay-300
                               ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-75"}`}
                            >
                                {animatedTotal}
                            </span>
                            <span
                                className={`text-xs sm:text-sm text-gray-500 dark:text-gray-300
                               transform transition-all duration-500 ease-out delay-500
                               ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                            >
                                Total Members
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-row xs:flex-row justify-center items-center gap-6 sm:gap-8 lg:gap-12 ">
                        <div
                            className={`flex flex-col items-center group cursor-default
                            transform transition-all duration-500 ease-out delay-700
                            hover:scale-110
                            ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
                        >
                            <div
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-lamaSky mb-1 
                             transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-200"
                            />
                            <span
                                className="text-sm sm:text-md font-semibold text-lamaSky 
                             transition-all duration-300 group-hover:text-blue-600"
                            >
                                {animatedPaid}
                            </span>
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 text-center
                             transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                            >
                                Paid ({paidPercent}%)
                            </span>
                        </div>

                        <div
                            className={`flex flex-col items-center group cursor-default
                            transform transition-all duration-500 ease-out delay-800
                            hover:scale-110
                            ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
                        >
                            <div
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-lamaYellow mb-1 
                             transition-all duration-300 group-hover:shadow-lg group-hover:shadow-yellow-200"
                            />
                            <span
                                className="text-sm sm:text-md font-semibold text-lamaYellow 
                             transition-all duration-300 group-hover:text-yellow-600"
                            >
                                {animatedUnpaid}
                            </span>
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 text-center
                             transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                            >
                                Unpaid ({unpaidPercent}%)
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CountChart;
