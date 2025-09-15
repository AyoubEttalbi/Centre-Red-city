import { CreditCard } from "lucide-react";
import React from "react";

const PageHeader = ({ title, description, children }) => {
    return (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div className="mb-4 lg:mb-0">
                    <div className="flex items-center">
                        <CreditCard className="h-6 w-6 text-gray-700 mr-2" />
                        <h1 className="text-2xl font-semibold text-gray-800">
                            {title}
                        </h1>
                    </div>
                    {description && (
                        <p className="mt-1 text-sm text-gray-600">
                            {description}
                        </p>
                    )}
                </div>
                <div className="w-full lg:w-auto">{children}</div>
            </div>
        </div>
    );
};

export default PageHeader;
