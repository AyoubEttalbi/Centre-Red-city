import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";

const UserCard = ({ type, counts, totalCount, schoolId, onClick }) => {
    // Get the count for the selected school
    const count = useMemo(() => {
        if (schoolId && counts[schoolId]) {
            return counts[schoolId].count;
        }
        return totalCount;
    }, [schoolId, counts, totalCount]);

    // Animated counter
    const [displayCount, setDisplayCount] = useState(0);
    useEffect(() => {
        if (typeof count === "number") {
            let start = displayCount;
            let end = count;
            if (start === end) return;
            const duration = 800;
            const step = (end - start) / (duration / 16);
            let current = start;
            let frame;
            function animate() {
                current += step;
                if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
                    setDisplayCount(end);
                    return;
                }
                setDisplayCount(Math.round(current));
                frame = requestAnimationFrame(animate);
            }
            animate();
            return () => cancelAnimationFrame(frame);
        }
    }, [count]);

    // When fetching or filtering data, treat 'all' as null for schoolId
    useEffect(() => {
        let effectiveSchoolId = schoolId;
        if (schoolId === 'all') effectiveSchoolId = null;
        // Fetch or filter data with effectiveSchoolId
        // For now, just log the effectiveSchoolId
    }, [schoolId]);

    // Helper to get the current school year dynamically
    const getCurrentSchoolYear = () => {
        const now = new Date();
        const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}/${(year + 1).toString().slice(-2)}`;
    };

    function getTypeLabel(type) {
        switch (type) {
            case "teacher":
                return "Enseignants";
            case "student":
                return "Étudiants";
            case "assistant":
                return "Assistants";
            default:
                return "";
        }
    }

    // Tooltip content
    const tooltipText = `Total ${getTypeLabel(type).toLowerCase()}${schoolId && schoolId !== 'all' ? ' dans cette école' : ''}`;

    // Loading skeleton
    if (count === undefined || count === null) {
        return (
            <div className="rounded-2xl bg-gray-100 animate-pulse p-4 flex-1 min-w-[130px] h-[110px]" />
        );
    }

    return (
        <div
            className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px] relative cursor-pointer hover:shadow-lg transition-shadow"
            data-tooltip-id={`usercard-tooltip-${type}`}
            onClick={() => onClick && onClick(type, schoolId)}
        >
            <div className="flex justify-between items-center">
                <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
                    {getCurrentSchoolYear()}
                </span>
            </div>
            <h1 className="text-2xl font-semibold my-4">
                <AnimatePresence>
                    <motion.span
                        key={displayCount}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {displayCount}
                    </motion.span>
                </AnimatePresence>
            </h1>
            <h2 className="capitalize text-sm font-medium text-gray-500">
                {getTypeLabel(type)}
            </h2>
            <Tooltip id={`usercard-tooltip-${type}`} place="top" content={tooltipText} />
        </div>
    );
};

export default UserCard;
