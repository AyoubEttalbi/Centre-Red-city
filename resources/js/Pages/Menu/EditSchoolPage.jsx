import React, { useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function EditSchoolPage({ school }) {
    const { auth } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: school.name || "",
        address: school.address || "",
        phone_number: school.phone_number || "",
        email: school.email || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("schools.update", school.id),{
            onSuccess: () => {
                router.visit(route("schools.show", school.id));
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link href={route("schools.show", school.id)} className="mr-4">
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold">Edit School</h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            School Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="address"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Address
                        </label>
                        <input
                            type="text"
                            id="address"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="phone_number"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Phone Number
                        </label>
                        <input
                            type="text"
                            id="phone_number"
                            value={data.phone_number}
                            onChange={(e) =>
                                setData("phone_number", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.phone_number && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.phone_number}
                            </p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

EditSchoolPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
