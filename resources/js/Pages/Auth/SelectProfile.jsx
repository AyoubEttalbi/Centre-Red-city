import { useForm, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";

// Background component that resembles the teacher profile page with dashboard layout
const AppBackground = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Side Menu */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Top Header */}
                <div className="bg-white shadow-sm z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="flex-shrink-0 flex items-center md:hidden">
                                    <span className="text-lamaSky font-bold text-xl">
                                        Centre Red city
                                    </span>
                                </div>
                                <div className="hidden md:ml-6 md:flex md:space-x-8">
                                    <div className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                        Dashboard
                                    </div>
                                    <div className="border-b-2 border-lamaSky text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                        Teachers
                                    </div>
                                    <div className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                        Students
                                    </div>
                                    <div className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                        Classes
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="bg-gray-100 p-1 rounded-full text-gray-500">
                                    <div className="h-8 w-8 rounded-full bg-lamaSky/20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Teacher Profile */}
                <div className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* School Selection Banner */}
                            <div className="w-full mb-4 p-3 bg-lamaSkyLight border border-lamaSky/20 rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-lamaSky"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.666 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">
                                            Current School
                                        </div>
                                        <span className="font-medium">
                                            Al-Noor Academy
                                        </span>
                                    </div>
                                </div>
                                <button className="text-sm px-3 py-1 flex items-center gap-1 bg-lamaSky text-white rounded-md hover:bg-lamaSky/90 transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4"
                                        />
                                    </svg>
                                    Change School
                                </button>
                            </div>

                            <div className="flex flex-col gap-6 md:flex-row">
                                {/* Left Column */}
                                <div className="w-full md:w-8/12">
                                    {/* Teacher Profile Card */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
                                        <div className="bg-gradient-to-r from-lamaSky to-lamaSky/80 p-6 flex flex-col md:flex-row items-center md:items-start text-white">
                                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex-shrink-0 border-4 border-white shadow-md mb-4 md:mb-0 md:mr-6">
                                                <img
                                                    className="w-full h-full rounded-full object-cover"
                                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                                                    alt="Teacher profile"
                                                />
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <h2 className="text-2xl font-bold">
                                                    Sarah Johnson
                                                </h2>
                                                <p className="text-white/80">
                                                    Mathematics Teacher
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                                        Algebra
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                                        Calculus
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                                        Geometry
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                                        Grade 10
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex flex-col gap-2 ml-6">
                                                <button className="px-3 py-1 bg-white text-lamaSky rounded-md text-sm font-medium">
                                                    View Profile
                                                </button>
                                                <button className="px-3 py-1 bg-white/20 text-white rounded-md text-sm">
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-gray-700 font-medium mb-2">
                                                About
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                Mathematics teacher with over 10
                                                years of experience. Specializes
                                                in making complex concepts
                                                accessible to students at all
                                                levels. Passionate about
                                                fostering critical thinking
                                                skills and mathematical
                                                reasoning.
                                            </p>
                                            <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
                                                <div>
                                                    <p className="text-gray-500 text-sm">
                                                        Email
                                                    </p>
                                                    <p className="text-gray-700">
                                                        sarah.johnson@centreredcity.com
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm">
                                                        Phone
                                                    </p>
                                                    <p className="text-gray-700">
                                                        (555) 123-4567
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm">
                                                        Start Date
                                                    </p>
                                                    <p className="text-gray-700">
                                                        Sept 2018
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
                                        <div className="p-6 border-b border-gray-100">
                                            <h3 className="font-medium text-gray-800">
                                                Schedule
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-center p-2 mb-4">
                                                <button className="p-1 rounded text-gray-500 hover:bg-gray-100">
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 19l-7-7 7-7"
                                                        />
                                                    </svg>
                                                </button>
                                                <span className="font-medium">
                                                    September 2023
                                                </span>
                                                <button className="p-1 rounded text-gray-500 hover:bg-gray-100">
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-px bg-gray-200">
                                                {[
                                                    "S",
                                                    "M",
                                                    "T",
                                                    "W",
                                                    "T",
                                                    "F",
                                                    "S",
                                                ].map((day, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-gray-50 text-center py-2"
                                                    >
                                                        <span className="text-xs font-medium text-gray-500">
                                                            {day}
                                                        </span>
                                                    </div>
                                                ))}
                                                {Array.from({ length: 35 }).map(
                                                    (_, i) => (
                                                        <div
                                                            key={i + "cal"}
                                                            className="bg-white min-h-[60px] p-1 text-right relative"
                                                        >
                                                            <span className="text-xs text-gray-500">
                                                                {(i % 31) + 1}
                                                            </span>
                                                            {i === 10 && (
                                                                <div className="absolute bottom-1 left-1 right-1 bg-lamaSkyLight text-xs p-1 rounded text-gray-700">
                                                                    Algebra II
                                                                </div>
                                                            )}
                                                            {i === 18 && (
                                                                <div className="absolute bottom-1 left-1 right-1 bg-lamaPurpleLight text-xs p-1 rounded text-gray-700">
                                                                    Math Club
                                                                </div>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Invoices */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                                        <div className="p-6 border-b border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium text-gray-800">
                                                    Recent Invoices
                                                </h3>
                                                <button className="text-sm text-lamaSky hover:text-lamaSky/80">
                                                    View All
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            ID
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Amount
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {[
                                                        {
                                                            id: "INV-2023-004",
                                                            date: "Aug 15, 2023",
                                                            amount: "$1,200.00",
                                                            status: "Paid",
                                                        },
                                                        {
                                                            id: "INV-2023-003",
                                                            date: "Jul 15, 2023",
                                                            amount: "$1,200.00",
                                                            status: "Paid",
                                                        },
                                                        {
                                                            id: "INV-2023-002",
                                                            date: "Jun 15, 2023",
                                                            amount: "$1,150.00",
                                                            status: "Paid",
                                                        },
                                                    ].map((invoice, i) => (
                                                        <tr key={i}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {invoice.id}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {invoice.date}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {invoice.amount}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {
                                                                        invoice.status
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="w-full md:w-4/12">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">
                                                Classes
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                8
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">
                                                Students
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                187
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">
                                                Avg Grade
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                B+
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">
                                                Hours
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">
                                                26/week
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shortcuts */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
                                        <div className="p-6 border-b border-gray-100">
                                            <h3 className="font-medium text-gray-800">
                                                Shortcuts
                                            </h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-3">
                                            <a
                                                href="#"
                                                className="flex items-center p-3 bg-lamaSkyLight rounded-lg hover:bg-lamaSkyLight/80 transition-colors"
                                            >
                                                <svg
                                                    className="w-5 h-5 text-lamaSky mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                    />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Classes
                                                </span>
                                            </a>
                                            <a
                                                href="#"
                                                className="flex items-center p-3 bg-lamaPurpleLight rounded-lg hover:bg-lamaPurpleLight/80 transition-colors"
                                            >
                                                <svg
                                                    className="w-5 h-5 text-lamaPurple mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                                    />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Attendance
                                                </span>
                                            </a>
                                            <a
                                                href="#"
                                                className="flex items-center p-3 bg-lamaYellowLight rounded-lg hover:bg-lamaYellowLight/80 transition-colors"
                                            >
                                                <svg
                                                    className="w-5 h-5 text-lamaYellow mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Grades
                                                </span>
                                            </a>
                                            <a
                                                href="#"
                                                className="flex items-center p-3 bg-pink-50 rounded-lg hover:bg-pink-50/80 transition-colors"
                                            >
                                                <svg
                                                    className="w-5 h-5 text-pink-500 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Students
                                                </span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Performance */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
                                        <div className="p-6 border-b border-gray-100">
                                            <h3 className="font-medium text-gray-800">
                                                Performance
                                            </h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">
                                                        Attendance Rate
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        98%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-lamaSky h-2 rounded-full"
                                                        style={{ width: "98%" }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">
                                                        Student Satisfaction
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        85%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: "85%" }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">
                                                        Class Average
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        B (82%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-lamaPurple h-2 rounded-full"
                                                        style={{ width: "82%" }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Announcements */}
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                                        <div className="p-6 border-b border-gray-100">
                                            <h3 className="font-medium text-gray-800">
                                                Announcements
                                            </h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div className="p-3 bg-gray-50 rounded-md">
                                                <h4 className="font-medium text-gray-800 text-sm">
                                                    Parent-Teacher Conference
                                                </h4>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Scheduled for October 15th.
                                                    Please prepare student
                                                    progress reports by October
                                                    10th.
                                                </p>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Posted 2 days ago
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-md">
                                                <h4 className="font-medium text-gray-800 text-sm">
                                                    Staff Meeting
                                                </h4>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Monthly staff meeting on
                                                    Friday at 3:30 PM in the
                                                    conference room.
                                                </p>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Posted 5 days ago
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SelectProfile({ schools, isAdminInspection = false }) {
    const { props } = usePage();
    const { auth, flash } = props;
    const user = auth.user;

    const { data, setData, post, errors, processing } = useForm({
        school_id: "", // Initialize school_id
    });

    const [selectedSchoolName, setSelectedSchoolName] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingSchoolId, setPendingSchoolId] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route("profiles.store"), {
            preserveScroll: true,
            onSuccess: () => {
                // Reset local state if needed
                setSelectedSchoolName("");
                setShowConfirmation(false);
                // Inertia should redirect based on controller response
            },
            onError: (errors) => {
                // Handle errors, maybe show a notification
                setShowConfirmation(false);
            },
        });
    };

    const selectSchool = (schoolId) => {
        if (!schoolId) {
            setData("school_id", "");
            setSelectedSchoolName("");
            setShowConfirmation(false);
            return;
        }
        const school = schools.find(
            (s) => s.id.toString() === schoolId.toString(),
        );
        if (school) {
            setData("school_id", schoolId);
            setSelectedSchoolName(school.name);
            setPendingSchoolId(schoolId); // Store pending selection
            setShowConfirmation(true); // Show confirmation modal
        } else {
            console.error("Selected school not found in the list");
            setData("school_id", "");
            setSelectedSchoolName("");
            setShowConfirmation(false);
        }
    };

    const confirmSelection = () => {
        if (pendingSchoolId) {
            // Directly submit the form using the pendingSchoolId
            post(route("profiles.store"), {
                data: { school_id: pendingSchoolId }, // Ensure correct data is sent
                preserveScroll: true,
                onSuccess: () => {
                    setShowConfirmation(false);
                    setPendingSchoolId(null);
                },
                onError: (errors) => {
                    setShowConfirmation(false);
                    setPendingSchoolId(null);
                },
            });
        } else {
            console.error("No pending school ID to confirm.");
            setShowConfirmation(false);
        }
    };

    const cancelSelection = () => {
        setShowConfirmation(false);
        setPendingSchoolId(null);
        // Optionally reset the select dropdown if desired
        // setData('school_id', '');
        // setSelectedSchoolName('');
    };

    // Determine profile image based on role
    let roleSpecificDefaultImage = "/default-profile.png"; // Generic fallback
    if (user.role === "assistant") {
        roleSpecificDefaultImage = "/assistantProfile.png";
    } else if (user.role === "teacher") {
        roleSpecificDefaultImage = "/teacherPrfile2.png";
    }
    const profileImage = auth.profile_image || roleSpecificDefaultImage;
    const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    // Auto-select if only one school
    useEffect(() => {
        if (schools && schools.length === 1) {
            setData("school_id", schools[0].id);
            post(route("profiles.store"), {
                data: { school_id: schools[0].id },
                preserveScroll: true,
            });
        }
    }, [schools]);

    // Only show the picker if there are multiple schools
    if (schools && schools.length === 1) {
        // Show a centered loading spinner while redirecting
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lamaPurple"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            {/* Blurred Background */}
            <div className="absolute inset-0 filter blur-sm z-0">
                <DashboardLayout
                    user={auth.user}
                    header={<div></div>}
                    forceHideSidebar={true}
                >
                    {/* Empty content for layout structure */}
                    <div></div>
                </DashboardLayout>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 z-10"></div>

            {/* Centered Content */}
            <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-100 opacity-100">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-t-lg flex flex-col items-center text-center">
                        <img
                            src={profileImage}
                            alt={`${user.name}'s profile`}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3 object-cover"
                        />
                        <h2 className="text-xl font-bold text-gray-900">
                            Bienvenue, {user.name} !
                        </h2>
                        <p className="text-gray-600 text-sm">{roleDisplay === 'Assistant' ? 'Assistant' : roleDisplay === 'Teacher' ? 'Enseignant' : roleDisplay}</p>
                        {isAdminInspection && (
                            <p className="mt-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded font-medium">
                                Mode inspection administrateur
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-1 text-center">
                            Sélectionnez votre école
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 text-center">
                            Veuillez choisir l'école que vous souhaitez gérer pour cette session.
                        </p>

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <label
                                    htmlFor="school_id"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Écoles disponibles
                                </label>
                                <select
                                    id="school_id"
                                    name="school_id"
                                    value={data.school_id}
                                    onChange={(e) =>
                                        selectSchool(e.target.value)
                                    }
                                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-lamaPurple focus:border-lamaPurple sm:text-sm transition-colors`}
                                >
                                    <option value="">
                                        -- Sélectionnez une école --
                                    </option>
                                    {schools && schools.length > 0 ? (
                                        schools.map((school) => (
                                            <option
                                                key={school.id}
                                                value={school.id}
                                            >
                                                {school.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>
                                            Aucune école associée à votre profil.
                                        </option>
                                    )}
                                </select>
                                {errors.school_id && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.school_id}
                                    </p>
                                )}
                            </div>

                            {/* This button is now effectively hidden/disabled by the confirmation modal */}
                            {/* <button 
                                 type="submit"
                                 disabled={!data.school_id || processing || showConfirmation} 
                                 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lamaPurple hover:bg-lamaPurple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaPurple disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 {processing ? 'Processing...' : 'Confirm Selection'}
                             </button> */}

                            {flash.error && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                    {flash.error}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Confirmer la sélection de l'école
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vous avez sélectionné {" "}
                            <span className="font-medium">
                                {selectedSchoolName}
                            </span>
                            . Voulez-vous continuer ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelSelection}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                                disabled={processing}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmSelection} // Use the confirm function
                                className="px-4 py-2 bg-lamaPurple text-white rounded-md text-sm font-medium hover:bg-lamaPurple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaPurple disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? "Traitement..." : "Confirmer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// No layout applied here as it's a modal-like page over the dashboard
// SelectProfile.layout = page => <DashboardLayout>{page}</DashboardLayout>; // Removed layout nesting
