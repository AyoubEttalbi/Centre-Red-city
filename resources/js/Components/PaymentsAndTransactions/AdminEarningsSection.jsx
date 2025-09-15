import React, { useState, useMemo, useEffect } from "react";
import FinancialSummaryCards from "./FinancialSummaryCards";
import EarningsChart from "./EarningsChart";
import { calculateChange, formatCurrency } from "./Utils";

const AdminEarningsSection = ({ adminEarnings }) => {
    const earningsData = Array.isArray(adminEarnings?.earnings)
        ? adminEarnings.earnings
        : [];
    const yearlyTotals =
        typeof adminEarnings?.yearlyTotals === "object" &&
        adminEarnings.yearlyTotals !== null
            ? adminEarnings.yearlyTotals
            : {};
    const yearlyMonthlyTotals =
        typeof adminEarnings?.yearlyMonthlyTotals === "object" &&
        adminEarnings.yearlyMonthlyTotals !== null
            ? adminEarnings.yearlyMonthlyTotals
            : {};
    const debugInfo = adminEarnings?.debug || {};

    const [viewMode, setViewMode] = useState("monthly");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [visualizationType, setVisualizationType] = useState("bar");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [showTrend, setShowTrend] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Remove all console.log debug statements
    }, [adminEarnings]);

    const availableYears = useMemo(() => {
        const years = [
            ...new Set(earningsData.map((item) => Number(item.year))),
        ];
        return years.sort((a, b) => b - a);
    }, [earningsData]);

    useEffect(() => {
        if (earningsData.length > 0 && availableYears.length > 0) {
            setSelectedYear(availableYears[0]);
        }
    }, [earningsData, availableYears]);

    const monthOrder = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
    ];

    const sortByMonth = (a, b) => {
        const monthOrderA = monthOrder.indexOf(a.monthName);
        const monthOrderB = monthOrder.indexOf(b.monthName);
        return monthOrderA - monthOrderB;
    };

    const filteredEarnings = useMemo(() => {
        return earningsData
            .filter((item) => Number(item.year) === selectedYear)
            .sort(sortByMonth);
    }, [earningsData, selectedYear]);

    const previousYearEarnings = useMemo(() => {
        return earningsData
            .filter((item) => Number(item.year) === selectedYear - 1)
            .sort(sortByMonth);
    }, [earningsData, selectedYear]);

    const paginatedEarnings = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredEarnings.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEarnings, page, itemsPerPage]);

    const {
        chartData,
        yearlyData,
        totalRevenue,
        totalExpenses,
        totalProfit,
        revenueChange,
        expensesChange,
        profitChange,
        expenseBreakdown,
    } = useMemo(() => {
        const chartData = filteredEarnings.map((item) => ({
            name: item.monthName,
            revenue: Number(item.totalRevenue || 0),
            expenses: Number(item.totalExpenses || 0),
            profit: Number(item.profit || 0),
            prevYearRevenue:
                previousYearEarnings.find(
                    (prev) => prev.monthName === item.monthName,
                )?.totalRevenue || 0,
            prevYearProfit:
                previousYearEarnings.find(
                    (prev) => prev.monthName === item.monthName,
                )?.profit || 0,
        }));

        const quarterData = {};
        filteredEarnings.forEach((item) => {
            const monthIndex = monthOrder.indexOf(item.monthName);
            const quarter = Math.floor(monthIndex / 3) + 1;
            const quarterKey = `Q${quarter}`;

            if (!quarterData[quarterKey]) {
                quarterData[quarterKey] = {
                    name: quarterKey,
                    revenue: 0,
                    expenses: 0,
                    profit: 0,
                };
            }

            quarterData[quarterKey].revenue += Number(item.totalRevenue || 0);
            quarterData[quarterKey].expenses += Number(item.totalExpenses || 0);
            quarterData[quarterKey].profit += Number(item.profit || 0);
        });

        const yearlyData = Object.values(quarterData);

        const totalRevenue = filteredEarnings.reduce(
            (sum, item) => sum + Number(item.totalRevenue || 0),
            0,
        );
        const totalExpenses = filteredEarnings.reduce(
            (sum, item) => sum + Number(item.totalExpenses || 0),
            0,
        );
        const totalProfit = filteredEarnings.reduce(
            (sum, item) => sum + Number(item.profit || 0),
            0,
        );

        const prevYearRevenue = previousYearEarnings.reduce(
            (sum, item) => sum + Number(item.totalRevenue || 0),
            0,
        );
        const prevYearExpenses = previousYearEarnings.reduce(
            (sum, item) => sum + Number(item.totalExpenses || 0),
            0,
        );
        const prevYearProfit = previousYearEarnings.reduce(
            (sum, item) => sum + Number(item.profit || 0),
            0,
        );

        const revenueChange = calculateChange(totalRevenue, prevYearRevenue);
        const expensesChange = calculateChange(totalExpenses, prevYearExpenses);
        const profitChange = calculateChange(totalProfit, prevYearProfit);

        const expenseBreakdown = [
            { name: "Salaries", value: totalExpenses * 0.45 },
            { name: "Instructor Payments", value: totalExpenses * 0.25 },
            { name: "Operations", value: totalExpenses * 0.15 },
            { name: "Marketing", value: totalExpenses * 0.1 },
            { name: "Miscellaneous", value: totalExpenses * 0.05 },
        ];

        return {
            chartData,
            yearlyData,
            totalRevenue,
            totalExpenses,
            totalProfit,
            revenueChange,
            expensesChange,
            profitChange,
            expenseBreakdown,
        };
    }, [filteredEarnings, previousYearEarnings]);

    const totalPages = Math.ceil(filteredEarnings.length / itemsPerPage);

    const yearlyTotalRevenue = Number(yearlyTotals[selectedYear] || 0);

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            <FinancialSummaryCards
                totalRevenue={totalRevenue}
                totalExpenses={totalExpenses}
                totalProfit={totalProfit}
                revenueChange={revenueChange}
                expensesChange={expensesChange}
                profitChange={profitChange}
                yearlyTotalRevenue={yearlyTotalRevenue}
            />

            <EarningsChart
                viewMode={viewMode}
                visualizationType={visualizationType}
                chartData={chartData}
                yearlyData={yearlyData}
                showTrend={showTrend}
                selectedYear={selectedYear}
            />

            {viewMode === "monthly" && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Mois
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Revenus
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Dépenses
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Bénéfice
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Marge bénéficiaire
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedEarnings.map((item, index) => (
                                <tr
                                    key={index}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                    }
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.monthName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.totalExpenses)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.profit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {item.totalRevenue > 0
                                            ? (
                                                  (item.profit /
                                                      item.totalRevenue) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === "monthly" && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setPage(page > 1 ? page - 1 : 1)}
                            disabled={page === 1}
                            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                                page === 1
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() =>
                                setPage(
                                    page < totalPages ? page + 1 : totalPages,
                                )
                            }
                            disabled={page === totalPages}
                            className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                                page === totalPages
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Suivant
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Affichage{" "}
                                <span className="font-medium">
                                    {(page - 1) * itemsPerPage + 1}
                                </span>{" "}
                                à{" "}
                                <span className="font-medium">
                                    {Math.min(
                                        page * itemsPerPage,
                                        filteredEarnings.length,
                                    )}
                                </span>{" "}
                                sur{" "}
                                <span className="font-medium">
                                    {filteredEarnings.length}
                                </span>{" "}
                                mois
                            </p>
                        </div>
                        <div>
                            <nav
                                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                aria-label="Pagination"
                            >
                                <button
                                    onClick={() =>
                                        setPage(page > 1 ? page - 1 : 1)
                                    }
                                    disabled={page === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                                        page === 1
                                            ? "bg-gray-100 text-gray-400"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="sr-only">Précédent</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setPage(pageNumber)}
                                        aria-current={
                                            page === pageNumber
                                                ? "page"
                                                : undefined
                                        }
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            page === pageNumber
                                                ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                                <button
                                    onClick={() =>
                                        setPage(
                                            page < totalPages
                                                ? page + 1
                                                : totalPages,
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                                        page === totalPages
                                            ? "bg-gray-100 text-gray-400"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="sr-only">Suivant</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === "yearly" && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Trimestre
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Revenus
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Dépenses
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Bénéfice
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Marge bénéficiaire
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {yearlyData.map((item, index) => (
                                <tr
                                    key={index}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                    }
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.name} ({selectedYear})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.revenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.expenses)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatCurrency(item.profit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {item.revenue > 0
                                            ? (
                                                  (item.profit / item.revenue) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %
                                    </td>
                                </tr>
                            ))}

                            <tr className="bg-gray-100 font-medium">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    Total ({selectedYear})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatCurrency(totalRevenue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatCurrency(totalExpenses)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatCurrency(totalProfit)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {totalRevenue > 0
                                        ? (
                                              (totalProfit / totalRevenue) *
                                              100
                                          ).toFixed(1)
                                        : 0}
                                    %
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {previousYearEarnings.length > 0 && (
                <div className="mt-10 bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Comparaison année par année ({selectedYear} vs{" "}
                        {selectedYear - 1})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                                Croissance des revenus
                            </h4>
                            <div className="flex items-baseline">
                                <p className="text-xl font-bold mr-2">
                                    {revenueChange.percentage}%
                                </p>
                                <span
                                    className={`text-sm font-medium ${
                                        revenueChange.direction === "up"
                                            ? "text-green-600"
                                            : revenueChange.direction === "down"
                                              ? "text-red-600"
                                              : "text-gray-600"
                                    }`}
                                >
                                    {revenueChange.direction === "up"
                                        ? "↑"
                                        : revenueChange.direction === "down"
                                          ? "↓"
                                          : ""}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                                Croissance des dépenses
                            </h4>
                            <div className="flex items-baseline">
                                <p className="text-xl font-bold mr-2">
                                    {expensesChange.percentage}%
                                </p>
                                <span
                                    className={`text-sm font-medium ${
                                        expensesChange.direction === "up"
                                            ? "text-red-600"
                                            : expensesChange.direction ===
                                                "down"
                                              ? "text-green-600"
                                              : "text-gray-600"
                                    }`}
                                >
                                    {expensesChange.direction === "up"
                                        ? "↑"
                                        : expensesChange.direction === "down"
                                          ? "↓"
                                          : ""}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                                Croissance du bénéfice
                            </h4>
                            <div className="flex items-baseline">
                                <p className="text-xl font-bold mr-2">
                                    {profitChange.percentage}%
                                </p>
                                <span
                                    className={`text-sm font-medium ${
                                        profitChange.direction === "up"
                                            ? "text-green-600"
                                            : profitChange.direction === "down"
                                              ? "text-red-600"
                                              : "text-gray-600"
                                    }`}
                                >
                                    {profitChange.direction === "up"
                                        ? "↑"
                                        : profitChange.direction === "down"
                                          ? "↓"
                                          : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">
                                Comparaison des revenus
                            </h4>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600">
                                    {selectedYear}:
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-gray-600">
                                    {selectedYear - 1}:
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(
                                        previousYearEarnings.reduce(
                                            (sum, item) =>
                                                sum +
                                                Number(item.totalRevenue || 0),
                                            0,
                                        ),
                                    )}
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${revenueChange.direction === "up" ? "bg-green-600" : "bg-red-600"}`}
                                    style={{
                                        width: `${Math.min(100, Math.abs(revenueChange.percentage))}%`,
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">
                                Comparaison du bénéfice
                            </h4>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600">
                                    {selectedYear}:
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(totalProfit)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-gray-600">
                                    {selectedYear - 1}:
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(
                                        previousYearEarnings.reduce(
                                            (sum, item) =>
                                                sum + Number(item.profit || 0),
                                            0,
                                        ),
                                    )}
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${profitChange.direction === "up" ? "bg-green-600" : "bg-red-600"}`}
                                    style={{
                                        width: `${Math.min(100, Math.abs(profitChange.percentage))}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEarningsSection;
