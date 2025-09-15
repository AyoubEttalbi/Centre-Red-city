import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MostSellingOffersChart = ({ mostSellingOffers = [], schoolId }) => {
    // Filter data by school_id if provided
    const filteredData =
        schoolId && schoolId !== 'all'
            ? mostSellingOffers.filter((item) => String(item.school_id) === String(schoolId))
            : mostSellingOffers;

    return (
        <div className="bg-white rounded-xl w-full h-[400px] p-4">
            <h1 className="text-lg font-semibold mb-4">Offres les plus vendues</h1>
            {filteredData.length === 0 ? (
                <div className="text-center text-gray-400 mt-16">Aucune donnée disponible</div>
            ) : (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="student_count" fill="#C3EBFA" name="Élèves" />
                        <Bar dataKey="total_price" fill="#CFCEFF" name="Prix total" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MostSellingOffersChart;
