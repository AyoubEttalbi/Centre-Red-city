import { format } from "date-fns";

export const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} DH`;
};

export const formatDate = (dateString) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "dd MMM yyyy");
};

export const getInitials = (name) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

export const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
        case "teacher":
            return "bg-purple-100 text-purple-800";
        case "admin":
            return "bg-red-100 text-red-800";
        case "staff":
            return "bg-orange-100 text-orange-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export const getTransactionTypeColor = (type) => {
    switch (type) {
        case "salary":
            return "bg-blue-100 text-blue-800";
        case "wallet":
            return "bg-green-100 text-green-800";
        case "expense":
            return "bg-orange-100 text-orange-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export const getTransactionTypeLabel = (type) => {
    switch (type) {
        case "salary":
            return "Salaire";
        case "wallet":
            return "Paiement";
        case "expense":
            return "Dépense";
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

export const calculateChange = (current, previous) => {
    if (!previous) return { percentage: 0, direction: "neutral" };

    const change = ((current - previous) / previous) * 100;
    return {
        percentage: Math.abs(change).toFixed(1),
        direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    };
};
