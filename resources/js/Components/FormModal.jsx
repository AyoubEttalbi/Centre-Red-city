import { Edit, Icon, Plus, Trash2, UserRoundPen } from "lucide-react";
import React, { lazy, Suspense, useState } from "react";
import DeleteConfirmation from "./DeleteConfirmation";
import { X } from "lucide-react";
const OfferForm = lazy(() => import("./forms/OfferForm"));
const TeacherForm = lazy(() => import("./forms/TeacherForm"));
const StudentForm = lazy(() => import("./forms/StudentForm"));
const ClasseForm = lazy(() => import("./forms/ClasseForm"));
const MembershipForm = lazy(() => import("./forms/MembershipForm"));
const AssistantForm = lazy(() => import("./forms/AssistantForm"));
const SubjectForm = lazy(() => import("./forms/SubjectForm"));
const LevelForm = lazy(() => import("./forms/LevelForm"));
const InvoicesFrom = lazy(() => import("./forms/InvoicesFrom"));
const SchoolForm = lazy(() => import("./forms/SchoolForm"));
const ResultForm = lazy(() => import("./forms/ResultForm"));

const forms = {
    offer: OfferForm,
    teacher: TeacherForm,
    student: StudentForm,
    assistant: AssistantForm,
    class: ClasseForm,
    membership: MembershipForm,
    subject: SubjectForm,
    level: LevelForm,
    invoice: InvoicesFrom,
    school: SchoolForm,
    result: ResultForm,
};

const FormModal = ({
    table,
    type,
    icon,
    data,
    screen,
    id,
    levels,
    route,
    subjects,
    classes,
    schools,
    offers,
    teachers,
    studentId,
    StudentMemberships,
}) => {
    const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
    const bgColor =
        type === "create" || type === "update"
            ? "bg-lamaYellow"
            : "bg-lamaPurple";

    const [open, setOpen] = useState(false);

    const Form = () => {
        const FormComponent = forms[table];
        return FormComponent ? (
            <Suspense fallback={<h1>Chargement...</h1>}>
                <FormComponent
                    type={type}
                    data={data}
                    levels={levels}
                    schools={schools}
                    subjects={subjects}
                    teachers={teachers}
                    classes={classes}
                    offers={offers}
                    setOpen={setOpen}
                    studentId={studentId}
                    StudentMemberships={StudentMemberships}
                />
            </Suspense>
        ) : (
            <p>Formulaire introuvable !</p>
        );
    };

    return (
        <>
            {table === "membership" && type === "create" ? (
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-1 h-8 flex items-center"
                    onClick={() => setOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Nouveau
                </button>
            ) : table === "invoice" && type === "create" ? (
                <button
                    className="bg-black hover:bg-neutral-700 text-white rounded-full px-3 py-1 h-8 flex items-center"
                    onClick={() => setOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {screen === "small" ? null : "Nouveau"}
                </button>
            ) 
            : table === "invoice" && type === "create" && screen === "small" ? (
                <button
                    className="bg-black hover:bg-neutral-700 text-white rounded-full px-3 py-1 h-8 flex items-center"
                    onClick={() => setOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    
                </button>
                
            )
            : table === "membership" && type === "update" ? (
                <button
                    className="text-blue-500 hover:text-blue-600"
                    onClick={() => setOpen(true)}
                >
                    <Edit className="h-5 w-5 " />
                </button>
            ) : icon === "updateIcon2" ? (
                <button
                    className="flex items-center justify-center rounded-full w-10 h-1 "
                    onClick={() => setOpen(true)}
                >
                    <UserRoundPen className="w-10  text-black" />
                </button>
            ) : (
                <button
                    className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
                    onClick={() => setOpen(true)}
                >
                    {type === "delete" ? (
                        <Trash2 className="w-4 h-4 text-white" />
                    ) : (
                        <img
                            src={`/${type}.png`}
                            alt=""
                            width={16}
                            height={16}
                        />
                    )}
                </button>
            )}
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    {type === "delete" ? (
                        table === "user" ? (
                            <DeleteConfirmation
                                route={"users"}
                                id={id}
                                onDelete={() => {
                                    setOpen(false); // Fermer le modal après la suppression
                                }}
                                onClose={() => setOpen(false)} // Passer onClose pour fermer le modal
                            />
                        ) : (
                            <DeleteConfirmation
                                route={route}
                                id={id}
                                onDelete={() => {
                                    setOpen(false); // Fermer le modal après la suppression
                                }}
                                onClose={() => setOpen(false)} // Passer onClose pour fermer le modal
                            />
                        )
                    ) : (
                        <div className="bg-white modal-scrollable p-6 rounded-lg shadow-lg relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
                            <Form />
                            <button
                                className="absolute text-lg text-gray-700 top-4 right-4 p-2 rounded-full hover:text-black transition-all duration-200"
                                onClick={() => setOpen(false)}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default FormModal;
