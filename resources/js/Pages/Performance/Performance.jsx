import React, { useEffect, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Badge } from "@/Components/ui/badge";
import { ScrollArea } from "@/Components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Skeleton } from "@/Components/ui/skeleton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Performance = ({ auth }) => {
    const { props } = usePage();
    const { student, performance } = props;
    const [activeTab, setActiveTab] = useState("overview");

    if (!student || !performance) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-center h-64">
                                    <p className="text-gray-500">
                                        Loading performance data...
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const { totalScore, detailedData } = performance;
    const { academic, attendance, payment, membership } = detailedData;

    const renderScoreCard = (title, score, color) => (
        <Card className="w-full">
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

    const renderPieChart = () => {
        const data = [
            { name: "Academic", value: academic.score },
            { name: "Attendance", value: attendance.score },
            { name: "Payment", value: payment.score },
            { name: "Membership", value: membership.score },
        ];

        return (
            <div className="h-[300px]">
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
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                    <div className="text-3xl font-bold">
                        {totalScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Total Score</div>
                </div>
            </div>
        );
    };

    const renderAcademicDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {academic.recentResults.map(
                                        (result, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {result.subject}
                                                </TableCell>
                                                <TableCell>
                                                    {result.class}
                                                </TableCell>
                                                <TableCell>
                                                    {result.score}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            result.grade === "F"
                                                                ? "destructive"
                                                                : "default"
                                                        }
                                                    >
                                                        {result.grade}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        result.date,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subject Averages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Average</TableHead>
                                        <TableHead>Exams</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {academic.subjectAverages.map(
                                        (subject, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {subject.subject}
                                                </TableCell>
                                                <TableCell>
                                                    {subject.average.toFixed(1)}
                                                </TableCell>
                                                <TableCell>
                                                    {subject.count}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderAttendanceDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.recentAttendance.map(
                                        (record, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {new Date(
                                                        record.date,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            record.status ===
                                                            "present"
                                                                ? "default"
                                                                : "destructive"
                                                        }
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.class}
                                                </TableCell>
                                                <TableCell>
                                                    {record.recordedBy}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.monthlyStats.map(
                                        (stat, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {stat.month}
                                                </TableCell>
                                                <TableCell>
                                                    {stat.present}
                                                </TableCell>
                                                <TableCell>
                                                    {stat.total}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            stat.rate >= 80
                                                                ? "default"
                                                                : "destructive"
                                                        }
                                                    >
                                                        {stat.rate}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderPaymentDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Offer</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payment.recentPayments.map(
                                        (payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {new Date(
                                                        payment.date,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.paid.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            payment.status ===
                                                            "Paid"
                                                                ? "default"
                                                                : "warning"
                                                        }
                                                    >
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {payment.offer}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Invoices</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payment.paymentHistory.map(
                                        (history, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {history.month}
                                                </TableCell>
                                                <TableCell>
                                                    {history.total.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {history.paid.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {history.count}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderMembershipDetails = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Current Memberships</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Offer</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Teachers</TableHead>
                                    <TableHead>Total Paid</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membership.currentMemberships.map(
                                    (membership, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {membership.offer}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    membership.start_date,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    membership.end_date,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        membership.status ===
                                                        "paid"
                                                            ? "default"
                                                            : "warning"
                                                    }
                                                >
                                                    {membership.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {membership.teachers}
                                            </TableCell>
                                            <TableCell>
                                                {membership.total_paid.toFixed(
                                                    2,
                                                )}{" "}
                                                /{" "}
                                                {membership.total_amount.toFixed(
                                                    2,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Performance - ${student.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Performance Overview - {student.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {student.class} • {student.school} • {student.level}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {renderScoreCard(
                            "Academic Score",
                            academic.score,
                            COLORS[0],
                        )}
                        {renderScoreCard(
                            "Attendance Score",
                            attendance.score,
                            COLORS[1],
                        )}
                        {renderScoreCard(
                            "Payment Score",
                            payment.score,
                            COLORS[2],
                        )}
                        {renderScoreCard(
                            "Membership Score",
                            membership.score,
                            COLORS[3],
                        )}
                    </div>

                    <Card className="mb-6">
                        <CardContent className="p-6">
                            {renderPieChart()}
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="academic">Academic</TabsTrigger>
                            <TabsTrigger value="attendance">
                                Attendance
                            </TabsTrigger>
                            <TabsTrigger value="payment">Payment</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderAcademicDetails()}
                                {renderAttendanceDetails()}
                                {renderPaymentDetails()}
                                {renderMembershipDetails()}
                            </div>
                        </TabsContent>

                        <TabsContent value="academic" className="mt-4">
                            {renderAcademicDetails()}
                        </TabsContent>

                        <TabsContent value="attendance" className="mt-4">
                            {renderAttendanceDetails()}
                        </TabsContent>

                        <TabsContent value="payment" className="mt-4">
                            {renderPaymentDetails()}
                            {renderMembershipDetails()}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Performance;
