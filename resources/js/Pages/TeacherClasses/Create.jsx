import { useState, useEffect } from "react";
import { router, useForm, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { User, BookOpen, School, Mail, Phone, CheckCircle } from "lucide-react";

export default function TeacherClassCreate({ teachers, classes, auth }) {
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState(classes);
    const [searchTerm, setSearchTerm] = useState("");
    const [teacherDetails, setTeacherDetails] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        teacher_id: "",
        class_ids: [],
    });

    useEffect(() => {
        setData("teacher_id", selectedTeacher);
        setData("class_ids", selectedClasses);
        if (selectedTeacher) {
            const teacher = teachers.find(
                (t) => t.id.toString() === selectedTeacher.toString(),
            );
            setTeacherDetails(teacher || null);
        } else {
            setTeacherDetails(null);
        }
    }, [selectedTeacher, selectedClasses]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredClasses(classes);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredClasses(
                classes.filter(
                    (cls) =>
                        cls.name.toLowerCase().includes(term) ||
                        (cls.level &&
                            cls.level.name.toLowerCase().includes(term)) ||
                        (cls.school &&
                            cls.school.name.toLowerCase().includes(term)),
                ),
            );
        }
    }, [searchTerm, classes]);

    const handleTeacherSelect = (e) => {
        const teacherId = e.target.value;
        setSelectedTeacher(teacherId);
        setSelectedClasses([]);
    };

    const handleClassToggle = (classId) => {
        setSelectedClasses((prevSelected) => {
            if (prevSelected.includes(classId)) {
                return prevSelected.filter((id) => id !== classId);
            } else {
                return [...prevSelected, classId];
            }
        });
    };

    const handleSingleAssignment = () => {
        if (!selectedTeacher || selectedClasses.length === 0) {
            alert("Veuillez sélectionner un enseignant et au moins une classe.");
            return;
        }
        router.post(
            route("teacher-classes.bulk-assign"),
            {
                teacher_id: selectedTeacher,
                class_ids: selectedClasses,
            },
            {
                onSuccess: () => {
                    setSelectedTeacher("");
                    setSelectedClasses([]);
                    reset();
                },
            },
        );
    };

    return (
        <>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Affecter des enseignants aux classes
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Sélectionnez un enseignant et affectez-le à
                                        plusieurs classes en une seule fois
                                    </p>
                                </div>
                                <Link
                                    href={route("teacher-classes.index")}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Retour à la liste
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Teacher Selection */}
                                <div className="md:col-span-1">
                                    <h3 className="text-md font-medium mb-2 flex items-center">
                                        <User className="h-5 w-5 mr-1 text-lamaPurple" />
                                        Sélectionner un enseignant
                                    </h3>
                                    <select
                                        value={selectedTeacher}
                                        onChange={handleTeacherSelect}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring focus:ring-lamaPurple focus:ring-opacity-50"
                                    >
                                        <option value="">
                                            -- Sélectionner un enseignant --
                                        </option>
                                        {teachers.map((teacher) => (
                                            <option
                                                key={teacher.id}
                                                value={teacher.id}
                                            >
                                                {teacher.first_name}{" "}
                                                {teacher.last_name}{" "}
                                                {teacher.schools &&
                                                    teacher.schools.length >
                                                        0 &&
                                                    `(${teacher.schools[0]?.name})`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.teacher_id && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.teacher_id}
                                        </p>
                                    )}

                                    {/* Teacher Details Card */}
                                    {teacherDetails && (
                                        <div className="mt-4 border rounded-md overflow-hidden">
                                            <div className="bg-lamaPurpleLight p-4 border-b">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 rounded-full overflow-hidden bg-white mr-3 flex-shrink-0">
                                                        <img
                                                            src={
                                                                teacherDetails.profile_image ||
                                                                "/teacherPrfile2.png"
                                                            }
                                                            alt={`${teacherDetails.first_name} ${teacherDetails.last_name}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">
                                                            {
                                                                teacherDetails.first_name
                                                            }{" "}
                                                            {
                                                                teacherDetails.last_name
                                                            }
                                                        </h4>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            <span className="truncate max-w-[200px]">
                                                                {
                                                                    teacherDetails.email
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 border-b">
                                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>
                                                        {teacherDetails.phone_number ||
                                                            "Aucun numéro de téléphone"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span
                                                        className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${
                                                            teacherDetails.status ===
                                                            "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {teacherDetails.status === "active" ? "Actif" : "Inactif"}
                                                    </span>
                                                </div>
                                            </div>
                                            {teacherDetails.schools &&
                                                teacherDetails.schools.length > 0 && (
                                                    <div className="p-3 border-b">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <School className="h-4 w-4 text-gray-500" />
                                                            <p className="text-xs font-medium text-gray-700">
                                                                Écoles
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {teacherDetails.schools.map(
                                                                (school) => (
                                                                    <span
                                                                        key={school.id}
                                                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                                                    >
                                                                        {school.name}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            {teacherDetails.subjects &&
                                                teacherDetails.subjects.length > 0 && (
                                                    <div className="p-3 border-b">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <BookOpen className="h-4 w-4 text-gray-500" />
                                                            <p className="text-xs font-medium text-gray-700">
                                                                Matières
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {teacherDetails.subjects.map(
                                                                (subject) => (
                                                                    <span
                                                                        key={subject.id}
                                                                        className="text-xs bg-lamaPurpleLight text-lamaPurple px-2 py-1 rounded"
                                                                    >
                                                                        {subject.name}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            {teacherDetails.classes &&
                                                teacherDetails.classes.length > 0 && (
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4 text-gray-500"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                                />
                                                            </svg>
                                                            <p className="text-xs font-medium text-gray-700">
                                                                Classes actuelles
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1 mt-1">
                                                            {teacherDetails.classes.map(
                                                                (cls) => (
                                                                    <div
                                                                        key={cls.id}
                                                                        className="flex items-center text-xs bg-gray-50 p-1 rounded"
                                                                    >
                                                                        <span>
                                                                            {cls.name}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Class Selection */}
                                <div className="md:col-span-2">
                                    {/* Class Search */}
                                    <div className="mb-4">
                                        <h3 className="text-md font-medium mb-2 flex items-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-1 text-lamaPurple"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                            Rechercher des classes
                                        </h3>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Rechercher par nom, niveau ou école"
                                                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lamaPurple focus:border-lamaPurple"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Classes List */}
                                    {selectedTeacher ? (
                                        <div>
                                            <h3 className="text-md font-medium mb-2">
                                                Sélectionner les classes ({selectedClasses.length} sélectionnées)
                                            </h3>
                                            <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                                                {filteredClasses.length > 0 ? (
                                                    filteredClasses.map(
                                                        (cls) => {
                                                            const isSelected =
                                                                selectedClasses.includes(
                                                                    cls.id,
                                                                );
                                                            const isAlreadyAssigned =
                                                                teacherDetails?.classes?.some(
                                                                    (c) =>
                                                                        c.id ===
                                                                        cls.id,
                                                                );
                                                            return (
                                                                <div
                                                                    key={cls.id}
                                                                    className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer ${
                                                                        isSelected
                                                                            ? "bg-lamaSkyLight"
                                                                            : ""
                                                                    } ${isAlreadyAssigned ? "opacity-50" : ""}`}
                                                                    onClick={() =>
                                                                        !isAlreadyAssigned &&
                                                                        handleClassToggle(
                                                                            cls.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {isAlreadyAssigned ? (
                                                                        <div className="flex items-center bg-gray-200 px-2 py-1 rounded text-xs text-gray-700">
                                                                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                                                            Déjà affectée
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                isSelected
                                                                            }
                                                                            onChange={() => {}}
                                                                            className="h-4 w-4 text-lamaPurple focus:ring-lamaPurple rounded"
                                                                        />
                                                                    )}
                                                                    <div className="ml-3 flex-1">
                                                                        <div className="flex justify-between">
                                                                            <p className="font-medium">
                                                                                {cls.name}
                                                                            </p>
                                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                                                {cls.number_of_teachers || 0} enseignants
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-500">
                                                                            {cls.level?.name} • {cls.school?.name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )
                                                ) : (
                                                    <div className="p-4 text-center text-gray-500">
                                                        Aucune classe trouvée pour votre recherche.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleSingleAssignment
                                                    }
                                                    disabled={
                                                        !selectedTeacher ||
                                                        selectedClasses.length ===
                                                            0 ||
                                                        processing
                                                    }
                                                    className="px-4 py-2 bg-lamaPurple text-white rounded-md hover:bg-lamaPurple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaPurple disabled:opacity-50"
                                                >
                                                    {processing
                                                        ? "Traitement..."
                                                        : `Affecter l'enseignant à ${selectedClasses.length} classes`}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-gray-500">
                                            <User className="h-12 w-12 mb-2" />
                                            <p>Veuillez d'abord sélectionner un enseignant</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

TeacherClassCreate.layout = (page) => <DashboardLayout children={page} />;
