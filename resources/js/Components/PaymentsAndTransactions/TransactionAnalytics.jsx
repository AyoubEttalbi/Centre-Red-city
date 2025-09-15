import React, { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
);

const TransactionAnalytics = ({ transactions }) => {
    const analytics = useMemo(() => {
        if (
            !transactions ||
            !transactions.data ||
            transactions.data.length === 0
        ) {
            return {
                totalIncome: 0,
                totalExpense: 0,
                netBalance: 0,
                monthlyData: [],
                typeDistribution: {
                    labels: [],
                    data: [],
                    backgroundColor: [],
                },
            };
        }

        let totalIncome = 0;
        let totalExpense = 0;

        const monthsMap = {};

        const typeCount = {
            salary: 0,
            wallet: 0,
            expense: 0,
        };

        transactions.data.forEach((transaction) => {
            if (transaction.type === "expense") {
                totalExpense += parseFloat(transaction.amount);
            } else {
                totalIncome += parseFloat(transaction.amount);
            }

            typeCount[transaction.type] =
                (typeCount[transaction.type] || 0) + 1;

            const date = new Date(transaction.payment_date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!monthsMap[monthYear]) {
                monthsMap[monthYear] = {
                    income: 0,
                    expense: 0,
                };
            }

            if (transaction.type === "expense") {
                monthsMap[monthYear].expense += parseFloat(transaction.amount);
            } else {
                monthsMap[monthYear].income += parseFloat(transaction.amount);
            }
        });

        const sortedMonths = Object.keys(monthsMap).sort((a, b) => {
            const [aMonth, aYear] = a.split("/").map(Number);
            const [bMonth, bYear] = b.split("/").map(Number);

            if (aYear !== bYear) return aYear - bYear;
            return aMonth - bMonth;
        });

        const monthlyData = {
            labels: sortedMonths.map((month) => {
                const [m, y] = month.split("/");
                return `${["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"][m - 1]} ${y}`;
            }),
            datasets: [
                {
                    label: "Revenu",
                    data: sortedMonths.map((month) => monthsMap[month].income),
                    backgroundColor: "rgba(34, 197, 94, 0.5)",
                    borderColor: "rgb(34, 197, 94)",
                    borderWidth: 1,
                },
                {
                    label: "Dépense",
                    data: sortedMonths.map((month) => monthsMap[month].expense),
                    backgroundColor: "rgba(239, 68, 68, 0.5)",
                    borderColor: "rgb(239, 68, 68)",
                    borderWidth: 1,
                },
            ],
        };

        const typeLabels = Object.keys(typeCount).filter(
            (type) => typeCount[type] > 0,
        );
        const typeData = typeLabels.map((type) => typeCount[type]);
        const typeColors = {
            salary: "rgb(34, 197, 94)",
            wallet: "rgb(59, 130, 246)",
            expense: "rgb(239, 68, 68)",
        };
        const typeBackgroundColors = typeLabels.map((type) => typeColors[type]);

        const typeDistribution = {
            labels: typeLabels.map(
                (type) => type.charAt(0).toUpperCase() + type.slice(1),
            ),
            data: typeData,
            backgroundColor: typeBackgroundColors,
        };

        return {
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            monthlyData,
            typeDistribution,
        };
    }, [transactions]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Vue d'ensemble financière
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Revenu total
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics.totalIncome)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Dépenses totales
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(analytics.totalExpense)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Solde net
                    </h3>
                    <p
                        className={`text-2xl font-bold ${analytics.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                        {formatCurrency(analytics.netBalance)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">
                        Revenu mensuel vs Dépense
                    </h3>
                    {analytics.monthlyData.labels &&
                    analytics.monthlyData.labels.length > 0 ? (
                        <Chart
                            type="bar"
                            data={analytics.monthlyData}
                            options={{
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                    },
                                },
                                plugins: {
                                    legend: {
                                        position: "top",
                                    },
                                },
                            }}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Pas assez de données pour afficher le graphique
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">
                        Types de transactions
                    </h3>
                    {analytics.typeDistribution.labels &&
                    analytics.typeDistribution.labels.length > 0 ? (
                        <Chart
                            type="doughnut"
                            data={{
                                labels: analytics.typeDistribution.labels,
                                datasets: [
                                    {
                                        data: analytics.typeDistribution.data,
                                        backgroundColor:
                                            analytics.typeDistribution
                                                .backgroundColor,
                                        borderWidth: 1,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: "right",
                                    },
                                },
                            }}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Pas assez de données pour afficher le graphique
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionAnalytics;
