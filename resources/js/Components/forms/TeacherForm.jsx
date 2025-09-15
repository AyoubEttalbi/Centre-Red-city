import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import InputField from "../InputField";
import { router, Link } from "@inertiajs/react";
import {
    Check,
    ChevronsUpDown,
    X,
    Upload,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import UserForm from "./UserForm";
import UpdateUser from "@/Pages/Auth/UpdateUser";

// Définir le schéma de validation
const schema = z.object({
    firstName: z.string().min(1, { message: "Le prénom est requis !" }),
    lastName: z.string().min(1, { message: "Le nom est requis !" }),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email({ message: "Adresse e-mail invalide !" }),
    status: z.enum(["active", "inactive"]),
    subjects: z
        .array(z.object({ id: z.number(), name: z.string() }))
        .optional(),
    wallet: z.coerce
        .number()
        .nonnegative({ message: "Le solde doit être positif !" }),
    classes: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    schools: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    profile_image: z.any().optional(),
});

const TeacherForm = ({ type, data, subjects, classes, schools, setOpen }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(
        data?.status || "active",
    );
    const [selectedSubjects, setSelectedSubjects] = useState(
        data?.subjects || [],
    );
    const [selectedClasses, setSelectedClasses] = useState(
        data?.classes?.map(({ id, name }) => ({ id, name })) || [],
    );
    const [selectedSchools, setSelectedSchools] = useState(
        data?.schools?.map(({ id, name }) => ({ id, name })) || [],
    );
    const [imagePreview, setImagePreview] = useState(
        data?.profile_image || null,
    );
    const [loading, setLoading] = useState(false);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userFormData, setUserFormData] = useState({
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        email: data?.email || "",
        password: "",
        password_confirmation: "",
        role: "teacher",
    });
    const [userFormErrors, setUserFormErrors] = useState({});
    const [userFormProcessing, setUserFormProcessing] = useState(false);
    const [updateUserModalOpen, setUpdateUserModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
        getValues,
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: data?.first_name || "",
            lastName: data?.last_name || "",
            address: data?.address || "",
            phoneNumber: data?.phone_number || "",
            email: data?.email || "",
            status: data?.status || "active",
            subjects: data?.subjects || [],
            wallet: data?.wallet || 0,
            classes: data?.classes?.map(({ id, name }) => ({ id, name })) || [],
            schools: data?.schools?.map(({ id, name }) => ({ id, name })) || [],
            profile_image: null,
        },
    });

    // Watch the form fields for changes
    const firstName = watch("firstName");
    const lastName = watch("lastName");
    const email = watch("email");
    const status = watch("status");
    const wallet = watch("wallet");
    const subjectsVal = watch("subjects");
    const classesVal = watch("classes");
    const schoolsVal = watch("schools");

    // Check if all required fields are filled
    const isTeacherFormComplete =
        firstName?.trim() &&
        lastName?.trim() &&
        email?.trim() &&
        /^\S+@\S+\.\S+$/.test(email) &&
        status &&
        wallet !== undefined && wallet !== null && wallet !== "" && !isNaN(wallet) && Number(wallet) >= 0 &&
        Array.isArray(subjectsVal) && subjectsVal.length > 0 &&
        Array.isArray(classesVal) && classesVal.length > 0 &&
        Array.isArray(schoolsVal) && schoolsVal.length > 0;

    // Prepare user data for the Register component
    const userData = {
        name: `${firstName} ${lastName}`,
        email: email,
    };

    // Handle image change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setValue("profile_image", file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = handleSubmit((formData) => {
        // Create a FormData object to properly handle file uploads
        const formDataObj = new FormData();

        // Append all form fields
        formDataObj.append("first_name", formData.firstName);
        formDataObj.append("last_name", formData.lastName);
        formDataObj.append("address", formData.address || "");
        formDataObj.append("phone_number", formData.phoneNumber || "");
        formDataObj.append("email", formData.email);
        formDataObj.append("status", formData.status);
        formDataObj.append("wallet", formData.wallet);

        // Append the file if it exists
        if (formData.profile_image) {
            formDataObj.append("profile_image", formData.profile_image);
        }

        // Append each subject ID
        formData.subjects?.forEach((subject, index) => {
            formDataObj.append(`subjects[${index}]`, subject.id);
        });

        // Append each class ID
        formData.classes?.forEach((cls, index) => {
            formDataObj.append(`classes[${index}]`, cls.id);
        });

        // Append each school ID
        formData.schools?.forEach((school, index) => {
            formDataObj.append(`schools[${index}]`, school.id);
        });

        setLoading(true);

        if (type === "create") {
            router.post("/teachers", formDataObj, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setOpen(false);
                    setLoading(false);
                },
                onError: (errors) => {
                    setLoading(false);
                },
            });
        } else if (type === "update") {
            // For update, we need to use method spoofing with Inertia
            formDataObj.append("_method", "PUT");

            // Add flag to indicate this is a form update
            formDataObj.append("is_form_update", "1");

            router.post(`/teachers/${data.id}`, formDataObj, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setOpen(false);
                    setLoading(false);
                },
                onError: (errors) => {
                    setLoading(false);
                },
            });
        }
    });

    // Helper function to toggle selection in multi-select
    const toggleSelection = (
        item,
        currentSelection,
        setSelection,
        fieldName,
    ) => {
        const isSelected = currentSelection.some(
            (selected) => selected.id === item.id,
        );

        let newSelection;
        if (isSelected) {
            newSelection = currentSelection.filter(
                (selected) => selected.id !== item.id,
            );
        } else {
            newSelection = [...currentSelection, item];
        }

        setSelection(newSelection);
        setValue(fieldName, newSelection);
    };

    // Helper to remove an item from selection
    const removeItem = (item, currentSelection, setSelection, fieldName) => {
        const newSelection = currentSelection.filter(
            (selected) => selected.id !== item.id,
        );
        setSelection(newSelection);
        setValue(fieldName, newSelection);
    };

    // Add password generator
    function generateStrongPassword() {
        const length = 18;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        return password;
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                className="flex flex-col gap-8"
                onSubmit={onSubmit}
                encType="multipart/form-data"
            >
                <h1 className="text-xl font-semibold">
                    {type === "create"
                        ? "Créer un nouvel enseignant"
                        : "Modifier l'enseignant"}
                </h1>
                {/* Informations personnelles */}
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                    <InputField
                        label="Prénom"
                        name="firstName"
                        register={register}
                        error={errors.firstName}
                    />
                    <InputField
                        label="Nom"
                        name="lastName"
                        register={register}
                        error={errors.lastName}
                    />
                    <InputField
                        label="Adresse"
                        name="address"
                        register={register}
                        error={errors.address}
                    />
                    <InputField
                        label="Téléphone"
                        name="phoneNumber"
                        register={register}
                        error={errors.phoneNumber}
                    />
                    <InputField
                        label="E-mail"
                        name="email"
                        register={register}
                        error={errors.email}
                    />
                    <InputField
                        label="Solde du portefeuille"
                        name="wallet"
                        type="number"
                        register={register}
                        error={errors.wallet}
                    />
                    {/* Import d'image de profil */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs text-gray-500">
                            Image de profil
                        </label>
                        <div className="flex flex-col gap-2">
                            {imagePreview && (
                                <div className="relative w-24 h-24 mb-2">
                                    <img
                                        src={imagePreview}
                                        alt="Aperçu du profil"
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                </div>
                            )}
                            <label
                                htmlFor="profile_image"
                                className="flex items-center gap-2 cursor-pointer p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 w-full"
                            >
                                <Upload className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                    {imagePreview
                                        ? "Changer l'image"
                                        : "Télécharger une image"}
                                </span>
                                <input
                                    id="profile_image"
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                            {errors.profile_image && (
                                <p className="text-xs text-red-400">
                                    {errors.profile_image.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Informations supplémentaires */}
                <div className="flex flex-wrap gap-4">
                    {/* Statut */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-600">Statut</label>
                        <Select
                            value={selectedStatus}
                            onValueChange={(value) => {
                                setSelectedStatus(value);
                                setValue("status", value);
                            }}
                        >
                            <SelectTrigger className="w-full bg-white ring-1 ring-gray-300 p-2 rounded-md text-sm">
                                <SelectValue placeholder="Sélectionner le statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="inactive">Inactif</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-xs text-red-400">
                                {errors.status.message}
                            </p>
                        )}
                    </div>
                    {/* Multi-sélection des matières */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-600">Matières</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white ring-1 ring-gray-300 p-2 rounded-md text-sm h-auto min-h-10"
                                >
                                    {selectedSubjects.length > 0
                                        ? `${selectedSubjects.length} sélectionnées`
                                        : "Sélectionner les matières"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-full p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Rechercher une matière..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            Aucune matière trouvée.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {subjects?.map((subject) => (
                                                <CommandItem
                                                    key={subject.id}
                                                    onSelect={() =>
                                                        toggleSelection(
                                                            subject,
                                                            selectedSubjects,
                                                            setSelectedSubjects,
                                                            "subjects",
                                                        )
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <div
                                                        className={`flex-shrink-0 rounded-full p-1 ${
                                                            selectedSubjects.some(
                                                                (s) =>
                                                                    s.id ===
                                                                    subject.id,
                                                            )
                                                                ? "text-black"
                                                                : "opacity-50"
                                                        }`}
                                                    >
                                                        <Check
                                                            className={`h-4 w-4 ${
                                                                selectedSubjects.some(
                                                                    (s) =>
                                                                        s.id ===
                                                                        subject.id,
                                                                )
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                    </div>
                                                    {subject.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSubjects.map((subject) => (
                                <Badge
                                    key={subject.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {subject.name}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                            removeItem(
                                                subject,
                                                selectedSubjects,
                                                setSelectedSubjects,
                                                "subjects",
                                            )
                                        }
                                    />
                                </Badge>
                            ))}
                        </div>
                        {errors.subjects && (
                            <p className="text-xs text-red-400">
                                {errors.subjects.message}
                            </p>
                        )}
                    </div>
                    {/* Multi-sélection des classes */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-600">Classes</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white ring-1 ring-gray-300 p-2 rounded-md text-sm h-auto min-h-10"
                                >
                                    {selectedClasses.length > 0
                                        ? `${selectedClasses.length} sélectionnées`
                                        : "Sélectionner les classes"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-full p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Rechercher une classe..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            Aucune classe trouvée.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {classes?.map((cls) => (
                                                <CommandItem
                                                    key={cls.id}
                                                    onSelect={() =>
                                                        toggleSelection(
                                                            cls,
                                                            selectedClasses,
                                                            setSelectedClasses,
                                                            "classes",
                                                        )
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <div
                                                        className={`flex-shrink-0 rounded-full p-1 ${
                                                            selectedClasses.some(
                                                                (c) =>
                                                                    c.id ===
                                                                    cls.id,
                                                            )
                                                                ? " text-black"
                                                                : "opacity-50"
                                                        }`}
                                                    >
                                                        <Check
                                                            className={`h-2 w-2 ${
                                                                selectedClasses.some(
                                                                    (c) =>
                                                                        c.id ===
                                                                        cls.id,
                                                                )
                                                                    ? "opacity-100 "
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                    </div>
                                                    {cls.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedClasses.map((cls) => (
                                <Badge
                                    key={cls.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {cls.name}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                            removeItem(
                                                cls,
                                                selectedClasses,
                                                setSelectedClasses,
                                                "classes",
                                            )
                                        }
                                    />
                                </Badge>
                            ))}
                        </div>
                        {errors.classes && (
                            <p className="text-xs text-red-400">
                                {errors.classes.message}
                            </p>
                        )}
                    </div>
                    {/* Multi-sélection des écoles */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-600">Écoles</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white ring-1 ring-gray-300 p-2 rounded-md text-sm h-auto min-h-10"
                                >
                                    {selectedSchools.length > 0
                                        ? `${selectedSchools.length} sélectionnées`
                                        : "Sélectionner les écoles"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-full p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Rechercher une école..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            Aucune école trouvée.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {schools?.map((school) => (
                                                <CommandItem
                                                    key={school.id}
                                                    onSelect={() =>
                                                        toggleSelection(
                                                            school,
                                                            selectedSchools,
                                                            setSelectedSchools,
                                                            "schools",
                                                        )
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <div
                                                        className={`flex-shrink-0 rounded-full p-1 ${
                                                            selectedSchools.some(
                                                                (s) =>
                                                                    s.id ===
                                                                    school.id,
                                                            )
                                                                ? "text-black"
                                                                : "opacity-50"
                                                        }`}
                                                    >
                                                        <Check
                                                            className={`h-4 w-4 ${
                                                                selectedSchools.some(
                                                                    (s) =>
                                                                        s.id ===
                                                                        school.id,
                                                                )
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                    </div>
                                                    {school.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSchools.map((school) => (
                                <Badge
                                    key={school.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {school.name}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                            removeItem(
                                                school,
                                                selectedSchools,
                                                setSelectedSchools,
                                                "schools",
                                            )
                                        }
                                    />
                                </Badge>
                            ))}
                        </div>
                        {errors.schools && (
                            <p className="text-xs text-red-400">
                                {errors.schools.message}
                            </p>
                        )}
                    </div>
                    {type === "create" ? (
                        <button
                            type="button"
                            onClick={() => {
                                setUserFormData(prev => ({
                                    ...prev,
                                    name: `${firstName || ""} ${lastName || ""}`.trim(),
                                    email: email || "",
                                }));
                                setUserModalOpen(true);
                            }}
                            className={`items-center mt-7 h-10 inline-flex gap-2 px-4 py-2 rounded-md shadow-sm transition-all
                                ${isTeacherFormComplete ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            disabled={!isTeacherFormComplete}
                        >
                            <ChevronDown className="w-4 h-4" />
                            <span>Ajouter un utilisateur</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setUpdateUserModalOpen(true)}
                            className={`items-center mt-7 h-10 inline-flex gap-2 px-4 py-2 rounded-md shadow-sm transition-all
                                bg-blue-500 hover:bg-blue-600 text-white cursor-pointer`}
                        >
                            <ChevronDown className="w-4 h-4" />
                            <span>Mettre à jour l'utilisateur</span>
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`bg-blue-500 hover:bg-blue-600 transition-all text-white p-2 rounded-md flex items-center justify-center ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Traitement...
                        </span>
                    ) : (
                        <span>{type === "create" ? "Créer" : "Mettre à jour"}</span>
                    )}
                </button>
            </form>
            {userModalOpen && type === "create" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
                        <button
                            onClick={() => setUserModalOpen(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-center mb-4">Créer un utilisateur</h2>
                            <UserForm
                                data={userFormData}
                                setData={(key, value) => setUserFormData(prev => ({ ...prev, [key]: value }))}
                                errors={userFormErrors}
                                processing={userFormProcessing}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setUserFormProcessing(true);
                                    setUserFormErrors({});
                                    // Validate teacher form
                                    let teacherValid = false;
                                    await handleSubmit((teacherData) => {
                                        teacherValid = true;
                                    })();
                                    // Validate user form (simple front validation)
                                    let userValid = true;
                                    let userErrors = {};
                                    if (!userFormData.name) { userErrors.name = "Le nom est requis"; userValid = false; }
                                    if (!userFormData.email) { userErrors.email = "L'email est requis"; userValid = false; }
                                    if (!userFormData.password) { userErrors.password = "Le mot de passe est requis"; userValid = false; }
                                    if (userFormData.password !== userFormData.password_confirmation) { userErrors.password_confirmation = "Les mots de passe ne correspondent pas"; userValid = false; }
                                    if (!userFormData.role) { userErrors.role = "Le rôle est requis"; userValid = false; }
                                    setUserFormErrors(userErrors);
                                    if (!teacherValid || !userValid) {
                                        setUserFormProcessing(false);
                                        return;
                                    }
                                    // Prepare combined data
                                    const teacherData = getValues();
                                    const formDataObj = new FormData();
                                    formDataObj.append("user[name]", userFormData.name);
                                    formDataObj.append("user[email]", userFormData.email);
                                    formDataObj.append("user[password]", userFormData.password);
                                    formDataObj.append("user[password_confirmation]", userFormData.password_confirmation);
                                    formDataObj.append("user[role]", userFormData.role);
                                    formDataObj.append("teacher[first_name]", teacherData.firstName);
                                    formDataObj.append("teacher[last_name]", teacherData.lastName);
                                    formDataObj.append("teacher[address]", teacherData.address || "");
                                    formDataObj.append("teacher[phone_number]", teacherData.phoneNumber || "");
                                    formDataObj.append("teacher[email]", teacherData.email);
                                    formDataObj.append("teacher[status]", teacherData.status);
                                    formDataObj.append("teacher[wallet]", teacherData.wallet);
                                    if (teacherData.profile_image) {
                                        formDataObj.append("teacher[profile_image]", teacherData.profile_image);
                                    }
                                    teacherData.subjects?.forEach((subject, index) => {
                                        formDataObj.append(`teacher[subjects][${index}]`, subject.id);
                                    });
                                    teacherData.classes?.forEach((cls, index) => {
                                        formDataObj.append(`teacher[classes][${index}]`, cls.id);
                                    });
                                    teacherData.schools?.forEach((school, index) => {
                                        formDataObj.append(`teacher[schools][${index}]`, school.id);
                                    });
                                    router.post("/teachers-with-user", formDataObj, {
                                        preserveScroll: true,
                                        forceFormData: true,
                                        onSuccess: (page) => {
                                            setUserModalOpen(false);
                                            setUserFormProcessing(false);
                                            setOpen(false);
                                            // If the backend returns JSON (AJAX), manually redirect to teachers list
                                            if (page?.props?.success || (typeof page === 'object' && page.success)) {
                                                router.visit('/teachers');
                                            }
                                        },
                                        onError: (errors) => {
                                            // Split errors between user and teacher
                                            const userErrs = {};
                                            const teacherErrs = {};
                                            Object.entries(errors).forEach(([key, val]) => {
                                                if (key.startsWith("user.")) userErrs[key.replace("user.", "")] = val;
                                                if (key.startsWith("teacher.")) teacherErrs[key.replace("teacher.", "")] = val;
                                            });
                                            setUserFormErrors(userErrs);
                                            setError && setError(teacherErrs);
                                            setUserFormProcessing(false);
                                        },
                                    });
                                }}
                                onPasswordAction={(field) => {
                                    if (field === "password") {
                                        const newPassword = generateStrongPassword();
                                        setUserFormData(prev => ({
                                            ...prev,
                                            password: newPassword,
                                            password_confirmation: newPassword,
                                        }));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {updateUserModalOpen && type === "update" && (
                <UpdateUser
                    userData={[{ id: data?.user_id, name: `${data?.first_name} ${data?.last_name}`, email: data?.email, role: "teacher" }]}
                    isUpdateOpen={{ isOpen: updateUserModalOpen, id: data?.user_id }}
                    setIsUpdateOpen={({ isOpen }) => setUpdateUserModalOpen(isOpen)}
                />
            )}
        </div>
    );
};

export default TeacherForm;