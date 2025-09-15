import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
import FormModal from "@/Components/FormModal";
import { ArrowLeft } from "lucide-react";

const SingleResultPage = ({ result, levels, classes, subjects, schools }) => {
    const getGradeColor = (grade) => {
        if (grade.startsWith("A")) return "text-green-600";
        if (grade.startsWith("B")) return "text-blue-600";
        if (grade.startsWith("C")) return "text-yellow-600";
        if (grade.startsWith("D")) return "text-orange-600";
        return "text-red-600";
    };

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Link
                        href={route("results.index")}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-semibold">Result Details</h1>
                </div>
                <div className="flex items-center gap-2">
                    <FormModal
                        table="result"
                        type="update"
                        id={result.id}
                        data={result}
                        levels={levels}
                        classes={classes}
                        subjects={subjects}
                    />
                    <FormModal
                        table="result"
                        type="delete"
                        id={result.id}
                        route="results"
                    />
                </div>
            </div>

            {/* RESULT DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    {/* STUDENT INFO */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-md font-medium mb-3">
                            Student Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">
                                    {result.student?.first_name}{" "}
                                    {result.student?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Class</p>
                                <p className="font-medium">
                                    {result.class?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Level</p>
                                <p className="font-medium">
                                    {
                                        levels.find(
                                            (level) =>
                                                level.id ===
                                                result.class?.level_id,
                                        )?.name
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">School</p>
                                <p className="font-medium">
                                    {result.student?.school?.name || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SUBJECT INFO */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-md font-medium mb-3">
                            Subject Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Subject</p>
                                <p className="font-medium">
                                    {result.subject?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Exam Date
                                </p>
                                <p className="font-medium">
                                    {new Date(
                                        result.exam_date,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* SCORE INFO */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-md font-medium mb-3">
                            Score Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Score</p>
                                <p className="font-medium text-2xl">
                                    {result.score}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Grade</p>
                                <p
                                    className={`font-medium text-2xl ${getGradeColor(result.grade)}`}
                                >
                                    {result.grade}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NOTES */}
                    {result.notes && (
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h2 className="text-md font-medium mb-3">Notes</h2>
                            <p className="text-gray-700">{result.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

SingleResultPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default SingleResultPage;
