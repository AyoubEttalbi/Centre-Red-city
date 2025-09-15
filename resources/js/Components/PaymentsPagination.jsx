import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center mt-4">
            <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                    Précédent
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                    <button
                        key={idx + 1}
                        onClick={() => onPageChange(idx + 1)}
                        className={`px-3 py-1 border-t border-b border-gray-300 bg-white text-sm font-medium ${currentPage === idx + 1 ? 'text-blue-600 font-bold border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                        {idx + 1}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                    Suivant
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
