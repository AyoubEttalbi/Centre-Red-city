import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

export default function FilterForm({
    schools,
    classes,
    levels,
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
        <div className="bg-white p-4 rounded-md shadow-sm mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* School Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">School</label>
                <Select
                    value={filters.school}
                    onValueChange={(value) =>
                        handleSelectChange("school", value)
                    }
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select School" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem> All Schools</SelectItem>
                        {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                                {school.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Class Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">Class</label>
                <Select
                    value={filters.class}
                    onValueChange={(value) =>
                        handleSelectChange("class", value)
                    }
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem> All Classes</SelectItem>
                        {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Level Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <Select
                    value={filters.level}
                    onValueChange={(value) =>
                        handleSelectChange("level", value)
                    }
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem> All Levels</SelectItem>
                        {levels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                                {level.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Membership Status Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">Statut d’adhésion</label>
                <Select
                    value={filters.membership_status || "all"}
                    onValueChange={(value) =>
                        handleSelectChange("membership_status", value)
                    }
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="unpaid">Non payé</SelectItem>
                        <SelectItem value="rest">Partiel</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
