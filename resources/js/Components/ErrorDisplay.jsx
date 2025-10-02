import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const ErrorDisplay = ({ 
    errors = [], 
    suggestions = [], 
    success = false, 
    onClose,
    className = ""
}) => {
    if (!errors.length && !success) return null;

    const getIcon = () => {
        if (success) return <CheckCircle className="w-5 h-5 text-green-500" />;
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    };

    const getHeaderColor = () => {
        if (success) return "bg-green-50 border-green-200";
        return "bg-yellow-50 border-yellow-200";
    };

    const getTextColor = () => {
        if (success) return "text-green-800";
        return "text-yellow-800";
    };

    return (
        <div className={`rounded-lg border ${getHeaderColor()} ${className}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className={`text-sm font-medium ${getTextColor()}`}>
                            {success ? 'Succès!' : 'Attention'}
                        </h3>
                        
                        {success && (
                            <div className="mt-2 text-sm text-green-700">
                                L'opération s'est terminée avec succès.
                            </div>
                        )}
                        
                        {!success && errors.length > 0 && (
                            <div className="mt-2">
                                <ul className={`text-sm space-y-1 ${getTextColor()}`}>
                                    {errors.map((error, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{error}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {suggestions.length > 0 && (
                            <div className="mt-3">
                                <div className="flex items-start">
                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 mb-1">Suggestions:</p>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            {suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="mr-2">→</span>
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {onClose && (
                        <div className="ml-auto pl-3">
                            <div className="-mx-1.5 -my-1.5">
                                <button
                                    onClick={onClose}
                                    className={`inline-flex rounded-md p-1.5 ${
                                        success 
                                            ? 'text-green-500 hover:bg-green-100' 
                                            : 'text-yellow-500 hover:bg-yellow-100'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        success ? 'focus:ring-green-600' : 'focus:ring-yellow-600'
                                    }`}
                                >
                                    <span className="sr-only">Fermer</span>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;

