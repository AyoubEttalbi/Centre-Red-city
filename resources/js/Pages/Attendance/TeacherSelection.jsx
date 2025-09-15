import { useState } from "react";
import {
    Search,
    ChevronDown,
    Filter,
    Users,
    BookOpen,
    School,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

const TeacherSelection = ({
    teachers,
    currentSelection,
    assistants,
    levels,
    schools,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ school: null, level: null });
    const [showFilters, setShowFilters] = useState(false);
    const [expandedTeachers, setExpandedTeachers] = useState({});
    const { user } = usePage().props.auth;

    const teacher =
        user.role === "teacher"
            ? teachers.find((t) => t.email === user.email)
            : null;
    const assistant =
        user.role === "assistant"
            ? assistants.find((a) => a.email === user.email)
            : null;
    const availableSchools =
        user.role === "assistant" && assistant?.schools
            ? assistant.schools
            : schools;

    const toggleTeacher = (teacherId) => {
        setExpandedTeachers((prev) => ({
            ...prev,
            [teacherId]: !prev[teacherId],
        }));
    };

    if (user.role === "teacher" && !teacher) {
        return <div className="p-6">Enseignant introuvable</div>;
    }

    if (user.role === "teacher" && teacher) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {teacher.first_name} {teacher.last_name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Choisissez une classe pour voir les présences
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {teacher.classes.map((cls) => (
                        <Link
                            key={cls.id}
                            href={route("attendances.index", {
                                teacher_id: teacher.id,
                                class_id: cls.id,
                            })}
                            className={`block p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                                currentSelection.class === cls.id
                                    ? "border-indigo-300 bg-indigo-50"
                                    : "bg-white hover:border-indigo-200"
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                                    <BookOpen size={18} />
                                </div>
                                <div className="font-medium text-gray-800">
                                    {cls.name}
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 ml-9">
                                {
                                    levels.find((l) => l.id === cls.level_id)
                                        ?.name
                                }
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    const filteredTeachers = teachers.filter((teacher) => {
        const nameMatch = `${teacher.first_name} ${teacher.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const schoolMatch =
            !filters.school ||
            teacher.schools.some((s) => s.id === filters.school);
        const levelMatch =
            !filters.level ||
            teacher.classes.some((c) => c.level_id === filters.level);
        const assistantSchoolMatch =
            user.role !== "assistant" ||
            (assistant &&
                teacher.schools.some((s) =>
                    assistant.schools.some((as) => as.id === s.id),
                ));

        return nameMatch && schoolMatch && levelMatch && assistantSchoolMatch;
    });

    const clearFilters = () => {
        setFilters({ school: null, level: null });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Rechercher un enseignant par nom..."
                            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <Filter size={18} />
                        <span>Filtres</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>
                {showFilters && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap gap-4">
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    École
                                </label>
                                <select
                                    value={filters.school || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFilters({
                                            ...filters,
                                            school: value
                                                ? Number(value)
                                                : null,
                                        });
                                    }}
                                    className="w-full md:w-48 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
                                >
                                    <option value="">Toutes les écoles</option>
                                    {availableSchools.map((school) => (
                                        <option
                                            key={school.id}
                                            value={school.id}
                                        >
                                            {school.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Niveau
                                </label>
                                <select
                                    value={filters.level || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFilters({
                                            ...filters,
                                            level: value ? Number(value) : null,
                                        });
                                    }}
                                    className="w-full md:w-48 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
                                >
                                    <option value="">Tous les niveaux</option>
                                    {levels.map((level) => (
                                        <option key={level.id} value={level.id}>
                                            {level.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {(filters.school || filters.level) && (
                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <button
                                onClick={() => toggleTeacher(teacher.id)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-medium text-gray-800">
                                            {teacher.first_name} {teacher.last_name}
                                        </h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <School size={14} />
                                            <span>
                                                {teacher.schools
                                                    .map((s) => s.name)
                                                    .join(", ")}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`text-gray-400 transition-transform ${
                                            expandedTeachers[teacher.id]
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </div>
                                <div className="flex items-center gap-1 mt-2 ml-11 text-sm text-gray-500">
                                    <BookOpen size={14} />
                                    <span>
                                        {teacher.classes.length} Classes
                                    </span>
                                </div>
                            </button>
                            {expandedTeachers[teacher.id] && (
                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                    <div className="grid gap-2">
                                        {teacher.classes.map((cls) => (
                                            <Link
                                                key={cls.id}
                                                href={route(
                                                    "attendances.index",
                                                    {
                                                        teacher_id: teacher.id,
                                                        class_id: cls.id,
                                                    },
                                                )}
                                                className={`block p-3 rounded-md border transition-colors ${
                                                    currentSelection.teacher ===
                                                        teacher.id &&
                                                    currentSelection.class ===
                                                        cls.id
                                                        ? "border-indigo-300 bg-indigo-50"
                                                        : "bg-white hover:border-indigo-300 hover:bg-indigo-50"
                                                }`}
                                            >
                                                <div className="font-medium text-gray-800">
                                                    {cls.name}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {
                                                        levels.find(
                                                            (l) =>
                                                                l.id ===
                                                                cls.level_id,
                                                        )?.name
                                                    }
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500">
                            Aucun enseignant trouvé correspondant à vos critères.
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                clearFilters();
                            }}
                            className="mt-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            Réinitialiser tous les filtres
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherSelection;
