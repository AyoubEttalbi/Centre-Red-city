import React from 'react';
import ErrorDisplay from '../ErrorDisplay';

const InvoiceErrorDisplay = ({ 
    errors = [], 
    suggestions = [], 
    success = false, 
    onClose,
    position = "top" // "top", "inline", "bottom"
}) => {
    if (!errors.length && !success) return null;

    const containerClasses = {
        top: "mb-4",
        inline: "my-4",
        bottom: "mt-4"
    };

    return (
        <div className={containerClasses[position]}>
            <ErrorDisplay
                errors={errors}
                suggestions={suggestions}
                success={success}
                onClose={onClose}
            />
        </div>
    );
};

export default InvoiceErrorDisplay;

