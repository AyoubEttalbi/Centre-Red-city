import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router } from "@inertiajs/react";
import InputField from "../InputField";

const schema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    phone_number: z.string().min(1, "Le numéro de téléphone est requis"),
    email: z.string().email("Adresse e-mail invalide"),
});

const SchoolForm = ({ type, data, setOpen }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: data || {},
    });

    const onSubmit = (formData) => {
        if (type === "create") {
            router.post("/othersettings/schools", formData, {
                onSuccess: () => setOpen(false),
            });
        } else {
            router.put(`/othersettings/schools/${data.id}`, formData, {
                onSuccess: () => setOpen(false),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
                label="Nom"
                name="name"
                register={register}
                error={errors.name?.message}
            />
            <InputField
                label="Adresse"
                name="address"
                register={register}
                error={errors.address?.message}
            />
            <InputField
                label="Numéro de téléphone"
                name="phone_number"
                register={register}
                error={errors.phone_number?.message}
            />
            <InputField
                label="E-mail"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
            />
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                    {type === "create" ? "Créer" : "Mettre à jour"}
                </button>
            </div>
        </form>
    );
};

export default SchoolForm;
