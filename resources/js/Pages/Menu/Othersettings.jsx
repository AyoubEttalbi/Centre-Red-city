import LevelsList from "@/Components/LevelCard";
import SubjectsList from "@/Components/SubjectCard";
import SchoolsList from "@/Components/SchoolCard";
import SchoolYearTransition from "@/Components/SchoolYearTransition";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { usePage } from "@inertiajs/react";
import React from "react";

export default function Othersettings({ levels, subjects, schools }) {
    const role = usePage().props.auth.user.role;
    return (
        <div>
            {role === "admin" && (
                <>
                    <SchoolYearTransition />
                    <SchoolsList schoolsData={schools} />
                </>
            )}
            <SubjectsList subjectsData={subjects} />
            <LevelsList levelsData={levels} />
        </div>
    );
}

Othersettings.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
