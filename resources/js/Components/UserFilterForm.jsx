import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

export default function UserFilterForm({
    roles,
    filters,
    onFilterChange,
}) {
    const handleSelectChange = (name, value) => {
        const syntheticEvent = {
            target: {
                name,
                value,
            },
        };

        onFilterChange(syntheticEvent);
    };

    return (
        <div className="bg-white p-4 rounded-md shadow-sm mb-4 grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Role Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">Rôle</label>
                <Select
                    value={filters.role}
                    onValueChange={(value) =>
                        handleSelectChange("role", value)
                    }
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
} 