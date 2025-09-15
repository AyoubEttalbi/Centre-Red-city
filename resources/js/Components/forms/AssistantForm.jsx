import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { router, usePage } from "@inertiajs/react";
import Select from "react-select";
import { useState } from "react";
import Register from "@/Pages/Auth/Register";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import UserForm from "./UserForm";
import UpdateUser from "@/Pages/Auth/UpdateUser";

// Définir le schéma de validation
const schema = z.object({
    first_name: z.string().min(1, { message: "Le prénom est requis !" }),
    last_name: z.string().min(1, { message: "Le nom est requis !" }),
    phone_number: z.string().min(1, { message: "Le numéro de téléphone est requis !" }),
    email: z.string().email({ message: "Adresse e-mail invalide !" }),
    address: z.string().min(1, { message: "L'adresse est requise !" }),
    status: z.enum(["active", "inactive"], { message: "Le statut est requis !" }),
    salary: z.coerce
        .number()
        .nonnegative({ message: "Le salaire doit être positif !" }),
    profile_image: z.any().optional(),
    schools_assistant: z
        .array(z.object({ id: z.number(), name: z.string() }))
        .optional(),
});

const AssistantForm = ({ type, data, schools, setOpen, selectedSchool }) => {
    console.log(data);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(
        data?.profile_image || null,
    );
    const { errors: pageErrors } = usePage().props;
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        getValues,
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            first_name: data?.first_name || "",
            last_name: data?.last_name || "",
            phone_number: data?.phone_number || "",
            email: data?.email || "",
            address: data?.address || "",
            status: data?.status || "active",
            salary: data?.salary || 0,
            profile_image: null,
            schools_assistant:
                data?.schools_assistant?.map(({ id, name }) => ({
                    id,
                    name,
                })) || (selectedSchool ? [{ id: selectedSchool.id, name: selectedSchool.name }] : []),
        },
    });

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

    // Inside the onSubmit function of your AssistantForm component
    const onSubmit = handleSubmit((formData) => {
        // Create a FormData object to properly handle file uploads
        const formDataObj = new FormData();

        // Append all form fields
        formDataObj.append("first_name", formData.first_name);
        formDataObj.append("last_name", formData.last_name);
        formDataObj.append("phone_number", formData.phone_number);
        formDataObj.append("email", formData.email);
        formDataObj.append("address", formData.address);
        formDataObj.append("status", formData.status);
        formDataObj.append("salary", formData.salary);

        // Append the file if it exists
        if (formData.profile_image) {
            formDataObj.append("profile_image", formData.profile_image);
        }

        // Append each school ID
        formData.schools_assistant.forEach((school, index) => {
            formDataObj.append(`schools[${index}]`, school.id);
        });
        setLoading(true);
        if (type === "create") {
            router.post("/assistants", formDataObj, {
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
            // For update, we need to use the proper method spoofing with Inertia
            // Add the _method field to the formData for Laravel to recognize it as PUT
            formDataObj.append("_method", "PUT");

            // Add flag to indicate this is a form update
            formDataObj.append("is_form_update", "1");

            // Then use post() instead of put() because file uploads require POST
            router.post(`/assistants/${data.id}`, formDataObj, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setOpen(false);
                },
                onError: (errors) => console.log("Inertia Errors:", errors),
            });
        }
    });

    // Watch the form fields for changes
    const firstName = watch("first_name");
    const lastName = watch("last_name");
    const email = watch("email");
    const phone = watch("phone_number");
    const address = watch("address");
    const status = watch("status");
    const salary = watch("salary");
    const schoolsVal = watch("schools_assistant");

    const isAssistantFormComplete =
        firstName?.trim() &&
        lastName?.trim() &&
        email?.trim() &&
        /^\S+@\S+\.\S+$/.test(email) &&
        phone?.trim() &&
        address?.trim() &&
        status &&
        salary !== undefined && salary !== null && salary !== "" && !isNaN(salary) && Number(salary) >= 0 &&
        Array.isArray(schoolsVal) && schoolsVal.length > 0;

    function generateStrongPassword() {
        const length = 18;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        return password;
    }

    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userFormData, setUserFormData] = useState({
        name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
        email: data?.email || "",
        password: "",
        password_confirmation: "",
        role: "assistant",
    });
    const [userFormErrors, setUserFormErrors] = useState({});
    const [userFormProcessing, setUserFormProcessing] = useState(false);

    const [updateUserModalOpen, setUpdateUserModalOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <form
                className="flex flex-col gap-8"
                onSubmit={onSubmit}
                encType="multipart/form-data"
            >
                <h1 className="text-xl font-semibold">
                    {type === "create"
                        ? "Créer un nouvel assistant"
                        : "Modifier l'assistant"}
                </h1>
                {/* Informations personnelles */}
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                    <InputField
                        label="Prénom"
                        name="first_name"
                        register={register}
                        error={
                            errors.first_name?.message ||
                            pageErrors?.first_name?.[0]
                        }
                    />
                    <InputField
                        label="Nom"
                        name="last_name"
                        register={register}
                        error={
                            errors.last_name?.message ||
                            pageErrors?.last_name?.[0]
                        }
                    />
                    <InputField
                        label="Téléphone"
                        name="phone_number"
                        register={register}
                        error={
                            errors.phone_number?.message ||
                            pageErrors?.phone_number?.[0]
                        }
                    />
                    <InputField
                        label="E-mail"
                        name="email"
                        register={register}
                        error={errors.email?.message || pageErrors?.email}
                    />
                    <InputField
                        label="Adresse"
                        name="address"
                        register={register}
                        error={
                            errors.address?.message || pageErrors?.address?.[0]
                        }
                    />
                    {/* Statut */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs text-gray-500">Statut</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black pr-10"
                            {...register("status")}
                        >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                        {(errors.status?.message ||
                            pageErrors?.status?.[0]) && (
                            <p className="text-xs text-red-400">
                                {errors.status?.message ||
                                    pageErrors?.status?.[0]}
                            </p>
                        )}
                    </div>
                    {/* Salaire */}
                    <InputField
                        label="Salaire"
                        name="salary"
                        type="number"
                        register={register}
                        error={
                            errors.salary?.message || pageErrors?.salary?.[0]
                        }
                    />
                    {/* Multi-sélection des écoles */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs text-gray-500">Écoles</label>
                        <Controller
                            name="schools_assistant"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={schools}
                                    isMulti
                                    getOptionLabel={(e) => e.name}
                                    getOptionValue={(e) => e.id.toString()}
                                    onChange={(val) => field.onChange(val)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black pr-10"
                                    classNamePrefix="select"
                                />
                            )}
                        />
                        {(errors.schools_assistant?.message ||
                            pageErrors?.schools_assistant?.[0]) && (
                            <p className="text-xs text-red-400">
                                {errors.schools_assistant?.message ||
                                    pageErrors?.schools_assistant?.[0]}
                            </p>
                        )}
                    </div>
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
                            {(errors.profile_image?.message ||
                                pageErrors?.profile_image?.[0]) && (
                                <p className="text-xs text-red-400">
                                    {errors.profile_image?.message ||
                                        pageErrors?.profile_image?.[0]}
                                </p>
                            )}
                        </div>
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
                                ${isAssistantFormComplete ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            disabled={!isAssistantFormComplete}
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
                                    // Validate assistant form
                                    let assistantValid = false;
                                    await handleSubmit((assistantData) => {
                                        assistantValid = true;
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
                                    if (!assistantValid || !userValid) {
                                        setUserFormProcessing(false);
                                        return;
                                    }
                                    // Prepare combined data
                                    const assistantData = getValues();
                                    const formDataObj = new FormData();
                                    formDataObj.append("user[name]", userFormData.name);
                                    formDataObj.append("user[email]", userFormData.email);
                                    formDataObj.append("user[password]", userFormData.password);
                                    formDataObj.append("user[password_confirmation]", userFormData.password_confirmation);
                                    formDataObj.append("user[role]", userFormData.role);
                                    formDataObj.append("assistant[first_name]", assistantData.first_name);
                                    formDataObj.append("assistant[last_name]", assistantData.last_name);
                                    formDataObj.append("assistant[phone_number]", assistantData.phone_number);
                                    formDataObj.append("assistant[email]", assistantData.email);
                                    formDataObj.append("assistant[address]", assistantData.address);
                                    formDataObj.append("assistant[status]", assistantData.status);
                                    formDataObj.append("assistant[salary]", assistantData.salary);
                                    if (assistantData.profile_image) {
                                        formDataObj.append("assistant[profile_image]", assistantData.profile_image);
                                    }
                                    assistantData.schools_assistant?.forEach((school, index) => {
                                        formDataObj.append(`assistant[schools][${index}]`, school.id);
                                    });
                                    router.post("/assistants-with-user", formDataObj, {
                                        preserveScroll: true,
                                        forceFormData: true,
                                        onSuccess: (page) => {
                                            setUserModalOpen(false);
                                            setUserFormProcessing(false);
                                            setOpen(false);
                                            if (page?.props?.success || (typeof page === 'object' && page.success)) {
                                                router.visit('/assistants');
                                            }
                                        },
                                        onError: (errors) => {
                                            const userErrs = {};
                                            const assistantErrs = {};
                                            Object.entries(errors).forEach(([key, val]) => {
                                                if (key.startsWith("user.")) userErrs[key.replace("user.", "")] = val;
                                                if (key.startsWith("assistant.")) assistantErrs[key.replace("assistant.", "")] = val;
                                            });
                                            setUserFormErrors(userErrs);
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
                    userData={[{ id: data?.user_id, name: `${data?.first_name} ${data?.last_name}`, email: data?.email, role: "assistant" }]}
                    isUpdateOpen={{ isOpen: updateUserModalOpen, id: data?.user_id }}
                    setIsUpdateOpen={({ isOpen }) => setUpdateUserModalOpen(isOpen)}
                />
            )}
        </div>
    );
};

export default AssistantForm;