import React from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "./Utils";

const EarningsChart = ({
    viewMode,
    visualizationType,
    chartData,
    yearlyData,
    showTrend,
    selectedYear,
}) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-lg rounded-md border border-gray-200">
                    <p className="font-medium text-gray-900">{label}</p>
                    {payload.map((entry, index) => (
                        <p
                            key={index}
                            style={{ color: entry.color }}
                            className="text-sm"
                        >
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    const ComparisonTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-lg rounded-md border border-gray-200">
                    <p className="font-medium text-gray-900">{label}</p>
                    {payload.map((entry, index) => (
                        <p
                            key={index}
                            style={{ color: entry.color }}
                            className="text-sm"
                        >
                            {entry.name === "revenue"
                                ? "Revenu actuel : "
                                : "Bénéfice actuel : "}
                            {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
                {viewMode === "monthly"
                    ? `Tendance de performance mensuelle (${selectedYear})`
                    : `Tendance de performance trimestrielle (${selectedYear})`}
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {visualizationType === "bar" ? (
                        <BarChart
                            data={
                                viewMode === "monthly" ? chartData : yearlyData
                            }
                            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                            barGap={8}
                            barSize={24}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                content={
                                    showTrend ? (
                                        <ComparisonTooltip />
                                    ) : (
                                        <CustomTooltip />
                                    )
                                }
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: 20 }}
                            />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="expenses"
                                name="Expenses"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="profit"
                                name="Profit"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                            />
                            {showTrend && (
                                <>
                                    <Bar
                                        dataKey="prevYearRevenue"
                                        name="Previous Year Revenue"
                                        fill="#93c5fd"
                                        radius={[4, 4, 0, 0]}
                                        stackId="2"
                                    />
                                    <Bar
                                        dataKey="prevYearProfit"
                                        name="Previous Year Profit"
                                        fill="#6ee7b7"
                                        radius={[4, 4, 0, 0]}
                                        stackId="2"
                                    />
                                </>
                            )}
                        </BarChart>
                    ) : (
                        <LineChart
                            data={
                                viewMode === "monthly" ? chartData : yearlyData
                            }
                            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                content={
                                    showTrend ? (
                                        <ComparisonTooltip />
                                    ) : (
                                        <CustomTooltip />
                                    )
                                }
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: 20 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#3b82f6" }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                name="Expenses"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#ef4444" }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="Profit"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#10b981" }}
                                activeDot={{ r: 6 }}
                            />
                            {showTrend && (
                                <>
                                    <Line
                                        type="monotone"
                                        dataKey="prevYearRevenue"
                                        name="Previous Year Revenue"
                                        stroke="#93c5fd"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, fill: "#93c5fd" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="prevYearProfit"
                                        name="Previous Year Profit"
                                        stroke="#6ee7b7"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, fill: "#6ee7b7" }}
                                    />
                                </>
                            )}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EarningsChart;
