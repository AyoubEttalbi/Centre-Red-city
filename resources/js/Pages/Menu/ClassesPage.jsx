import { Link, router, usePage } from "@inertiajs/react";
import FormModal from "../../Components/FormModal";
import TableSearch from "../../Components/TableSearch";
import Table from "../../Components/Table";
import Pagination from "../../Components/Pagination";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Eye, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const columns = [
    { header: "Nom", accessor: "name" },
    { header: "Niveau", accessor: "level", className: "hidden md:table-cell" },
    {
        header: "Nombre d'élèves",
        accessor: "numStudents",
        className: "hidden md:table-cell",
    },
    {
        header: "Nombre d'enseignants",
        accessor: "numTeachers",
        className: "hidden lg:table-cell",
    },
    { header: "École", accessor: "school", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "action" },
];

const ClassesPage = ({ classes, schools, levels, filters: initialFilters }) => {
    const role = usePage().props.auth.user.role;
    const isAdmin = role === "admin";

    // State for filters and search
    const [filters, setFilters] = useState({
        level: initialFilters?.level || "",
        school: initialFilters?.school || "",
        search: initialFilters?.search || "",
    });

    const [showFilters, setShowFilters] = useState(false);

    // Debounced function to apply filters
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                route("classes.index"),
                { ...filters },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);

        router.get(
            route("classes.index"),
            {
                ...newFilters,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Clear filters and reset the page
    const clearFilters = () => {
        setFilters({
            level: "",
            school: "",
            search: "",
        });

        router.get(
            route("classes.index"),
            {},
            { preserveState: false, replace: true, preserveScroll: true },
        );
    };

    // Toggle visibility of filters
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const renderRow = (classe) => (
        <tr
            key={classe.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight cursor-pointer"
        >
            <td
                onClick={() => router.visit(`/classes/${classe.id}`)}
                className="p-4 font-semibold"
            >
                {classe.name}
            </td>
            <td
                onClick={() => router.visit(`/classes/${classe.id}`)}
                className="hidden md:table-cell"
            >
                {levels.find((level) => level.id === classe.level_id)?.name}
            </td>
            <td className="hidden md:table-cell text-gray-500">
                {classe.number_of_students}
            </td>
            <td className="hidden lg:table-cell text-gray-500">
                {classe.number_of_teachers}
            </td>
            <td className="hidden lg:table-cell">
                {schools.find((school) => school.id === classe.school_id)?.name}
            </td>
            <td>
                <div className="flex items-center gap-2">
                    <Link href={`/classes/${classe.id}`}>
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                            <Eye className="w-4 h-4 text-white" />
                        </button>
                    </Link>
                    {isAdmin && (
                        <>
                            <FormModal
                                table="class"
                                type="update"
                                id={classe.id}
                                data={classe}
                                groups={classes}
                                levels={levels}
                                schools={schools}
                                route="classes"
                            />
                            <FormModal
                                table="class"
                                type="delete"
                                id={classe.id}
                                route="classes"
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">
                    {role === "teacher" ? "Mes classes" : "Toutes les classes"}
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch
                        routeName="classes.index"
                        value={filters.search}
                        onChange={(value) =>
                            setFilters((prev) => ({ ...prev, search: value }))
                        }
                    />
                    <div className="flex items-center gap-4 self-end">
                        {classes.length > 0 && (
                            <>
                                <button
                                    onClick={clearFilters}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                                >
                                    <RotateCcw className="w-4 h-4 text-black" />
                                </button>
                                <button
                                    onClick={toggleFilters}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                                >
                                    <img
                                        src="/filter.png"
                                        alt="Filtrer"
                                        width={14}
                                        height={14}
                                    />
                                </button>
                            </>
                        )}
                        {isAdmin && (
                            <FormModal
                                table="class"
                                type="create"
                                levels={levels}
                                schools={schools}
                                route="classes"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* FILTER FORM */}
            {showFilters && (
                <div className="my-4 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Niveau
                            </label>
                            <select
                                name="level"
                                value={filters.level}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring-lamaPurple"
                            >
                                <option value="">Tous les niveaux</option>
                                {levels.map((level) => (
                                    <option key={level.id} value={level.id}>
                                        {level.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                École
                            </label>
                            <select
                                name="school"
                                value={filters.school}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-lamaPurple focus:ring-lamaPurple"
                            >
                                <option value="">Toutes les écoles</option>
                                {schools?.map((school) => (
                                    <option key={school.id} value={school.id}>
                                        {school.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Show a message if no classes are available */}
            {classes.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    {role === "teacher"
                        ? "Vous n'êtes pas encore affecté à une classe."
                        : "Aucune classe disponible."}
                </div>
            ) : (
                /* LIST */
                <Table columns={columns} renderRow={renderRow} data={classes} />
            )}
        </div>
    );
};

ClassesPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default ClassesPage;
