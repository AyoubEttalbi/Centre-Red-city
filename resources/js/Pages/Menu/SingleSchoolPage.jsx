import React, { useState, Suspense } from "react";
import { usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    Building2,
    Users,
    BookOpen,
    Calendar,
    Phone,
    Mail,
    MapPin,
    ArrowLeft,
    UserCog,
} from "lucide-react";
import { Link } from "@inertiajs/react";
import { format } from "date-fns";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
);

export default function SingleSchoolPage({ school, statistics }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState("overview");

    // Chart data for student enrollment over time
    const enrollmentData = {
        labels: statistics?.enrollmentTrend?.map((item) => item.month) || [],
        datasets: [
            {
                label: "Student Enrollment",
                data:
                    statistics?.enrollmentTrend?.map((item) => item.count) ||
                    [],
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
            },
        ],
    };

    // Chart data for teacher distribution by subject
    const teacherDistributionData = {
        labels:
            statistics?.teacherDistribution?.map((item) => item.subject) || [],
        datasets: [
            {
                label: "Teachers by Subject",
                data:
                    statistics?.teacherDistribution?.map(
                        (item) => item.count,
                    ) || [],
                backgroundColor: [
                    "rgba(255, 99, 132, 0.5)",
                    "rgba(54, 162, 235, 0.5)",
                    "rgba(255, 206, 86, 0.5)",
                    "rgba(75, 192, 192, 0.5)",
                    "rgba(153, 102, 255, 0.5)",
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
            },
        ],
    };

    // Chart data for class size distribution
    const classSizeData = {
        labels:
            statistics?.classSizeDistribution?.map((item) => item.size) || [],
        datasets: [
            {
                label: "Classes by Size",
                data:
                    statistics?.classSizeDistribution?.map(
                        (item) => item.count,
                    ) || [],
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                borderColor: "rgb(75, 192, 192)",
                borderWidth: 1,
            },
        ],
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mr-3">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Nombre total d'élèves
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {statistics?.totalStudents || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-green-100 text-green-700 mr-3">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Nombre total d'enseignants
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {statistics?.totalTeachers || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 mr-3">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Nombre total de classes
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {statistics?.totalClasses || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700 mr-3">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Cours actifs
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {statistics?.activeCourses || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 mr-3">
                                        <UserCog className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Nombre total d'assistants
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {statistics?.totalAssistants || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">
                                    Tendance des inscriptions des élèves
                                </h3>
                                <div className="h-64">
                                    <Line
                                        data={enrollmentData}
                                        options={{ maintainAspectRatio: false }}
                                    />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">
                                    Répartition des enseignants par matière
                                </h3>
                                <div className="h-64">
                                    <Pie
                                        data={teacherDistributionData}
                                        options={{ maintainAspectRatio: false }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">
                                Répartition des classes par taille
                            </h3>
                            <div className="h-64">
                                <Bar
                                    data={classSizeData}
                                    options={{ maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                );
            case "teachers":
                return (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">
                            Enseignants
                        </h3>
                        {statistics?.teachers?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Matières
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Classes
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Élèves
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {statistics?.teachers?.map(
                                            (teacher) => (
                                                <tr key={teacher.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {teacher.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {teacher.subjects.join(
                                                            ", ",
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {teacher.classes}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {teacher.students}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                Aucun enseignant trouvé.
                            </p>
                        )}
                    </div>
                );
            case "assistants":
                return (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">
                            Assistants
                        </h3>
                        {statistics?.assistants?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                E-mail
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Téléphone
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {statistics?.assistants?.map(
                                            (assistant) => (
                                                <tr key={assistant.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {assistant.first_name}{" "}
                                                        {assistant.last_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {assistant.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {assistant.phone_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                assistant.status ===
                                                                "active"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {assistant.status ===
                                                            "active"
                                                                ? "Actif"
                                                                : "Inactif"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                Aucun assistant trouvé.
                            </p>
                        )}
                    </div>
                );
            case "classes":
                return (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Classes</h3>
                        {statistics?.classes?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Niveau
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Enseignant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Élèves
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Emploi du temps
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {statistics?.classes?.map(
                                            (classItem) => (
                                                <tr key={classItem.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {classItem.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {classItem.level}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {classItem.teacher}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {classItem.students}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {classItem.schedule}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                Aucune classe trouvée.
                            </p>
                        )}
                    </div>
                );
            case "students":
                return (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Élèves</h3>
                        {statistics?.students?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Classe
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Présence
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Performance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {statistics?.students?.map(
                                            (student) => (
                                                <tr key={student.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.class}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.attendance}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.performance}%
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">Aucun élève trouvé.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    href="/othersettings"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour aux écoles
                </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-700 mr-4">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {school.name}
                                </h1>
                                <p className="text-gray-500">
                                    Fondée :{" "}
                                    {school.created_at
                                        ? format(
                                              new Date(school.created_at),
                                              "d MMMM yyyy",
                                              { locale: undefined },
                                          )
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {auth.user.role === "admin" && (
                                <Link
                                    href={`/schools/${school.id}/edit`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Modifier l'école
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-700">
                                {school.address}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-700">
                                {school.phone_number}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-700">
                                {school.email}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-200">
                    <div className="flex overflow-x-auto">
                        <button
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "overview"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("overview")}
                        >
                            Vue d'ensemble
                        </button>
                        <button
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "teachers"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("teachers")}
                        >
                            Enseignants
                        </button>
                        <button
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "assistants"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("assistants")}
                        >
                            Assistants
                        </button>
                        <button
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "classes"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("classes")}
                        >
                            Classes
                        </button>
                        <button
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "students"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("students")}
                        >
                            Élèves
                        </button>
                    </div>
                </div>
            </div>
            {renderTabContent()}
        </div>
    );
}

SingleSchoolPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
