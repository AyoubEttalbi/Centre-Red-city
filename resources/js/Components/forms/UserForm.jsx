// UserForm.js
import React, { useState } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

export default function UserForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onPasswordAction,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    return (
        <form onSubmit={onSubmit} className="space-y-4">
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
                />
                <InputError
                    message={errors.name}
                    className="mt-1 text-sm text-red-500"
                />
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
                <InputError
                    message={errors.email}
                    className="mt-1 text-sm text-red-500"
                />
            </div>
            {/* Champ Mot de passe */}
            <div>
                <InputLabel htmlFor="password" value="Mot de passe" />
                <div className="relative">
                    <TextInput
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black pr-10"
                        autoComplete="new-password"
                        onChange={(e) => setData("password", e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => {
                            onPasswordAction("password");
                            setShowPassword(!showPassword);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                        {data.password ? (
                            showPassword ? (
                                <Eye className="h-5 w-5" />
                            ) : (
                                <EyeOff className="h-5 w-5" />
                            )
                        ) : (
                            <RefreshCw className="h-5 w-5" />
                        )}
                    </button>
                </div>
                <InputError
                    message={errors.password}
                    className="mt-1 text-sm text-red-500"
                />
            </div>
            {/* Champ Confirmation du mot de passe */}
            <div>
                <InputLabel
                    htmlFor="password_confirmation"
                    value="Confirmer le mot de passe"
                />
                <div className="relative">
                    <TextInput
                        id="password_confirmation"
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black pr-10"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        required
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                        {showConfirmPassword ? (
                            <Eye className="h-5 w-5" />
                        ) : (
                            <EyeOff className="h-5 w-5" />
                        )}
                    </button>
                </div>
                <InputError
                    message={errors.password_confirmation}
                    className="mt-1 text-sm text-red-500"
                />
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
                >
                    <option value="">Sélectionner un rôle</option>
                    <option value="admin">Administrateur</option>
                    <option value="assistant">Assistant</option>
                    <option value="teacher">Enseignant</option>
                </select>
                <InputError
                    message={errors.role}
                    className="mt-1 text-sm text-red-500"
                />
            </div>
            {/* Bouton Soumettre */}
            <div className="flex items-center justify-center mt-6">
                <PrimaryButton
                    className="px-4 py-2  text-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    disabled={processing}
                >
                    Créer l'utilisateur
                </PrimaryButton>
            </div>
        </form>
    );
}
