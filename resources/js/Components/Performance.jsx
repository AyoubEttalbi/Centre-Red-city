import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Performance = ({ student }) => {
    // Helper function to get current academic year period
    const getCurrentAcademicYear = () => {
        const now = new Date();
        const month = now.getMonth() + 1; // JavaScript months are 0-based
        const year = now.getFullYear();

        // If current month is before August, we're in the previous academic year
        if (month < 8) {
            return {
                start: new Date(year - 1, 7, 1), // August 1st of previous year
                end: new Date(year, 7, 31), // July 31st of current year
            };
        } else {
            return {
                start: new Date(year, 7, 1), // August 1st of current year
                end: new Date(year + 1, 7, 31), // July 31st of next year
            };
        }
    };

    // Helper function to check if a date is within current academic year
    const isInCurrentAcademicYear = (date) => {
        if (!date) return false;

        const academicYear = getCurrentAcademicYear();
        const checkDate = new Date(date);

        return checkDate >= academicYear.start && checkDate <= academicYear.end;
    };

    // Calculate academic score based on results
    const calculateAcademicScore = () => {
        if (!student?.results || !Array.isArray(student.results) || student.results.length === 0) {
            return 0;
        }
        const resultsWithGrades = student.results.filter((result) =>
            result?.final_grade !== undefined && result?.final_grade !== null
        );
        if (resultsWithGrades.length === 0) {
            return 0;
        }
        const validResults = resultsWithGrades.map((result) => ({
            ...result,
            final_grade: parseFloat(result.final_grade) || 0,
        }));
        const totalScore = validResults.reduce(
            (sum, result) => sum + result.final_grade,
            0,
        );
        const averageScore = totalScore / validResults.length;
        return (averageScore / 20) * 10; // Convert to 0-10 scale
    };

    // Calculate attendance score
    const calculateAttendanceScore = () => {
        if (!student?.attendances || !Array.isArray(student.attendances)) {
            return 10; // Return 10 if no attendance records (all days assumed present)
        }
        const validAttendances = student.attendances
            .filter(
                (attendance) =>
                    attendance?.status &&
                    typeof attendance.status === "string" &&
                    isInCurrentAcademicYear(attendance.date),
            )
            .map((attendance) => ({
                ...attendance,
                status: attendance.status.toLowerCase(),
                date: new Date(attendance.date),
            }));
        if (validAttendances.length === 0) {
            return 10;
        }
        const absentDays = validAttendances.filter((a) => a.status === "absent").length;
        const lateDays = validAttendances.filter((a) => a.status === "late").length;
        const deductions = absentDays * 0.5 + lateDays * 0.25;
        return Math.max(0, 10 - deductions);
    };

    // Calculate payment score based on memberships
    const calculatePaymentScore = () => {
        if (!student?.memberships || !Array.isArray(student.memberships)) {
            return 0;
        }
        const validMemberships = student.memberships.filter(
            (m) =>
                m?.payment_status &&
                typeof m.payment_status === "string" &&
                m?.created_at &&
                isInCurrentAcademicYear(m.created_at),
        );
        if (validMemberships.length === 0) {
            return 0;
        }
        const totalMemberships = validMemberships.length;
        const paidMemberships = validMemberships.filter(
            (m) => m.payment_status === "paid",
        ).length;
        const paymentRate = (paidMemberships / totalMemberships) * 100;
        return (paymentRate / 100) * 10;
    };

    // Calculate total score
    const calculateTotalScore = () => {
        const academicScore = calculateAcademicScore();
        const attendanceScore = calculateAttendanceScore();
        const paymentScore = calculatePaymentScore();
        return (
            academicScore * 0.4 + // 40% weight
            attendanceScore * 0.4 + // 40% weight
            paymentScore * 0.2 // 20% weight
        );
    };

    const academicScore = calculateAcademicScore();
    const attendanceScore = calculateAttendanceScore();
    const paymentScore = calculatePaymentScore();
    const totalScore = calculateTotalScore();

    const renderScoreCard = (title, score, color) => (
        <Card className="w-full -mb-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold" style={{ color }}>
                    {score.toFixed(1)}/10
                </div>
            </CardContent>
        </Card>
    );

    const data = [
        { name: "Académique", value: academicScore },
        { name: "Présence", value: attendanceScore },
        { name: "Paiement", value: paymentScore },
    ];

    return (
        <div className="space-y-6 pb-10 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderScoreCard("Score académique", academicScore, COLORS[0])}
                {renderScoreCard(
                    "Score de présence",
                    attendanceScore,
                    COLORS[1],
                )}
                {renderScoreCard("Score de paiement", paymentScore, COLORS[2])}
            </div>

            <Card>
                <CardHeader className="-mb-12">
                    <CardTitle>Vue d'ensemble de la performance</CardTitle>
                </CardHeader>
                <CardContent className="pb-20">
                    <div className="h-[300px] ">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [
                                        `${value.toFixed(1)}/10`,
                                        "Score",
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-center ">
                            <div className="text-3xl font-bold">
                                {totalScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500">
                                Score total
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Performance;
