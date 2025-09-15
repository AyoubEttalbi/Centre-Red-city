import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
);

const EnhancedAssistantProfile = ({
    assistant,
    performance,
    resources,
    communications,
    professional,
    students,
    schedule,
    documents,
    achievements,
}) => {
    const [activeTab, setActiveTab] = useState("performance");

    const tabs = [
        { id: "performance", label: "Performance" },
        { id: "resources", label: "Resources" },
        { id: "communications", label: "Communications" },
        { id: "professional", label: "Professional" },
        { id: "students", label: "Students" },
        { id: "schedule", label: "Schedule" },
        { id: "documents", label: "Documents" },
        { id: "achievements", label: "Achievements" },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "performance":
                return <PerformanceAnalytics data={performance} />;
            case "resources":
                return <ResourceManagement data={resources} />;
            case "communications":
                return <CommunicationHub data={communications} />;
            case "professional":
                return <ProfessionalDevelopment data={professional} />;
            case "students":
                return <StudentProgress data={students} />;
            case "schedule":
                return <ScheduleManagement data={schedule} />;
            case "documents":
                return <DocumentManagement data={documents} />;
            case "achievements":
                return <AchievementShowcase data={achievements} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">{renderTabContent()}</div>
        </div>
    );
};

const PerformanceAnalytics = ({ data }) => {
    const performanceData = {
        labels: [
            "Teaching Rating",
            "Attendance Rate",
            "Lesson Completion",
            "Student Progress",
        ],
        datasets: [
            {
                data: [
                    data.rating,
                    data.attendance,
                    data.lessonCompletion,
                    data.studentProgress,
                ],
                backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"],
            },
        ],
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                        Overall Performance
                    </h3>
                    <div className="h-64">
                        <Pie data={performanceData} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium">Teaching Rating</h3>
                        <p className="text-2xl font-bold text-blue-600">
                            {data.rating}/5
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium">Attendance Rate</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {data.attendance}%
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium">Lesson Completion</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                            {data.lessonCompletion}%
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium">Student Progress</h3>
                        <p className="text-2xl font-bold text-purple-600">
                            {data.studentProgress}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResourceManagement = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Resource Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Lesson Plans</h3>
                    <div className="space-y-4">
                        {data.lessonPlans.map((plan, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <span>{plan.name}</span>
                                <Link
                                    href={plan.url}
                                    className="text-blue-600 hover:underline"
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Shared Resources
                    </h3>
                    <div className="space-y-4">
                        {data.sharedResources.map((resource, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <span>{resource.name}</span>
                                <Link
                                    href={resource.url}
                                    className="text-blue-600 hover:underline"
                                >
                                    Access
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommunicationHub = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Communication Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Messages</h3>
                    <div className="space-y-4">
                        {data.messages.map((message, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{message.from}</p>
                                <p className="text-sm text-gray-600">
                                    {message.preview}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Announcements</h3>
                    <div className="space-y-4">
                        {data.announcements.map((announcement, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">
                                    {announcement.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {announcement.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Meetings</h3>
                    <div className="space-y-4">
                        {data.meetings.map((meeting, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{meeting.title}</p>
                                <p className="text-sm text-gray-600">
                                    {meeting.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfessionalDevelopment = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Professional Development</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Certifications</h3>
                    <div className="space-y-4">
                        {data.certifications.map((cert, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{cert.name}</p>
                                <p className="text-sm text-gray-600">
                                    Year: {cert.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Training Opportunities
                    </h3>
                    <div className="space-y-4">
                        {data.training.map((training, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{training.name}</p>
                                <p className="text-sm text-gray-600">
                                    Date: {training.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentProgress = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Student Progress Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Performance Overview
                    </h3>
                    <div className="h-64">
                        <Line data={data.performanceData} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Attendance Patterns
                    </h3>
                    <div className="h-64">
                        <Bar data={data.attendanceData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScheduleManagement = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Schedule Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Today's Schedule
                    </h3>
                    <div className="space-y-4">
                        {data.today.map((item, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{item.time}</p>
                                <p className="text-sm text-gray-600">
                                    {item.activity}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Availability</h3>
                    <div className="space-y-4">
                        {data.availability.map((slot, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{slot.day}</p>
                                <p className="text-sm text-gray-600">
                                    {slot.hours}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DocumentManagement = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Document Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Important Documents
                    </h3>
                    <div className="space-y-4">
                        {data.important.map((doc, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <span>{doc.name}</span>
                                <Link
                                    href={doc.url}
                                    className="text-blue-600 hover:underline"
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">
                        Emergency Contacts
                    </h3>
                    <div className="space-y-4">
                        {data.emergencyContacts.map((contact, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{contact.name}</p>
                                <p className="text-sm text-gray-600">
                                    {contact.phone}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AchievementShowcase = ({ data }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Achievement Showcase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Awards</h3>
                    <div className="space-y-4">
                        {data.awards.map((award, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">{award.name}</p>
                                <p className="text-sm text-gray-600">
                                    Year: {award.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Testimonials</h3>
                    <div className="space-y-4">
                        {data.testimonials.map((testimonial, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">
                                    {testimonial.student}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {testimonial.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedAssistantProfile;
