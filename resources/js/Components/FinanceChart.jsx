import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { usePage } from "@inertiajs/react";
import React from "react";

const FinanceChart = ({ schoolId }) => {
    const { props } = usePage();
    
    // French month names mapping
    const frenchMonths = {
        'January': 'Janvier',
        'February': 'Février',
        'March': 'Mars',
        'April': 'Avril',
        'May': 'Mai',
        'June': 'Juin',
        'July': 'Juillet',
        'August': 'Août',
        'September': 'Septembre',
        'October': 'Octobre',
        'November': 'Novembre',
        'December': 'Décembre'
    };

    // Function to convert month names to French
    const convertMonthToFrench = (monthYearString) => {
        if (!monthYearString) return monthYearString;
        
        // Extract month and year from "Month Year" format
        const parts = monthYearString.split(' ');
        if (parts.length === 2) {
            const month = parts[0];
            const year = parts[1];
            const frenchMonth = frenchMonths[month];
            
            if (frenchMonth) {
                return `${frenchMonth} ${year}`;
            }
        }
        
        return monthYearString;
    };

    // Function to parse month year string to Date object for sorting
    const parseMonthYear = (monthYearString) => {
        if (!monthYearString) return new Date(0);
        
        const parts = monthYearString.split(' ');
        if (parts.length === 2) {
            const month = parts[0];
            const year = parseInt(parts[1]);
            
            // Create a mapping for month names to month numbers
            const monthNumbers = {
                'January': 0, 'Janvier': 0,
                'February': 1, 'Février': 1,
                'March': 2, 'Mars': 2,
                'April': 3, 'Avril': 3,
                'May': 4, 'Mai': 4,
                'June': 5, 'Juin': 5,
                'July': 6, 'Juillet': 6,
                'August': 7, 'Août': 7,
                'September': 8, 'Septembre': 8,
                'October': 9, 'Octobre': 9,
                'November': 10, 'Novembre': 10,
                'December': 11, 'Décembre': 11
            };
            
            const monthNumber = monthNumbers[month];
            if (monthNumber !== undefined && !isNaN(year)) {
                return new Date(year, monthNumber, 1);
            }
        }
        
        return new Date(0);
    };

    // Filter data by school_id, aggregate by month, and convert month names to French
    const filteredData = React.useMemo(() => {
        if (!props.monthlyIncomes || !Array.isArray(props.monthlyIncomes)) {
            console.warn('monthlyIncomes data is not available or not an array');
            return [];
        }

        const filtered = !schoolId || schoolId === "all"
            ? props.monthlyIncomes
            : props.monthlyIncomes.filter(
                  (income) => String(income.school_id) === String(schoolId)
              );

        // Aggregate data by month and year
        const aggregatedData = {};
        
        filtered.forEach(item => {
            const monthYear = item.name;
            if (!monthYear) return;
            
            if (!aggregatedData[monthYear]) {
                aggregatedData[monthYear] = {
                    name: monthYear,
                    income: 0,
                    expense: 0
                };
            }
            
            // Sum up income and expense for the same month
            aggregatedData[monthYear].income += parseFloat(item.income || 0);
            aggregatedData[monthYear].expense += parseFloat(item.expense || 0);
        });

        // Convert to array and sort chronologically
        const sortedData = Object.values(aggregatedData)
            .sort((a, b) => parseMonthYear(a.name) - parseMonthYear(b.name))
            .map(item => ({
                ...item,
                name: convertMonthToFrench(item.name)
            }));

        return sortedData;
    }, [props.monthlyIncomes, schoolId]);

    // Don't render if no data
    if (!filteredData || filteredData.length === 0) {
        return (
            <div className="bg-white rounded-xl w-full h-full p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-semibold">Finance</h1>
                </div>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    Aucune donnée financière disponible
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl w-full h-full p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">Finance</h1>
            </div>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart
                    width={500}
                    height={300}
                    data={filteredData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tick={{ fill: "#d1d5db" }}
                        tickLine={false}
                        tickMargin={10}
                    />
                    <YAxis
                        axisLine={false}
                        tick={{ fill: "#d1d5db" }}
                        tickLine={false}
                        tickMargin={20}
                    />
                    <Tooltip />
                    <Legend
                        align="center"
                        verticalAlign="top"
                        wrapperStyle={{
                            paddingTop: "10px",
                            paddingBottom: "30px",
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#C3EBFA"
                        strokeWidth={5}
                    />
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#CFCEFF"
                        strokeWidth={5}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FinanceChart;
