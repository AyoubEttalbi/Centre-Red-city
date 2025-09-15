import React, { useState, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

const AbsenceListPage = ({ teachers = [], classes = [] }) => {
    const [formData, setFormData] = useState({
        teacherId: '',
        classId: '',
        month: (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        })()
    });
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const { auth } = usePage().props;
    const userRole = auth?.user?.role;

    // Update available classes when teacher selection changes
    useEffect(() => {
        if (formData.teacherId) {
            const filteredClasses = classes.filter(cls => 
                cls.teachers?.some(teacher => teacher.id == formData.teacherId)
            );
            setAvailableClasses(filteredClasses);
            
            // Reset class selection if current class is not available for selected teacher
            if (formData.classId && !filteredClasses.some(cls => cls.id == formData.classId)) {
                setFormData(prev => ({ ...prev, classId: '' }));
            }
        } else {
            setAvailableClasses([]);
            setFormData(prev => ({ ...prev, classId: '' }));
        }
    }, [formData.teacherId, classes]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        
        if (!formData.teacherId) {
            newErrors.teacherId = 'Veuillez sélectionner un enseignant';
        }
        if (!formData.classId) {
            newErrors.classId = 'Veuillez sélectionner une classe';
        }
        if (!formData.month) {
            newErrors.month = 'Veuillez sélectionner un mois';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const handleDownload = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setIsDownloading(true);
            const downloadUrl = `/absence-list/download?teacher_id=${formData.teacherId}&class_id=${formData.classId}&date=${formData.month}-01`;
            
            // Create a temporary link element for download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Download failed:', error);
            // You could add toast notification here
        } finally {
            setTimeout(() => setIsDownloading(false), 1500);
        }
    };

    const isFormValid = formData.teacherId && formData.classId && formData.month;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-4 mt-0 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Liste de présence
                </h1>
                <p className="text-gray-600 text-sm">
                    Sélectionnez un enseignant, une classe et un mois pour télécharger la liste de présence
                </p>
            </div>

            <form onSubmit={handleDownload} className="space-y-6" noValidate>
                {/* Teacher Selection */}
                <div className="space-y-1">
                    <label 
                        htmlFor="teacher-select" 
                        className="block text-sm font-medium text-gray-700"
                    >
                        Enseignant <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="teacher-select"
                        className={`w-full rounded-md border shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                            errors.teacherId 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                : 'border-gray-300 focus:border-lamaPurple focus:ring-lamaPurple/20'
                        }`}
                        value={formData.teacherId}
                        onChange={e => handleInputChange('teacherId', e.target.value)}
                        required
                    >
                        <option value="">-- Sélectionner un enseignant --</option>
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                            </option>
                        ))}
                    </select>
                    {errors.teacherId && (
                        <p className="text-sm text-red-600 mt-1" role="alert">
                            {errors.teacherId}
                        </p>
                    )}
                </div>

                {/* Class Selection */}
                <div className="space-y-1">
                    <label 
                        htmlFor="class-select" 
                        className="block text-sm font-medium text-gray-700"
                    >
                        Classe <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="class-select"
                        className={`w-full rounded-md border shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                            !formData.teacherId 
                                ? 'bg-gray-50 cursor-not-allowed' 
                                : errors.classId
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:border-lamaPurple focus:ring-lamaPurple/20'
                        }`}
                        value={formData.classId}
                        onChange={e => handleInputChange('classId', e.target.value)}
                        disabled={!formData.teacherId}
                        required
                    >
                        <option value="">
                            {!formData.teacherId 
                                ? '-- Sélectionnez d\'abord un enseignant --' 
                                : '-- Sélectionner une classe --'
                            }
                        </option>
                        {availableClasses.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                    {errors.classId && (
                        <p className="text-sm text-red-600 mt-1" role="alert">
                            {errors.classId}
                        </p>
                    )}
                    {formData.teacherId && availableClasses.length === 0 && (
                        <p className="text-sm text-amber-600 mt-1">
                            Aucune classe disponible pour cet enseignant
                        </p>
                    )}
                </div>

                {/* Month Selection */}
                <div className="space-y-1">
                    <label 
                        htmlFor="month-input" 
                        className="block text-sm font-medium text-gray-700"
                    >
                        Mois <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="month-input"
                        type="month"
                        className={`w-full rounded-md border shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                            errors.month 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                : 'border-gray-300 focus:border-lamaPurple focus:ring-lamaPurple/20'
                        }`}
                        value={formData.month}
                        onChange={e => handleInputChange('month', e.target.value)}
                        required
                    />
                    {errors.month && (
                        <p className="text-sm text-red-600 mt-1" role="alert">
                            {errors.month}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaPurple ${
                            isDownloading || !isFormValid
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-lamaPurple hover:bg-lamaPurpleDark active:transform active:scale-[0.98] hover:shadow-md'
                        }`}
                        disabled={isDownloading || !isFormValid}
                        aria-describedby={!isFormValid ? 'form-validation-help' : undefined}
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 ${isDownloading ? 'animate-spin' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            {isDownloading ? (
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                />
                            ) : (
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" 
                                />
                            )}
                        </svg>
                        <span>
                            {isDownloading ? 'Téléchargement en cours...' : 'Télécharger la liste de présence'}
                        </span>
                    </button>
                    
                    {!isFormValid && (
                        <p id="form-validation-help" className="text-sm text-gray-500 mt-2 text-center">
                            Veuillez remplir tous les champs requis
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

AbsenceListPage.layout = page => <DashboardLayout>{page}</DashboardLayout>;
export default AbsenceListPage;