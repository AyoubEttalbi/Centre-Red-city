import { Link, router, usePage } from "@inertiajs/react";
import TableSearch from "../../Components/TableSearch";
import Table from "../../Components/Table";
import Pagination from "../../Components/Pagination";
import DashboardLayout from "@/Layouts/DashboardLayout";
import FormModal from "../../Components/FormModal";
import Register from "../Auth/Register";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Edit, Eye, Plus, PlusIcon, RotateCcw } from "lucide-react";
import UpdateUser from "../Auth/UpdateUser";
import UserFilterForm from "../../Components/UserFilterForm";
// Define table columns for users
const columns = [
    {
        header: "Nom",
        accessor: "name",
    },
    {
        header: "E-mail",
        accessor: "email",
        className: "hidden md:table-cell",
    },
    {
        header: "Rôle",
        accessor: "role",
        className: "hidden md:table-cell",
    },
    {
        header: "Créé le",
        accessor: "created_at",
        className: "hidden md:table-cell",
    },
    {
        header: "Actions",
        accessor: "actions",
    },
];

const UserListPage = ({ users, filters: initialFilters = {}, roles = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState({
        isOpen: false,
        id: null,
    });
    const role = usePage().props.auth.user.role;
    // Filter/search state
    const [filters, setFilters] = useState({
        search: initialFilters.search || "",
        role: initialFilters.role || "all",
    });
    const [showFilters, setShowFilters] = useState(false);

    // Debounced filter/search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route("users.index"), { ...filters }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        router.get(route("users.index"), { ...newFilters, page: 1 }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setFilters({ search: "", role: "all" });
        router.get(route("users.index"), {}, { preserveState: false, replace: true, preserveScroll: true });
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const handleViewAs = (userId) => {
        router.post(
            `/admin/view-as/${userId}`,
            {},
            {
                onSuccess: () => {
                    router.visit("/dashboard");
                },
                onError: (errors) => {},
            },
        );
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split("T")[0];
    };

    const renderRow = (user) => (
        <tr
            key={user.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
        >
            <td className="flex items-center gap-4 p-4">
                <img
                    src={
                        user.profile_image ? user.profile_image : "/avatar.png"
                    }
                    alt={user.name}
                    width={40}
                    height={40}
                    className="hidden md:block xl:block w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-xs text-gray-500 lg:hidden md:block">
                        {user.email}
                    </p>
                </div>
            </td>
            <td className="p-4 hidden md:table-cell">{user.email}</td>
            <td className="hidden md:table-cell">
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                            ? "bg-blue-100 text-blue-600"
                            : user.role === "assistant"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                    }`}
                >
                    {user.role === "admin"
                        ? "Administrateur"
                        : user.role === "assistant"
                        ? "Assistant"
                        : user.role === "teacher"
                        ? "Enseignant"
                        : user.role === "student"
                        ? "Élève"
                        : user.role}
                </span>
            </td>
            <td className="hidden md:table-cell p-4">
                {formatDate(user.created_at)}
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    {role === "admin" && (
                        <>
                            <button
                                disabled={user.role === "admin"}
                                onClick={() => handleViewAs(user.id)}
                                className={`p-2 bg-blue-500 ${user.role === "admin" ? "opacity-50 cursor-not-allowed" : ""} text-white rounded-full hover:bg-blue-600 transition duration-200`}
                            >
                                <Eye className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={() =>
                                    setIsUpdateOpen({
                                        ...isUpdateOpen,
                                        isOpen: true,
                                        id: user.id,
                                    })
                                }
                                className="p-2 bg-lamaYellow  text-black rounded-full hover:bg-yellow-500 transition duration-200"
                            >
                                <Edit className="w-4 h-4 text-white" />
                            </button>
                            <FormModal
                                table="user"
                                type="delete"
                                id={user.id}
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    // Use paginated data
    const paginatedUsers = Array.isArray(users.data) ? users.data : users;

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">
                    Tous les utilisateurs
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch
                        routeName="users.index"
                        value={filters.search}
                        onChange={(value) =>
                            setFilters((prev) => ({ ...prev, search: value }))
                        }
                    />

                    <div className="flex items-center gap-4 self-end">
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
                                alt="Filter"
                                width={14}
                                height={14}
                            />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2 bg-lamaYellow text-black rounded-full hover:bg-yellow-500 transition duration-200"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTER FORM */}
            {showFilters && (
                <UserFilterForm
                    roles={roles}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            )}

            {isModalOpen && (
                <Register
                    isModalOpen={isModalOpen}
                    table={"users"}
                    setIsModalOpen={setIsModalOpen}
                />
            )}
            {isUpdateOpen && (
                <UpdateUser
                    isUpdateOpen={isUpdateOpen}
                    userData={users}
                    type={"update"}
                    setIsUpdateOpen={setIsUpdateOpen}
                />
            )}
            <Table
                columns={columns}
                data={paginatedUsers}
                renderRow={renderRow}
                filters={filters}
                emptyText="Aucun utilisateur trouvé."
            />
            {/* PAGINATION */}
            {users.links && (
                <Pagination links={users.links} filters={filters} />
            )}
        </div>
    );
};

UserListPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default UserListPage;
