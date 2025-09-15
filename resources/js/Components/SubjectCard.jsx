import { useState } from "react";
import {
    Code,
    Palette,
    BookOpen,
    Calculator,
    Globe,
    Microscope,
    Music,
    Dumbbell,
    Trash2,
    LibraryBig,
} from "lucide-react";
import FormModal from "./FormModal";
import { role } from "@/lib/data";
import DeleteConfirmation from "./DeleteConfirmation";

// Icon mapping
const iconComponents = {
    Code,
    Palette,
    BookOpen,
    Calculator,
    Globe,
    Microscope,
    Music,
    Dumbbell,
};

// List of color pairs
const colorPairs = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-yellow-100 text-yellow-700",
    "bg-green-100 text-green-700",
    "bg-red-100 text-red-700",
    "bg-cyan-100 text-cyan-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
];

// Function to get a random color pair
const getRandomColorPair = () => {
    const randomIndex = Math.floor(Math.random() * colorPairs.length);
    return colorPairs[randomIndex];
};

function SubjectCard({ subject, onDelete }) {
    const Icon = iconComponents[subject.icon];

    // Use subject.color if it exists, otherwise generate a random color pair
    const colorClass = subject.color || getRandomColorPair();

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex">
            <div className="w-full text-left flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        {Icon ? <Icon className="h-5 w-5" /> : <LibraryBig />}{" "}
                    </div>
                    <span className="font-medium">{subject.name}</span>
                </div>
                <button
                    onClick={() => onDelete(subject)}
                    className="w-7 h-7 flex items-center hover:text-white text-black justify-center rounded-full bg-gray-100  transition-all duration-200 hover:bg-red-500"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SubjectsList({ subjectsData = [] }) {
    const [deleteSubject, setDeleteSubject] = useState(null);

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 md:mt-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="font-semibold text-2xl">Ma liste de sujets</h1>
                    {role === "admin" && (
                        <FormModal table="subject" type="create" />
                    )}
                </div>
            </div>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {subjectsData.map((subject) => (
                        <SubjectCard
                            key={subject.id}
                            subject={subject}
                            onDelete={setDeleteSubject}
                        />
                    ))}
                </div>
            </div>

            {deleteSubject && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <DeleteConfirmation
                        id={deleteSubject.id}
                        route="othersettings/subjects"
                        onDelete={() => setDeleteSubject(null)}
                        onClose={() => setDeleteSubject(null)}
                    />
                </div>
            )}
        </div>
    );
}

export default SubjectsList;
