import React, { Suspense } from "react";
const AbsenceLogTableForStudent = React.lazy(() => import("./AbsenceLogTableForStudent"));
const InvoicesTable = React.lazy(() => import("./InvoicesTable"));
const ScoresTable = React.lazy(() => import("./ScoresTable"));

const StudentProfile = ({
    Student_memberships,
    invoices = [],
    studentId,
    studentClassId,
    attendances,
    results = [],
    student = null, // Add student prop
    Allclasses = [], // Add classes data
    Allschools = [], // Add schools data
}) => {
    return (
        <div className="p-8 bg-white">
            <Suspense fallback={<div>Chargement des factures...</div>}>
                <InvoicesTable
                    invoices={invoices}
                    Student_memberships={Student_memberships}
                    studentId={studentId}
                    student={student}
                    Allclasses={Allclasses}
                    Allschools={Allschools}
                />
            </Suspense>
            <Suspense fallback={<div>Chargement des absences...</div>}>
                <AbsenceLogTableForStudent
                    absences={attendances}
                    studentId={studentId}
                    studentClassId={studentClassId}
                />
            </Suspense>
            <Suspense fallback={<div>Chargement des résultats...</div>}>
                <ScoresTable scores={results} />
            </Suspense>
        </div>
    );
};

export default StudentProfile;
