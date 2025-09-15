import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React from "react";
import Content from "@/Layouts/content";
import DashboardLayout from "@/Layouts/DashboardLayout";
export default function Dashboard() {
    return (
        <DashboardLayout>
            <Content />
        </DashboardLayout>
    );
}
