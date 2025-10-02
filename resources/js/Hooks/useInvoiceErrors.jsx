import { useState, useCallback } from 'react';

const useInvoiceErrors = () => {
    const [errors, setErrors] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const handleApiError = useCallback((error) => {
        console.error('Invoice API Error:', error);
        
        // Try to extract error response
        let errorData = null;
        if (error.response && error.response.data) {
            errorData = error.response.data;
        } else if (error.data) {
            errorData = error.data;
        }

        if (errorData) {
            setErrors(errorData.errors || [errorData.message] || ['Une erreur inattendue s\'est produite']);
            setSuggestions(errorData.suggestions || []);
        } else {
            setErrors(['Erreur de connexion. Veuillez vérifier votre connexion internet.']);
            setSuggestions(['Vérifiez votre connexion internet et réessayer']);
        }
        
        setIsVisible(true);
    }, []);

    const handleValidationError = useCallback((validationErrors) => {
        const errorMessages = [];
        const suggestionList = [];

        Object.entries(validationErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
                errorMessages.push(...messages);
            } else {
                errorMessages.push(messages);
            }
            
            // Add field-specific suggestions
            switch (field) {
                case 'membership_id':
                    suggestionList.push('Sélectionnez une adhésion valide');
                    break;
                case 'totalAmount':
                    suggestionList.push('Vérifiez que le montant total est correct');
                    break;
                case 'amountPaid':
                    suggestionList.push('Le montant payé ne peut pas dépasser le montant total');
                    break;
                case 'rest':
                    suggestionList.push('Vérifiez que le reste = total - payé');
                    break;
            }
        });

        setErrors(errorMessages);
        setSuggestions(suggestionList);
        setIsVisible(true);
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
        setSuggestions([]);
        setIsVisible(false);
    }, []);

    const showSuccess = useCallback((message = 'Opération réussie') => {
        setErrors([]);
        setSuggestions([]);
        setIsVisible(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    }, []);

    return {
        errors,
        suggestions,
        isVisible,
        handleApiError,
        handleValidationError,
        clearErrors,
        showSuccess,
        setIsVisible
    };
};

export default useInvoiceErrors;