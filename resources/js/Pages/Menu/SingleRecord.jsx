import { Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Pagination";

const SingleRecord = () => {
    const { attendance, studentAttendances } = usePage().props;

    if (!attendance || !attendance.student || !attendance.class) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm flex-1 m-4 mt-0">
                <p>Loading attendance data...</p>
                <div className="mt-6">
                    <Link
                        href={route("attendances.index")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Back to Attendance Records
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm flex-1 m-4 mt-0">
            <h1 className="text-xl font-semibold text-gray-800 mb-6">
                Attendance Record Details for {attendance.student.firstName}{" "}
                {attendance.student.lastName}
            </h1>

            {/* Student Details */}
            <div className="space-y-4 mb-8">
                <div>
                    <h2 className="text-lg font-medium text-gray-700">Class</h2>
                    <p className="text-gray-600">{attendance.class.name}</p>
                </div>
                <div>
                    <h2 className="text-lg font-medium text-gray-700">
                        Total Records
                    </h2>
                    <p className="text-gray-600">
                        {studentAttendances.total || 0}
                    </p>
                </div>
            </div>

            {/* Attendance Records Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recorded By
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {studentAttendances.data &&
                            studentAttendances.data.map((record) => (
                                <tr key={record.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.date &&
                                            new Date(
                                                record.date,
                                            ).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                record.status === "present"
                                                    ? "bg-green-100 text-green-800"
                                                    : record.status === "late"
                                                      ? "bg-yellow-100 text-yellow-800"
                                                      : "bg-rose-100 text-rose-800"
                                            }`}
                                        >
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.reason || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.recordedBy &&
                                        record.recordedBy.name
                                            ? `${record.recordedBy.name} (${record.recordedBy.role})`
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {studentAttendances.links && (
                    <Pagination
                        links={studentAttendances.links}
                        className="mt-6"
                    />
                )}
            </div>

            {/* Back Button */}
            <div className="mt-6">
                <Link
                    href={route("attendances.index")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Back to Attendance Records
                </Link>
            </div>
        </div>
    );
};

SingleRecord.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default SingleRecord;
