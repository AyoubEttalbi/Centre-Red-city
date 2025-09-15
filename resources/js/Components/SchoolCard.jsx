import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import FormModal from "@/Components/FormModal";
import { Building2, Trash2, Eye } from "lucide-react";
import DeleteConfirmation from "./DeleteConfirmation";
import { Link } from "@inertiajs/react";

function SchoolCard({ school, onDelete }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex">
            <div className="w-full text-left flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="font-medium">{school.name}</span>
                        <p className="text-sm text-gray-500">
                            {school.address}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Link
                        href={`/schools/${school.id}`}
                        className="w-7 h-7 flex items-center hover:text-white text-black justify-center rounded-full bg-gray-100 transition-all duration-200 hover:bg-blue-500"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => onDelete(school)}
                        className="w-7 h-7 flex items-center hover:text-white text-black justify-center rounded-full bg-gray-100 transition-all duration-200 hover:bg-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SchoolsList({ schoolsData = [] }) {
    const [deleteSchool, setDeleteSchool] = useState(null);
    const role = usePage().props.auth.user.role;

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 md:mt-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="font-semibold text-2xl">Liste des écoles</h1>
                    {role === "admin" && (
                        <FormModal table="school" type="create" />
                    )}
                </div>
            </div>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {schoolsData.map((school) => (
                        <SchoolCard
                            key={school.id}
                            school={school}
                            onDelete={setDeleteSchool}
                        />
                    ))}
                </div>
            </div>

            {deleteSchool && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <DeleteConfirmation
                        id={deleteSchool.id}
                        route="othersettings/schools"
                        onDelete={() => setDeleteSchool(null)}
                        onClose={() => setDeleteSchool(null)}
                    />
                </div>
            )}
        </div>
    );
}

export default SchoolsList;
