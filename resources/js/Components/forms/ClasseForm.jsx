import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { router } from "@inertiajs/react";

const schema = z.object({
    name: z.string().min(1, { message: "Class name is required!" }),
    level_id: z.any(),
    school_id: z.any(),
});

const ClassesForm = ({
    type = "",
    data = [],
    levels = [],
    setOpen,
    schools = [],
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: data?.name || "",
            level_id: data?.level_id || "",
            school_id: data?.school_id || "",
        },
    });

    const onSubmit = (formData) => {
        if (type === "create") {
            router.post("/classes", formData, {
                onSuccess: () => {
                    setOpen(false);
                },
            });
        } else if (type === "update") {
            router.put(`/classes/${data.id}`, formData,{
                onSuccess: () => {
                    setOpen(false);
                },
            });
        }
    };

    return (
        <form
            className="flex flex-col gap-6 p-6 bg-white shadow-lg rounded-lg w-full"
            onSubmit={handleSubmit(onSubmit)}
        >
            <h1 className="text-2xl font-semibold text-gray-800">
                {type === "create" ? "Create a New Class" : "Update Class"}
            </h1>

            <span className="text-xs text-gray-400 font-medium">
                Class Information
            </span>

            <div className="flex flex-wrap md:flex-nowrap gap-4 w-full">
                <div className="flex-1">
                    <InputField
                        label="Class Name"
                        name="name"
                        register={register}
                        error={errors.name}
                        defaultValue={data?.name}
                    />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/3">
                    <label className="text-xs text-gray-600">Level</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("level_id")}
                        defaultValue={data?.level_id}
                    >
                        <option value="">Select Level</option>
                        {levels?.map((level) => (
                            <option key={level.id} value={level.id}>
                                {level.name}
                            </option>
                        ))}
                    </select>
                    {errors.level_id?.message && (
                        <p className="text-xs text-red-400">
                            {errors.level_id.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/3">
                    <label className="text-xs text-gray-600">School</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("school_id")}
                        defaultValue={data?.school_id}
                    >
                        <option value="">Select School</option>
                        {schools?.map((school) => (
                            <option key={school.id} value={school.id}>
                                {school.name}
                            </option>
                        ))}
                    </select>
                    {errors.school_id?.message && (
                        <p className="text-xs text-red-400">
                            {errors.school_id.message}
                        </p>
                    )}
                </div>
            </div>

            <button
                type="submit"
                className="bg-blue-500 text-white p-3 rounded-md mt-4 hover:bg-blue-600 transition duration-200"
            >
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    );
};

export default ClassesForm;
