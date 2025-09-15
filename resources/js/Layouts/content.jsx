import React, { Suspense, lazy, useState } from "react";
const Announcements = lazy(() => import("@/Pages/Menu/Announcements/Announcements"));
const AttendanceChart = lazy(() => import("@/Pages/Attendance/AttendanceChart"));
const CountChart = lazy(() => import("@/Pages/Invoices/CountChart"));
const FinanceChart = lazy(() => import("@/Components/FinanceChart"));
const UserCard = lazy(() => import("@/Components/UserCard"));
const EventCalendar = lazy(() => import("@/Components/EventCalendar"));
const MostSellingOffersChart = lazy(() => import("@/Components/MostSellingOffersChart"));
import CombinedUserCard from "@/Components/CombinedUserCard";
import { usePage, router } from "@inertiajs/react";
import { School } from "lucide-react";

const Content = () => {
    const { props } = usePage();
    const { auth } = props;
    const userRole = auth.user.role;
    // Use selected school from props if available, else default to first
    const [selectedSchool, setSelectedSchool] = useState(props.selectedSchoolId || props.schools?.[0]?.id || "");

    // Handler for school change: reload dashboard with selected school
    const handleSchoolChange = (e) => {
        setSelectedSchool(e.target.value);
        // Preserve existing filters (like student_stats_month) when changing school
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('school_id', e.target.value);
        router.get(route("dashboard"), Object.fromEntries(currentParams), { preserveState: true, preserveScroll: true });
    };

    return (
        <div>
            {/* Top bar with dashboard title and school selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 mt-2 px-3 sm:px-4 gap-3 sm:gap-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 order-1 sm:order-1">
                    Tableau de bord
                </h1>
                {/* School Selector */}
                {props.schools && props.schools.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-2 sticky top-4 z-30 bg-white/95 shadow-md rounded-xl px-3 sm:px-4 py-2 border border-blue-100" style={{ minWidth: 'fit-content' }}>
                        <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                        <label htmlFor="school-select" className="text-xs sm:text-sm font-semibold text-slate-700 mr-2 whitespace-nowrap">
                            École
                        </label>
                        <select
                            id="school-select"
                            value={selectedSchool}
                            onChange={handleSchoolChange}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-xs sm:text-sm shadow-sm min-w-0 flex-1 sm:flex-none"
                        >
                            {props.schools.map((school) => (
                                <option key={school.id} value={school.id}>
                                    {school.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="p-2 sm:p-4 flex gap-4 flex-col md:flex-row">
                {/* LEFT */}
                <div className="w-full lg:w-full lg:px-6 xl:px-12 flex flex-col gap-6 sm:gap-8">
                    {/* USER CARDS */}
                    <div className="flex gap-3 sm:gap-4 justify-between bg-white flex-wrap">
                        
                        <Suspense fallback={<div>Chargement...</div>}>
                            <UserCard
                                type="student"
                                counts={props.studentCounts}
                                totalCount={props.totalStudentCount}
                                schoolId={selectedSchool}
                            />
                        </Suspense>
                        <Suspense fallback={<div>Chargement...</div>}>
                            <UserCard
                                type="teacher"
                                counts={props.teacherCounts}
                                totalCount={props.totalTeacherCount}
                                schoolId={selectedSchool}
                            />
                        </Suspense>
                        <Suspense fallback={<div>Chargement...</div>}>
                            <UserCard
                                type="assistant"
                                counts={props.assistantCounts}
                                totalCount={props.totalAssistantCount}
                                schoolId={selectedSchool}
                            />
                        </Suspense>
                        <Suspense fallback={<div>Chargement...</div>}>
                            <CombinedUserCard
                                stats={props.studentMonthlyStats}
                                schools={props.schools}
                                selectedSchool={selectedSchool}
                            />
                        </Suspense>
                    </div>
                    {/* MIDDLE CHARTS */}
                    <div className="flex gap-3 sm:gap-4 flex-col bg-white lg:flex-row">
                        {/* COUNT CHART */}
                        <div className="w-full lg:w-1/3 h-[350px] sm:h-[450px]">
                            <Suspense fallback={<div>Chargement...</div>}>
                                <CountChart schoolId={selectedSchool} />
                            </Suspense>
                        </div>
                        {/* ATTENDANCE CHART */}
                        <div className="w-full lg:w-2/3 bg-white h-[350px] sm:h-[450px]">
                            <Suspense fallback={<div>Chargement...</div>}>
                                <AttendanceChart schoolId={selectedSchool} />
                            </Suspense>
                        </div>
                    </div>
                    {/* BOTTOM CHARTS */}
                    <div className="w-full bg-white h-[400px] sm:h-[500px]">
                        <Suspense fallback={<div>Chargement...</div>}>
                            <FinanceChart schoolId={selectedSchool} monthlyIncomes={props.monthlyIncomes} />
                        </Suspense>
                    </div>
                    {/* MOST SELLING OFFERS CHART */}
                    <div className="w-full bg-white h-[350px] sm:h-[400px]">
                        <Suspense fallback={<div>Chargement...</div>}>
                            <MostSellingOffersChart schoolId={selectedSchool} mostSellingOffers={props.mostSellingOffers} />
                        </Suspense>
                    </div>
                    {/* RIGHT */}
                {/* <div className="w-full flex flex-row gap-4">
                    <Suspense fallback={<div>Chargement...</div>}>
                        <EventCalendar schoolId={selectedSchool} />
                    </Suspense>
                    <Suspense fallback={<div>Chargement...</div>}>
                        <Announcements
                            announcements={props.announcements}
                            userRole={userRole}
                            limit={5}
                            schoolId={selectedSchool}
                        />
                    </Suspense>
                </div> */}
                </div>
                
            </div>
        </div>
    );
};

export default Content;
