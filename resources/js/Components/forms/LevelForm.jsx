import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { router } from "@inertiajs/react";

const levelSchema = z.object({
    name: z.string().min(1, { message: "Le nom du niveau est requis !" }),
});

const LevelForm = ({ type, data, setOpen }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(levelSchema),
        defaultValues: {
            name: data?.name || "",
        },
    });

    const onSubmit = (formData) => {
        if (type === "create") {
            router.post("/othersettings/levels", formData, {
                onSuccess: () => {
                    setOpen(false);
                },
            });
        } else if (type === "update") {
            router.put(`/othersettings/${data.id}`, formData, {
                onSuccess: () => {
                    setOpen(false);
                },
            });
        }
    };

    return (
        <form
            className="flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg"
            onSubmit={handleSubmit(onSubmit)}
        >
            <h1 className="text-2xl font-semibold text-gray-800">
                {type === "create" ? "Créer un nouveau niveau" : "Mettre à jour le niveau"}
            </h1>

            <InputField
                label="Nom du niveau"
                name="name"
                register={register}
                error={errors.name}
                defaultValue={data?.name}
            />

            <button
                type="submit"
                className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition"
            >
                {type === "create" ? "Créer" : "Mettre à jour"}
            </button>
        </form>
    );
};

export default LevelForm;
