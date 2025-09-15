import DashboardLayout from "@/Layouts/DashboardLayout";
import React, { useState, useEffect, useRef } from "react";

import FormModal from "@/Components/FormModal";
import axios from "axios";
import { Filter, CheckCircle, XCircle, User } from "lucide-react";

export default function ResultsPage({
    teachers = [],
    classes = [],
    students = [],
    results = {},
    levels,
    subjects,
    schools,
    role,
    teacherSubjectIds = [],
    loggedInTeacherId = null,
}) {
    // When user is a teacher, immediately select their teacher ID
    const getInitialTeacher = () => {
        if (role === "teacher") {
            // First, check if we have the loggedInTeacherId directly from the backend
            if (loggedInTeacherId) {
                return String(loggedInTeacherId);
            }

            // If no loggedInTeacherId, use the first teacher in the list as a fallback
            if (teachers.length > 0) {
                return String(teachers[0].id);
            }
        }
        return "";
    };

    const [selectedTeacher, setSelectedTeacher] = useState(getInitialTeacher);
    const [selectedClass, setSelectedClass] = useState("");

    // Make sure teacher is selected if data loads asynchronously
    useEffect(() => {
        if (role === "teacher") {
            // If loggedInTeacherId becomes available later
            if (
                loggedInTeacherId &&
                (!selectedTeacher || selectedTeacher === "")
            ) {
                setSelectedTeacher(String(loggedInTeacherId));
            }
            // Or if teachers array loads later and no teacher is selected yet
            else if (!selectedTeacher && teachers.length > 0) {
                setSelectedTeacher(String(teachers[0].id));
            }
        }
    }, [selectedTeacher, teachers, role, loggedInTeacherId]);

    // Auto-select the first subject if user is a teacher and has subjects
    const getDefaultSubject = () => {
        if (
            role === "teacher" &&
            teacherSubjectIds &&
            teacherSubjectIds.length > 0
        ) {
            const firstAssignedSubject = subjects.find((subject) =>
                teacherSubjectIds.includes(subject.id),
            );
            return firstAssignedSubject ? String(firstAssignedSubject.id) : "";
        }
        return "";
    };

    // Always initialize with a default subject for teachers
    const [selectedSubject, setSelectedSubject] = useState(getDefaultSubject);
    const [availableClasses, setAvailableClasses] = useState(classes);
    const [availableStudents, setAvailableStudents] = useState(students);
    const [availableSubjects, setAvailableSubjects] = useState(subjects);
    const [classResults, setClassResults] = useState(results);
    const [loading, setLoading] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [studentMemberships, setStudentMemberships] = useState({});
    const [resetKey, setResetKey] = useState(0);
    const inputRef = useRef(null);

    // For teachers, set their subjects directly
    useEffect(() => {
        // For admin/assistant: auto-select first subject when teacher & class are chosen
        if (
            (role === "admin" || role === "assistant") &&
            selectedTeacher &&
            selectedClass &&
            availableSubjects.length > 0 &&
            (!selectedSubject || selectedSubject === "")
        ) {
            setSelectedSubject(String(availableSubjects[0].id));
        }

        if (role === "teacher") {
            // Filter subjects to only those this teacher teaches
            if (teacherSubjectIds && teacherSubjectIds.length > 0) {
                const filteredSubjects = subjects.filter((subject) =>
                    teacherSubjectIds.includes(subject.id),
                );
                setAvailableSubjects(filteredSubjects);

                // Always make sure a teacher has a subject selected if available
                // This ensures a subject is always selected even after state updates
                if (
                    filteredSubjects.length > 0 &&
                    (!selectedSubject || selectedSubject === "")
                ) {
                    setSelectedSubject(String(filteredSubjects[0].id));
                }
            }
        }
    }, [role, subjects, teacherSubjectIds, selectedSubject]);

    // Fetch classes when teacher is selected (for all users including teachers)
    useEffect(() => {
        if (selectedTeacher) {
            setLoading(true);

            axios
                .get(`/results/classes-by-teacher/${selectedTeacher}`)
                .then((response) => {
                    setAvailableClasses(response.data);

                    // Auto-select the first class for teachers
                    if (
                        role === "teacher" &&
                        response.data &&
                        response.data.length > 0
                    ) {
                        setSelectedClass(String(response.data[0].id));
                    }

                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching classes:", error);
                    setLoading(false);
                });
        } else {
            // Clear selections when teacher is unselected
            setSelectedClass("");
            setSelectedSubject("");
            setAvailableStudents([]);
            setClassResults({});
            setStudentMemberships({});
        }
    }, [selectedTeacher, role]);

    // Fetch students, subjects, results, and memberships when class is selected
    useEffect(() => {
        if (selectedClass) {
            setLoading(true);

            const promises = [
                axios.get(`/results/students-by-class/${selectedClass}`),
                axios.get(`/results/by-class/${selectedClass}`),
            ];

            // If not a teacher, we need to fetch subjects for this teacher and class
            if (role !== "teacher" && selectedTeacher) {
                promises.push(
                    axios.get(
                        `/results/subjects-by-teacher/${selectedTeacher}/${selectedClass}`,
                    ),
                );
            }

            Promise.all(promises)
                .then((responses) => {
                    const [
                        studentsResponse,
                        resultsResponse,
                        subjectsResponse,
                    ] = responses;

                    // Check if we received valid data
                    if (!Array.isArray(studentsResponse.data)) {
                        console.error(
                            "Received invalid students data:",
                            studentsResponse.data,
                        );
                        setAvailableStudents([]);
                    } else {
                        setAvailableStudents(studentsResponse.data);
                    }

                    // Check if we received valid results data
                    if (typeof resultsResponse.data !== "object") {
                        console.error(
                            "Received invalid results data:",
                            resultsResponse.data,
                        );
                        setClassResults({});
                        setStudentMemberships({});
                    } else {
                        // Extract memberships data if available
                        let actualResults = { ...resultsResponse.data };
                        let memberships = {};

                        // Look for standard membership data
                        if (resultsResponse.data.studentMemberships) {
                            memberships =
                                resultsResponse.data.studentMemberships;
                            delete actualResults.studentMemberships;
                        }

                        // Check for teacher-subject assignments in the memberships
                        if (resultsResponse.data.teacherSubjectAssignments) {
                            // Process teacher-subject assignments
                            console.log(
                                "Teacher-subject assignments found:",
                                resultsResponse.data.teacherSubjectAssignments,
                            );
                            delete actualResults.teacherSubjectAssignments;
                        }

                        // Store the results and memberships
                        setClassResults(actualResults);
                        setStudentMemberships(memberships);

                        console.log(
                            "Student memberships processed:",
                            memberships,
                        );
                    }

                    // Update available subjects if we got a response
                    if (
                        subjectsResponse &&
                        Array.isArray(subjectsResponse.data)
                    ) {
                        setAvailableSubjects(subjectsResponse.data);
                    } else if (role !== "teacher") {
                        // For admin/assistant without specific subjects, show all
                        setAvailableSubjects(subjects);
                    }

                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching data:", error);
                    setAvailableStudents([]);
                    setClassResults({});
                    setStudentMemberships({});
                    setLoading(false);
                });
        } else {
            setAvailableStudents([]);
            setClassResults({});
            setStudentMemberships({});
            setSelectedSubject("");
        }
    }, [selectedClass, selectedTeacher, role]);

    // Focus input when editing
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const getGradeColor = (grade) => {
        if (!grade) return "text-gray-400";

        // Check if it's a fraction format (e.g., "14/20")
        if (grade.includes("/")) {
            const [numerator, denominator] = grade
                .split("/")
                .map((part) => parseFloat(part.trim()));
            const percentage = (numerator / denominator) * 100;

            if (percentage >= 85) return "text-green-600";
            if (percentage >= 70) return "text-blue-600";
            if (percentage >= 50) return "text-yellow-600";
            if (percentage >= 40) return "text-orange-600";
            return "text-red-600";
        }

        // Default color
        return "text-gray-700";
    };

    const handleCellClick = (studentId, subjectId, field, value) => {
        // Set editing state without complicated permission checks
        setEditingCell({ studentId, subjectId, field });
        setEditValue(value || "");

        // Force the input to focus after setting the editing state
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
    };

    const handleCellBlur = (e) => {
        // Only cancel edit after a short delay to allow button clicks to complete
        setTimeout(() => {
            if (editingCell) {
                cancelEdit();
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    const saveEdit = () => {
        if (!editingCell) return;

        const { studentId, subjectId, field } = editingCell;
        setSaving(true);

        // Prepare the data for the request
        const postData = {
            student_id: studentId,
            subject_id: subjectId,
            class_id: selectedClass,
            grade_field: field,
            value: editValue,
        };

        // Add CSRF token to ensure the request works
        const token = document.querySelector('meta[name="csrf-token"]');
        if (token) {
            axios.defaults.headers.common["X-CSRF-TOKEN"] =
                token.getAttribute("content");
        }

        // Ensure URL is correct with a leading slash
        const url = "/results/update-grade";

        // Send the request
        axios
            .post(url, postData)
            .then((response) => {
                if (!response.data.success) {
                    alert(`Échec de l'enregistrement de la note : ${response.data.message}`);
                    setSaving(false);
                    return;
                }

                // Update the local state with the new result
                const newResults = { ...classResults };

                // If this student doesn't have results for this subject yet, initialize an array
                if (!newResults[studentId]) {
                    newResults[studentId] = [];
                }

                // Find existing result for this subject
                const existingResultIndex = newResults[studentId].findIndex(
                    (r) => r.subject_id === subjectId,
                );

                if (existingResultIndex >= 0) {
                    // Update existing result
                    newResults[studentId][existingResultIndex][field] = editValue;
                    if (field === "notes") {
                        newResults[studentId][existingResultIndex].notes = editValue;
                    } else {
                        newResults[studentId][existingResultIndex][field] = editValue;
                        newResults[studentId][existingResultIndex].final_grade = response.data.final_grade;
                    }
                } else {
                    // Add new result
                    const newResult = {
                        student_id: studentId,
                        subject_id: subjectId,
                        class_id: selectedClass,
                        [field]: editValue,
                    };
                    if (field !== "notes") {
                        newResult.final_grade = response.data.final_grade;
                    }
                    newResults[studentId].push(newResult);
                }

                setClassResults(newResults);
                setEditingCell(null);
                setEditValue("");
                setSaving(false);
            })
            .catch((error) => {
                let errorMessage = "Une erreur inconnue s'est produite";
                if (error.response) {
                    errorMessage =
                        error.response?.data?.message ||
                        `Erreur du serveur : ${error.response.status}`;
                } else if (error.request) {
                    errorMessage =
                        "Aucune réponse du serveur. Veuillez vérifier votre connexion.";
                } else {
                    errorMessage = error.message || "Erreur de configuration de la requête";
                }

                const retry = confirm(
                    `Échec de l'enregistrement de la note : ${errorMessage}\n\nVoulez-vous réessayer ?`,
                );
                if (retry) {
                    setTimeout(saveEdit, 1000);
                } else {
                    setSaving(false);
                }
            });
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    const renderGradeCell = (
        studentId,
        subjectId,
        field,
        placeholder,
        value,
    ) => {
        const isEditing =
            editingCell &&
            editingCell.studentId === studentId &&
            editingCell.subjectId === subjectId &&
            editingCell.field === field;

        // Determine the correct placeholder based on the field
        let cellPlaceholder = placeholder;
        if (field === "grade1" || field === "grade2" || field === "grade3") {
            cellPlaceholder = "../20";
        }

        return (
            <div
                className={`px-3 py-2 cursor-pointer ${isEditing ? "bg-gray-100" : "hover:bg-blue-50 hover:border hover:border-blue-200"}`}
                onClick={() =>
                    !isEditing &&
                    handleCellClick(studentId, subjectId, field, value)
                }
            >
                {isEditing ? (
                    <div className="flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-lamaPurple"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={cellPlaceholder}
                            pattern={
                                field !== "notes" ? "[0-9]+\/[0-9]+" : ".*"
                            }
                            title={
                                field !== "notes"
                                    ? "Enter grade in format 15/20 or 8/10"
                                    : ""
                            }
                            autoFocus
                        />
                        <div className="flex items-center ml-1">
                            {saving ? (
                                <span className="text-xs text-gray-400">
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            saveEdit();
                                        }}
                                        className="text-green-500 hover:text-green-600 p-0.5"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            cancelEdit();
                                        }}
                                        className="text-red-500 hover:text-red-600 p-0.5"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <span
                            className={`text-sm font-medium ${field !== "notes" ? getGradeColor(value) : "text-gray-700"}`}
                        >
                            {value || "—"}
                        </span>
                        {!value && (
                            <span className="ml-1 text-xs text-gray-400 italic">
                                {field !== "notes" ? "Click to add" : ""}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Filter the subjects based on selection or role
    const getFilteredSubjects = () => {
        if (role === "teacher") {
            // For teachers, only show subjects they teach
            return availableSubjects.filter((subject) =>
                teacherSubjectIds.includes(subject.id),
            );
        } else if (selectedSubject) {
            // If a subject is selected, only show that subject
            return availableSubjects.filter(
                (subject) => subject.id === parseInt(selectedSubject),
            );
        }
        return availableSubjects;
    };

    // Get subjects for a specific student based on role and memberships
    const getStudentSubjects = (studentId) => {
        // Default: show all available subjects
        // This ensures all students have input fields for grades regardless of memberships
        return availableSubjects;
    };

    // Get all relevant subjects to display in the table header
    const getAllRelevantSubjects = () => {
        // If a specific subject is selected, only show that subject
        if (selectedSubject) {
            const filteredSubjects = availableSubjects.filter(
                (subject) => String(subject.id) === String(selectedSubject),
            );
            return filteredSubjects;
        }

        // For teachers, only show the subjects they teach
        if (role === "teacher") {
            const teacherSubjects = availableSubjects.filter((subject) =>
                teacherSubjectIds.includes(subject.id),
            );
            return teacherSubjects;
        }

        // For admins/assistants, show all subjects
        return availableSubjects;
    };

    // Extract unique teacher subjects from student memberships
    const getUniqueTeacherSubjects = () => {
        // For teachers, we should first use their assigned subjects from props
        if (
            role === "teacher" &&
            teacherSubjectIds &&
            teacherSubjectIds.length > 0
        ) {
            // Get subjects that match the teacher's assigned subject IDs
            const teacherAssignedSubjects = availableSubjects.filter(
                (subject) => teacherSubjectIds.includes(subject.id),
            );

            if (teacherAssignedSubjects.length > 0) {
                return teacherAssignedSubjects;
            }
        }

        // Get all unique subject IDs assigned to the selected teacher from memberships
        const teacherSubjects = new Set();
        const teacherSubjectNames = new Map(); // Store subject ID to name mapping

        // For each student's memberships
        Object.values(studentMemberships || {}).forEach((membershipData) => {
            // Check if we have a teachers array in the membership data
            if (membershipData && Array.isArray(membershipData.teachers)) {
                // Look through each teacher assignment in the membership
                membershipData.teachers.forEach((teacherInfo) => {
                    // For teachers, check if this assignment matches their ID
                    // For admin/assistant, check if it matches the selected teacher
                    const isRelevantTeacher =
                        (role === "teacher" &&
                            String(teacherInfo.teacherId) ===
                                String(selectedTeacher)) ||
                        (role !== "teacher" &&
                            selectedTeacher &&
                            String(teacherInfo.teacherId) ===
                                String(selectedTeacher));

                    if (isRelevantTeacher) {
                        // There are two possible formats: either we have a subjectId field or a subject field
                        if (teacherInfo.subjectId) {
                            // Format 1: { teacherId: "6", subjectId: "3", amount: 50 }
                            teacherSubjects.add(
                                parseInt(teacherInfo.subjectId),
                            );
                        } else if (teacherInfo.subject) {
                            // Format 2: { teacherId: "6", subject: "French", amount: 50 }
                            // For this format, we need to find the corresponding subject ID
                            const subjectObj = availableSubjects.find(
                                (s) => s.name === teacherInfo.subject,
                            );
                            if (subjectObj) {
                                teacherSubjects.add(subjectObj.id);
                                teacherSubjectNames.set(
                                    subjectObj.id,
                                    teacherInfo.subject,
                                );
                            }
                        }
                    }
                });
            }
        });

        // If we found any subjects assigned to this teacher, return them
        if (teacherSubjects.size > 0) {
            return availableSubjects.filter((subject) =>
                teacherSubjects.has(subject.id),
            );
        }

        // Fall back to all available subjects if no specific assignments found
        return availableSubjects;
    };

    // Get the current teacher's name when logged in as a teacher
    const getCurrentTeacherName = () => {
        if (role === "teacher" && selectedTeacher) {
            const teacher = teachers.find(
                (t) => String(t.id) === String(selectedTeacher),
            );
            return teacher ? `${teacher.first_name} ${teacher.last_name}` : "";
        }
        return "";
    };

    // Remove subject filter and reset availableSubjects for teacher
    const clearSubjectFilter = () => {
        setSelectedSubject("");
    };

    // Deep reset: use a resetKey to force re-render of selects and reset all state
    const resetAllFilters = () => {
        setSelectedTeacher("");
        setSelectedClass("");
        setSelectedSubject("");
        setAvailableClasses(classes);
        setAvailableStudents(students);
        setAvailableSubjects(subjects);
        setClassResults(results);
        setStudentMemberships({});
        setResetKey((k) => k + 1); // Force re-render of selects
    };

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-semibold">Résultats des élèves</h1>
                    {role === "teacher" && (
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <User size={16} className="text-lamaSky mr-1" />
                            <span className="font-medium text-lamaSky">
                                {getCurrentTeacherName()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={resetAllFilters}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center gap-1"
                        title="Réinitialiser tous les filtres"
                        type="button"
                    >
                        <XCircle size={16} />
                        <span>Réinitialiser les filtres</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                        <Filter className="w-4 h-4 text-white" />
                    </button>
                    {role === "admin" && (
                        <FormModal
                            table="result"
                            type="create"
                            levels={levels}
                            classes={availableClasses}
                            subjects={subjects}
                        />
                    )}
                </div>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Teacher Selection - Only shown for admin/assistant */}
                {role !== "teacher" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sélectionner un enseignant
                        </label>
                        <select
                            key={"teacher-" + resetKey}
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring-lamaPurple"
                        >
                            <option value="">Sélectionner un enseignant</option>
                            {teachers &&
                                teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.first_name} {teacher.last_name}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                {/* Class Selection - Use full width for teachers */}
                <div
                    className={
                        role === "teacher" ? "md:col-span-2 lg:col-span-1" : ""
                    }
                >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner une classe
                    </label>
                    <select
                        key={"class-" + resetKey}
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring-lamaPurple"
                        disabled={!selectedTeacher && role !== "teacher"}
                    >
                        <option value="">Sélectionner une classe</option>
                        {Array.isArray(availableClasses) && availableClasses.map((class_) => {
                            // Fallback: if class_.school_id is missing, get it from the original classes prop
                            let schoolId = class_.school_id;
                            if (typeof schoolId === 'undefined') {
                                const original = Array.isArray(classes) ? classes.find(c => c.id === class_.id) : null;
                                schoolId = original ? original.school_id : undefined;
                            }
                            const schoolList = Array.isArray(schools) ? schools : Object.values(schools || {});
                            const school = schoolList.find(s => Number(s.id) === Number(schoolId));
                            return (
                                <option key={class_.id} value={class_.id}>
                                    {class_.name} {school ? `(${school.name})` : "(École inconnue)"}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Subject Filter */}
                <div
                    className={
                        role === "teacher" ? "md:col-span-2 lg:col-span-2" : ""
                    }
                >
                    <label className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                        <span>Filtrer par matière</span>
                        {selectedSubject && (
                            <button
                                onClick={() => setSelectedSubject("")}
                                className="text-xs text-lamaPurple hover:text-lamaPurpleDark"
                            >
                                Afficher tout
                            </button>
                        )}
                    </label>
                    <select
                        key={"subject-" + resetKey}
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring-lamaPurple ${selectedSubject ? "bg-lamaPurple/10 border-lamaPurple/30" : ""}`}
                        disabled={!selectedClass}
                    >
                        <option value="">Toutes les matières</option>
                        {/* For teachers, only show subjects they teach */}
                        {(role === "teacher"
                            ? availableSubjects.filter((subject) =>
                                  teacherSubjectIds.includes(subject.id),
                              )
                            : availableSubjects
                        ).map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                    {role === "teacher" && !selectedSubject && (
                        <p className="mt-1 text-xs text-gray-500">
                            Vous pouvez sélectionner l'une de vos matières
                            assignées pour filtrer l'affichage
                        </p>
                    )}
                    {selectedSubject && (
                        <p className="mt-1 text-xs text-gray-500">
                            Affichage uniquement de{" "}
                            {availableSubjects.find(
                                (s) => String(s.id) === String(selectedSubject),
                            )?.name || "la matière sélectionnée"}
                        </p>
                    )}
                </div>
            </div>

            {/* RESULTS TABLE */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">
                        Chargement des notes des élèves...
                    </p>
                </div>
            ) : selectedClass &&
              availableStudents &&
              availableStudents.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nom de l'élève
                                </th>
                                {getAllRelevantSubjects().map((subject) => (
                                    <th
                                        key={subject.id}
                                        className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider
                      ${
                          selectedSubject &&
                          String(subject.id) === String(selectedSubject)
                              ? "bg-lamaPurple/10 text-lamaPurple"
                              : ""
                      }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {subject.name}
                                            </span>
                                            <div className="grid grid-cols-4 gap-2 text-xxs">
                                                <span className="font-normal">
                                                    Note 1 (/20)
                                                </span>
                                                <span className="font-normal">
                                                    Note 2 (/20)
                                                </span>
                                                <span className="font-normal">
                                                    Note 3 (/20)
                                                </span>
                                                <span className="font-normal">
                                                    Remarques
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {availableStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {student.first_name}{" "}
                                            {student.last_name}
                                        </div>
                                    </td>
                                    {/* Only show columns for the subjects that match our filter criteria */}
                                    {getAllRelevantSubjects().map((subject) => {
                                        const studentResults =
                                            classResults[student.id] || [];
                                        const result = studentResults.find(
                                            (r) => r.subject_id === subject.id,
                                        );

                                        return (
                                            <td
                                                key={subject.id}
                                                className={`p-0 border-l border-gray-200
                          ${
                              selectedSubject &&
                              String(subject.id) === String(selectedSubject)
                                  ? "bg-lamaPurple/5"
                                  : ""
                          }`}
                                            >
                                                <div className="grid grid-cols-4 divide-x divide-gray-200">
                                                    {/* Grade 1 */}
                                                    {renderGradeCell(
                                                        student.id,
                                                        subject.id,
                                                        "grade1",
                                                        "../20",
                                                        result?.grade1,
                                                    )}

                                                    {/* Grade 2 */}
                                                    {renderGradeCell(
                                                        student.id,
                                                        subject.id,
                                                        "grade2",
                                                        "../20",
                                                        result?.grade2,
                                                    )}

                                                    {/* Grade 3 */}
                                                    {renderGradeCell(
                                                        student.id,
                                                        subject.id,
                                                        "grade3",
                                                        "../20",
                                                        result?.grade3,
                                                    )}

                                                    {/* Notes */}
                                                    {renderGradeCell(
                                                        student.id,
                                                        subject.id,
                                                        "notes",
                                                        "Remarques",
                                                        result?.notes,
                                                    )}
                                                </div>
                                                {result?.final_grade && (
                                                    <div className="text-center py-1 border-t border-gray-200 bg-gray-50">
                                                        <span
                                                            className={`text-xs font-bold ${getGradeColor(result.final_grade)}`}
                                                        >
                                                            Final:{" "}
                                                            {result.final_grade}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="mb-4">
                        <Filter className="w-10 h-10 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">
                        {!selectedClass
                            ? "Veuillez sélectionner une classe pour afficher et modifier les notes des élèves"
                            : "Aucun élève trouvé dans cette classe"}
                    </p>
                    {!selectedClass ? (
                        <p className="text-gray-500 text-sm">
                            Choisissez une classe dans le menu déroulant ci-dessus
                            pour commencer
                        </p>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Essayez de sélectionner une autre classe ou contactez
                            l'administrateur
                        </p>
                    )}
                </div>
            )}

            {/* RESET BUTTON - Always at the bottom */}
            {/* <div className="mt-4">
                <button
                    onClick={resetAllFilters}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center gap-1"
                    title="Réinitialiser tous les filtres"
                    type="button"
                >
                    <span>Réinitialiser les filtres</span>
                </button>
            </div> */}
        </div>
    );
}

ResultsPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
