import { FaChartLine, FaEdit } from "react-icons/fa";
import FormModal from "./FormModal";

const ScoresTable = ({ scores = [] }) => {
    // Function to format the grade with color indication
    const formatGrade = (grade) => {
        if (!grade && grade !== 0) return "---";

        // Check if grade is in format "X/Y" (e.g., "14/20")
        if (typeof grade === "string" && grade.includes("/")) {
            const [numerator, denominator] = grade
                .split("/")
                .map((num) => parseFloat(num.trim()));

            // Calculate percentage
            const percentage = (numerator / denominator) * 100;

            let colorClass = "text-gray-900";
            if (percentage >= 70) {
                colorClass = "text-green-600 font-medium";
            } else if (percentage >= 50) {
                colorClass = "text-blue-600";
            } else {
                colorClass = "text-red-600 font-medium";
            }

            return <span className={colorClass}>{grade}</span>;
        }

        // Fallback for grades not in fraction format
        const numGrade = parseFloat(grade);

        let colorClass = "text-gray-900";
        if (numGrade >= 14) {
            colorClass = "text-green-600 font-medium";
        } else if (numGrade >= 10) {
            colorClass = "text-blue-600";
        } else if (numGrade < 10) {
            colorClass = "text-red-600 font-medium";
        }

        return <span className={colorClass}>{grade}</span>;
    };

    return (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-200 text-black">
                <h2 className="text-xl font-bold flex items-center">
                    <FaChartLine className="mr-2" /> Résultats académiques
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Matière
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Niveau
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Note 1
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Note 2
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Note 3
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Note finale
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Remarques
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {scores.map((score, index) => (
                            <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors duration-150"
                            >
                                <td className="p-3 text-sm font-medium text-gray-900">
                                    {score.subject}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {score.level}
                                </td>
                                <td className="p-3 text-sm">
                                    {formatGrade(score.grade1)}
                                </td>
                                <td className="p-3 text-sm">
                                    {formatGrade(score.grade2)}
                                </td>
                                <td className="p-3 text-sm">
                                    {formatGrade(score.grade3)}
                                </td>
                                <td className="p-3 text-sm font-medium">
                                    {formatGrade(score.final_grade)}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                    {score.notes || "---"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty state */}
            {(!scores || scores.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                    Aucun résultat académique trouvé pour cet élève.
                </div>
            )}
        </div>
    );
};

export default ScoresTable;
