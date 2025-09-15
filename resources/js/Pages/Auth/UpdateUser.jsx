import React, { useEffect } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";
import { Eye, EyeOff } from "lucide-react";

export default function UpdateUser({
    userData,
    isUpdateOpen,
    setIsUpdateOpen,
}) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === "admin";
    // Safely get updateUserData only if userData.data exists
    const updateUserData = Array.isArray(userData?.data)
        ? userData.data.find((user) => user.id === isUpdateOpen.id)
        : undefined;
    const [showPassword, setShowPassword] = React.useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        name: updateUserData?.name || "",
        email: updateUserData?.email || "",
        role: updateUserData?.role || "",
        password: "",
    });
    React.useEffect(() => {
        if (updateUserData) {
            setData({
                name: updateUserData.name,
                email: updateUserData.email,
                role: updateUserData.role,
                password: "",
            });
        }
    }, [updateUserData]);
    const submit = (e) => {
        e.preventDefault();
        if (!updateUserData || !updateUserData.id) {
            alert("Erreur: l'identifiant de l'utilisateur est manquant pour la mise à jour.");
            return;
        }
        // Only send password if filled
        const payload = { ...data };
        if (!data.password) delete payload.password;
        put(route("users.update", { user: updateUserData.id }), {
            ...payload,
            onSuccess: () => {
                reset();
                setIsUpdateOpen({ isOpen: false, id: null });
            },
        });
    };
    return (
        <div>
            {/* Modal */}
            {isUpdateOpen.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
                        {/* Close button */}
                        <button
                            onClick={() => setIsUpdateOpen({ isOpen: false, id: null })}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        {/* Modal content */}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-center mb-4">
                                Mettre à jour l'utilisateur
                            </h2>
                            <p className="text-gray-600 text-center mb-6">
                                Modifier les informations de l'utilisateur
                            </p>
                            <form onSubmit={submit} className="space-y-4">
                                {/* Champ Nom */}
                                <div>
                                    <InputLabel htmlFor="name" value="Nom" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData("name", e.target.value)}
                                        required
                                        readOnly
                                    />
                                    <InputError message={errors.name} className="mt-1 text-sm text-red-500" />
                                </div>
                                {/* Champ Email */}
                                <div>
                                    <InputLabel htmlFor="email" value="E-mail" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                                        autoComplete="username"
                                        onChange={(e) => setData("email", e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1 text-sm text-red-500" />
                                </div>
                                {/* Champ Rôle */}
                                <div>
                                    <InputLabel htmlFor="role" value="Rôle" />
                                    <select
                                        id="role"
                                        name="role"
                                        value={data.role}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                                        onChange={(e) => setData("role", e.target.value)}
                                        required
                                        disabled    
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        <option value="admin">Administrateur</option>
                                        <option value="assistant">Assistant</option>
                                        <option value="teacher">Enseignant</option>
                                    </select>
                                    <InputError message={errors.role} className="mt-1 text-sm text-red-500" />
                                </div>
                                {/* Champ Mot de passe (admin only) */}
                                {isAdmin && (
                                    <div>
                                        <InputLabel htmlFor="password" value="Nouveau mot de passe" />
                                        <div className="relative">
                                            <TextInput
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={data.password}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black pr-10"
                                                autoComplete="new-password"
                                                onChange={(e) => setData("password", e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="mt-1 text-sm text-red-500" />
                                    </div>
                                )}
                                {/* Bouton Soumettre */}
                                <div className="flex items-center justify-center mt-6">
                                    <PrimaryButton
                                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                        disabled={processing}
                                    >
                                        Mettre à jour l'utilisateur
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
