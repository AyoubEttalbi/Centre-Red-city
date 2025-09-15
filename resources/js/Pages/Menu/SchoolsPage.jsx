import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import FormModal from "@/Components/FormModal";

import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import SchoolForm from "@/Components/forms/SchoolForm";

const SchoolsPage = ({ schools }) => {
    const role = usePage().props.auth.user.role;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [modalType, setModalType] = useState("create");

    const openCreateModal = () => {
        setSelectedSchool(null);
        setModalType("create");
        setIsModalOpen(true);
    };

    const openEditModal = (school) => {
        setSelectedSchool(school);
        setModalType("update");
        setIsModalOpen(true);
    };

    return (
        <div className="p-4">
            <Head title="Schools" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Schools</h1>
                {role === "admin" && (
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Add New School
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schools && schools.length > 0 ? (
                            schools.map((school) => (
                                <tr key={school.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {school.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {school.address}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {school.phone_number}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {school.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {role === "admin" && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(school)
                                                    }
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <Link
                                                    href={`/schools/${school.id}`}
                                                    method="delete"
                                                    as="button"
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </Link>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No schools found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <FormModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    title={
                        modalType === "create"
                            ? "Create New School"
                            : "Update School"
                    }
                >
                    <SchoolForm
                        type={modalType}
                        data={selectedSchool}
                        setOpen={setIsModalOpen}
                    />
                </FormModal>
            )}
        </div>
    );
};

SchoolsPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default SchoolsPage;
