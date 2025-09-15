import {
    BarChart,
    Bar,
    Rectangle,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";

const AttendanceChart = ({ schoolId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/attendance/stats", {
                    params: schoolId ? { school_id: schoolId } : {},
                });
                
                // French day names mapping
                const daysFr = [
                    "Dimanche",
                    "Lundi",
                    "Mardi",
                    "Mercredi",
                    "Jeudi",
                    "Vendredi",
                    "Samedi",
                ];
                
                // Map date to French day name and ensure proper sorting
                const mapped = response.data
                    .map((item) => {
                        const d = new Date(item.date);
                        return {
                            ...item,
                            day: daysFr[d.getDay()],
                            dateObj: d, // Keep original date for sorting
                        };
                    })
                    .sort((a, b) => a.dateObj - b.dateObj) // Sort chronologically
                    .map(({ dateObj, ...item }) => item); // Remove dateObj from final data
                
                setData(mapped);
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [schoolId]);

    return (
        <div className="bg-white rounded-lg p-4 h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">
                    Résumé hebdomadaire de la présence
                </h1>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">
                        Chargement des données de présence...
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">
                        Aucune donnée de présence disponible
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart width={500} height={300} data={data} barSize={20}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#ddd"
                        />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tick={{ fill: "#d1d5db" }}
                            tickLine={false}
                        />
                        <YAxis
                            axisLine={false}
                            tick={{ fill: "#d1d5db" }}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "10px",
                                borderColor: "lightgray",
                            }}
                        />
                        <Legend
                            align="left"
                            verticalAlign="top"
                            wrapperStyle={{
                                paddingTop: "20px",
                                paddingBottom: "40px",
                            }}
                        />
                        <Bar
                            dataKey="present"
                            name="Présent"
                            fill="#A0D8EF"
                            legendType="circle"
                            radius={[10, 10, 0, 0]}
                        />
                        <Bar
                            dataKey="absent"
                            name="Absent"
                            fill="#B39DDB"
                            legendType="circle"
                            radius={[10, 10, 0, 0]}
                        />
                        <Bar
                            dataKey="late"
                            name="En retard"
                            fill="#FFD54F"
                            legendType="circle"
                            radius={[10, 10, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default AttendanceChart;
