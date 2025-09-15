"use client";

import { useState } from "react";
import {
    Trash2,
    GraduationCap,
    School,
    BookOpen,
    Award,
    BookText,
} from "lucide-react";
import FormModal from "./FormModal";
import { role } from "@/lib/data";
import DeleteConfirmation from "./DeleteConfirmation";

// Helper function to get icon based on level name
const getLevelIcon = (levelName) => {
    const name = levelName.toLowerCase();
    if (name.includes("bac")) return GraduationCap;
    if (name.includes("2bac")) return Award;
    if (name.includes("college")) return School;
    if (name.includes("primary")) return BookOpen;
    return BookText;
};

// Helper function to get background color based on level name
const getIconBackground = (levelName) => {
    const name = levelName.toLowerCase();
    if (name.includes("bac")) return "bg-blue-100";
    if (name.includes("2bac")) return "bg-purple-100";
    if (name.includes("college")) return "bg-green-100";
    if (name.includes("primary")) return "bg-yellow-100";
    return "bg-gray-100";
};

// Helper function to get icon color based on level name
const getIconColor = (levelName) => {
    const name = levelName.toLowerCase();
    if (name.includes("bac")) return "text-blue-600";
    if (name.includes("2bac")) return "text-purple-600";
    if (name.includes("college")) return "text-green-600";
    if (name.includes("primary")) return "text-yellow-600";
    return "text-gray-600";
};

function LevelCard({ level, onDelete }) {
    const Icon = getLevelIcon(level.name);
    const bgColor = getIconBackground(level.name);
    const iconColor = getIconColor(level.name);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex group">
            <div className="w-full text-left flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${bgColor} transition-transform group-hover:scale-110`}
                    >
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <span className="font-medium">{level.name}</span>
                </div>
                <button
                    onClick={() => onDelete(level)}
                    className="w-7 h-7 flex items-center hover:text-white text-black justify-center rounded-full bg-gray-100  transition-all duration-200 hover:bg-red-500"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function LevelsList({ levelsData = [] }) {
    const [deleteLevel, setDeleteLevel] = useState(null);

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 md:mt-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="font-semibold text-2xl">Ma liste de niveaux</h1>
                    {role === "admin" && (
                        <FormModal
                            table="level"
                            type="create"
                            buttonLabel="Ajouter un niveau"
                        />
                    )}
                </div>
            </div>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {levelsData.map((level) => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            onDelete={setDeleteLevel}
                        />
                    ))}
                </div>
            </div>
            {deleteLevel && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <DeleteConfirmation
                        id={deleteLevel.id}
                        route="othersettings/levels"
                        onDelete={() => setDeleteLevel(null)}
                        onClose={() => setDeleteLevel(null)}
                        confirmText="Supprimer le niveau ?"
                        cancelText="Annuler"
                        deleteButtonText="Supprimer"
                    />
                </div>
            )}
        </div>
    );
}

export default LevelsList;
