import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Loader2, 
  Download, 
  Filter, 
  Info, 
  Eye, 
  Users, 
  TrendingUp, 
  Calendar,
  School,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  X
} from "lucide-react";
import TeacherEarningsDetailModal from "./TeacherEarningsDetailModal";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import * as XLSX from "xlsx";

const monthsList = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleString("default", { month: "long", year: "numeric" }),
    };
});

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

const TeacherEarningsTable = ({ teachers = [], schools: schoolsProp = [] }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Set initial selectedMonth to the first available month in monthsList (if any), otherwise ''
    const [selectedMonth, setSelectedMonth] = useState(() => {
      return monthsList.length > 0 ? monthsList[0].value : "";
    });
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [detail, setDetail] = useState(null);
    const [selectedLineTeachers, setSelectedLineTeachers] = useState([]);
    const [schools, setSchools] = useState(schoolsProp);
    const [classes, setClasses] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false);
    const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
    const [schoolsLoading, setSchoolsLoading] = useState(false);
    const teacherSelectRef = React.useRef(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Close teacher select dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (teacherSelectRef.current && !teacherSelectRef.current.contains(event.target)) {
                setIsTeacherSelectOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Update schools when prop changes
    useEffect(() => {
        if (Array.isArray(schoolsProp) && schoolsProp.length > 0) {
            console.log('Schools received from prop:', schoolsProp);
            setSchools(schoolsProp);
            setSchoolsLoading(false);
        } else if (schoolsProp.length === 0) {
            // Fallback to fetching if no schools provided
            setSchoolsLoading(true);
            axios.get("/schoolsForFilters")
                .then((res) => {
                    console.log('Schools API response:', res.data);
                    if (Array.isArray(res.data)) {
                        setSchools(res.data);
                    } else if (Array.isArray(res.data.schools)) {
                        setSchools(res.data.schools);
                    } else {
                        console.warn('Unexpected schools data format:', res.data);
                        setSchools([]);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching schools:', error);
                    setSchools([]);
                })
                .finally(() => {
                    setSchoolsLoading(false);
                });
        }
    }, [schoolsProp]);

    // Fetch classes when school changes
    useEffect(() => {
        if (selectedSchool) {
            console.log('Fetching classes for school:', selectedSchool);
            axios.get(`/classesForFilters?school_id=${selectedSchool}`)
                .then((res) => {
                    console.log('Classes API response:', res.data);
                    setClasses(res.data);
                })
                .catch((error) => {
                    console.error('Error fetching classes:', error);
                    setClasses([]);
                });
        } else {
            setClasses([]);
        }
        setSelectedClass("");
    }, [selectedSchool]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        // Reset to first page when filters change
        setCurrentPage(1);
        
        const params = {
            month: selectedMonth ? selectedMonth : undefined,
            teacher_id: selectedTeacher || undefined,
            school_id: selectedSchool || undefined,
            class_id: selectedClass || undefined,
        };
        
        console.log('Fetching teacher earnings with params:', params);
        
        axios
            .get("/teacher-earnings-report", { params })
            .then((res) => {
                console.log('Teacher earnings API response:', res.data);
                setData(res.data);
            })
            .catch((err) => {
                console.error('Error fetching teacher earnings:', err);
                setError("Erreur lors du chargement des données.");
            })
            .finally(() => setLoading(false));
    }, [selectedMonth, selectedTeacher, selectedSchool, selectedClass]);


    // Get unique teachers for filter dropdown
    const teacherOptions = React.useMemo(() => {
        const unique = new Map();
        data.forEach((row) => {
            // Use a Map to preserve the numeric type of the teacherId key
            unique.set(row.teacherId, row.teacherName);
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [data]);

    const filteredTeacherOptions = teacherOptions.filter(teacher => 
        teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase())
    );

    // Group data by teacher when "Tous les mois" is selected
    const processedData = React.useMemo(() => {
        if (selectedMonth === "") {
            // Group by teacher when showing all months
            const grouped = {};
            data.forEach((row) => {
                if (!grouped[row.teacherId]) {
                    grouped[row.teacherId] = {
                        teacherId: row.teacherId,
                        teacherName: row.teacherName,
                        totalEarned: 0,
                        invoiceCount: 0, // This will be set to the actual count later
                        months: [],
                        lastPaymentDate: null,
                        year: row.year
                    };
                }
                grouped[row.teacherId].totalEarned += row.totalEarned;
                grouped[row.teacherId].invoiceCount += row.invoiceCount; // Sum invoice counts from each month
                grouped[row.teacherId].months.push(row.month);
                if (!grouped[row.teacherId].lastPaymentDate || 
                    (row.lastPaymentDate && row.lastPaymentDate > grouped[row.teacherId].lastPaymentDate)) {
                    grouped[row.teacherId].lastPaymentDate = row.lastPaymentDate;
                }
            });
            
            // Convert to array and sort
            const result = Object.values(grouped).sort((a, b) => b.totalEarned - a.totalEarned);
            
            return result;
        }
        return data;
    }, [data, selectedMonth]);

    // Calculate statistics
    const stats = React.useMemo(() => {
        const total = processedData.reduce((sum, row) => sum + row.totalEarned, 0);
        const avgPerTeacher = processedData.length > 0 ? total / processedData.length : 0;
        const totalInvoices = processedData.reduce((sum, row) => sum + row.invoiceCount, 0);
        return { total, avgPerTeacher, totalInvoices, teacherCount: processedData.length };
    }, [processedData]);

    // Chart data calculations
    const pieChartData = React.useMemo(() => {
        if (!processedData.length) return [];
        return processedData
            .map(row => ({ name: row.teacherName, value: row.totalEarned }))
            .sort((a, b) => b.value - a.value);
    }, [processedData]);

    const barChartData = React.useMemo(() => {
        if (!processedData.length) return [];
        return processedData
            .map(row => ({ 
                teacherName: row.teacherName, 
                totalEarned: row.totalEarned, 
                teacherId: row.teacherId 
            }))
            .sort((a, b) => b.totalEarned - a.totalEarned);
    }, [processedData]);

    const multiLineChartData = React.useMemo(() => {
        if (!selectedLineTeachers.length) return [];
        const months = Array.from(
            new Set(data.filter(row => selectedLineTeachers.includes(row.teacherId)).map(row => row.month))
        ).sort();
        return months.map(month => {
            const entry = { month };
            selectedLineTeachers.forEach(tid => {
                const found = data.find(row => row.teacherId === tid && row.month === month);
                entry[tid] = found ? found.totalEarned : 0;
            });
            return entry;
        });
    }, [data, selectedLineTeachers]);

    // Pagination calculations
    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = processedData.slice(startIndex, endIndex);

    const clearFilters = () => {
        setSelectedMonth("");
        setSelectedTeacher("");
        setSelectedSchool("");
        setSelectedClass("");
        setCurrentPage(1);
    };

    const hasActiveFilters = selectedMonth || selectedTeacher || selectedSchool || selectedClass;

    // Export functions
    const handleExport = () => {
        const header = selectedMonth === "" 
            ? "Enseignant,Période,Total Gagné,Nombre de factures,Dernier paiement\n"
            : "Enseignant,Mois,Année,Total Gagné,Nombre de factures,Dernier paiement\n";
        
        const rows = processedData.map((row) => {
            if (selectedMonth === "") {
                return `"${row.teacherName}","${row.months ? row.months.join(', ') : 'N/A'}","${row.totalEarned.toFixed(2)} DH","${row.invoiceCount}","${row.lastPaymentDate || ''}"`;
            } else {
                return `"${row.teacherName}","${row.month}","${row.year}","${row.totalEarned.toFixed(2)} DH","${row.invoiceCount}","${row.lastPaymentDate || ''}"`;
            }
        });
        
        const csv = header + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedMonth === "" ? "teacher_earnings_all_months.csv" : "teacher_earnings.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        const exportData = processedData.map(row => {
            if (selectedMonth === "") {
                return {
                    "Enseignant": row.teacherName,
                    "Période": row.months ? row.months.join(', ') : 'N/A',
                    "Total Gagné": row.totalEarned,
                    "Nombre de factures": row.invoiceCount,
                    "Dernier paiement": row.lastPaymentDate
                };
            } else {
                return {
                    "Enseignant": row.teacherName,
                    "Mois": row.month,
                    "Année": row.year,
                    "Total Gagné": row.totalEarned,
                    "Nombre de factures": row.invoiceCount,
                    "Dernier paiement": row.lastPaymentDate
                };
            }
        });
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Gains enseignants");
        XLSX.writeFile(wb, selectedMonth === "" ? "gains_enseignants_tous_mois.xlsx" : "gains_enseignants.xlsx");
    };

    const handleTeacherSelect = (teacherId) => {
        // teacherId from teacherOptions is now a number
        setSelectedLineTeachers(prev => 
            prev.includes(teacherId) 
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Rapport des Gains des Enseignants</h2>
                            <p className="text-sm text-gray-500">Analyse détaillée des revenus par enseignant</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            CSV
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Excel
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total des Gains</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.total.toFixed(2)} DH</p>
                            </div>
                            <div className="bg-blue-200 p-2 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Moyenne/Enseignant</p>
                                <p className="text-2xl font-bold text-green-900">{stats.avgPerTeacher.toFixed(2)} DH</p>
                            </div>
                            <div className="bg-green-200 p-2 rounded-lg">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Enseignants Actifs</p>
                                <p className="text-2xl font-bold text-purple-900">{stats.teacherCount}</p>
                            </div>
                            <div className="bg-purple-200 p-2 rounded-lg">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Total Factures</p>
                                <p className="text-2xl font-bold text-orange-900">{stats.totalInvoices}</p>
                            </div>
                            <div className="bg-orange-200 p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-700">Filtres</span>
                            {hasActiveFilters && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {[selectedMonth, selectedTeacher, selectedSchool, selectedClass].filter(Boolean).length} actifs
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Mois
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="all-months"
                                                name="month-filter"
                                                checked={selectedMonth === ""}
                                                onChange={() => setSelectedMonth("")}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="all-months" className="text-sm text-gray-700 cursor-pointer">
                                                Tous les mois
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="specific-month"
                                                name="month-filter"
                                                checked={selectedMonth !== ""}
                                                onChange={() => setSelectedMonth(monthsList.length > 0 ? monthsList[0].value : "")}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="specific-month" className="text-sm text-gray-700 cursor-pointer">
                                                Mois spécifique
                                            </label>
                                        </div>
                                        {selectedMonth !== "" && (
                                            <div className="relative">
                                                <input
                                                    type="month"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                                    value={selectedMonth}
                                                    onChange={(e) => {
                                                        setSelectedMonth(e.target.value);
                                                        console.log('Selected month:', selectedMonth);
                                                    }}
                                                />
                                                <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                                                {/* {selectedMonth && (
                                                    <button
                                                        
                                                        className="absolute right-2 top-2.5"
                                                    >
                                                        <X className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer " />
                                                    </button>
                                                )} */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <Users className="w-4 h-4 inline mr-1" />
                                        Enseignant
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                        value={selectedTeacher}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                    >
                                        <option value="">Tous les enseignants</option>
                                        {teacherOptions.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <School className="w-4 h-4 inline mr-1" />
                                        École
                                        {schools.length > 0 && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                ({schools.length} école{schools.length !== 1 ? 's' : ''})
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                        value={selectedSchool}
                                        onChange={(e) => setSelectedSchool(e.target.value)}
                                        disabled={schoolsLoading}
                                    >
                                        <option value="">
                                            {schoolsLoading ? "Chargement..." : "Toutes les écoles"}
                                        </option>
                                        {Array.isArray(schools) && schools.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {schoolsLoading && (
                                        <p className="text-xs text-gray-500">
                                            Chargement des écoles...
                                        </p>
                                    )}
                                    {!schoolsLoading && schools.length === 0 && (
                                        <p className="text-xs text-gray-500">
                                            Aucune école trouvée
                                        </p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <GraduationCap className="w-4 h-4 inline mr-1" />
                                        Classe
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        disabled={!selectedSchool}
                                    >
                                        <option value="">Toutes les classes</option>
                                        {Array.isArray(classes) && classes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {hasActiveFilters && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Effacer les filtres
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                        <p className="text-gray-500">Chargement des données...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <X className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-red-900">Erreur</h3>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                 {/* Data Table */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Détail des Gains</h3>
                                {data.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        {totalItems} résultat{totalItems !== 1 ? 's' : ''} au total
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                            N°
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Enseignant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {selectedMonth === "" ? "Période (Tous)" : "Période"}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Gagné
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>Factures</span>
                                                <Info className="w-4 h-4" title="Nombre de factures payées" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>Dernier Paiement</span>
                                                <Info className="w-4 h-4" title="Date du dernier paiement reçu" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <Users className="w-12 h-12 text-gray-300" />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">Aucun résultat</h3>
                                                        <p className="text-sm text-gray-500">
                                                            Aucune donnée trouvée pour les filtres sélectionnés.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, i) => {
                                            const globalIndex = startIndex + i + 1;
                                            return (
                                            <tr 
                                                key={i} 
                                                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-200`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                                    {globalIndex}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {row.teacherName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            {selectedMonth === "" ? (
                                                                <div>
                                                                    <div className="text-sm text-gray-900">
                                                                        {row.months ? `${row.months.length} mois` : row.month}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {row.months ? `${row.months[0]} - ${row.months[row.months.length - 1]}` : row.year}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <div className="text-sm text-gray-900">{row.month}</div>
                                                                    <div className="text-xs text-gray-500">{row.year}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-blue-600">
                                                        {row.totalEarned.toFixed(2)} DH
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {row.invoiceCount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {row.lastPaymentDate || (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => setDetail({
                                                            teacherId: row.teacherId,
                                                            teacherName: row.teacherName,
                                                            month: selectedMonth === "" ? "all" : row.month
                                                        })}
                                                        className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                                        title={selectedMonth === "" ? "Voir le détail de tous les mois" : "Voir le détail"}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {data.length > 0 && (
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
                                                Total Général:
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                {stats.total.toFixed(2)} DH
                                            </td>
                                            <td colSpan={3}></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {data.length > 0 && totalPages > 1 && (
                            <div className="bg-white px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm text-gray-700">
                                            Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                                            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> sur{' '}
                                            <span className="font-medium">{totalItems}</span> résultats
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm text-gray-700">Par page:</label>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Première
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Précédent
                                        </button>
                                        
                                        {/* Page numbers */}
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-1 text-sm border rounded-md ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Suivant
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Dernière
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Répartition des Gains
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {selectedMonth || "Tous les mois"}
                                </span>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {pieChartData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(value) => [`${value.toFixed(2)} DH`, 'Montant']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Gains par Enseignant
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {selectedMonth || "Tous les mois"}
                                </span>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <XAxis 
                                        dataKey="teacherName" 
                                        tick={{ fontSize: 12 }} 
                                        interval={0} 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip 
                                        formatter={(value) => [`${value.toFixed(2)} DH`, 'Montant']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Bar 
                                        dataKey="totalEarned" 
                                        fill="#3B82F6" 
                                        radius={[4, 4, 0, 0]}
                                        onClick={(data) => {
                                            if (data) {
                                                const teacher = teacherOptions.find(t => t.name === data.teacherName);
                                                if (teacher) {
                                                    setSelectedLineTeachers([teacher.id]);
                                                }
                                            }
                                        }}
                                        cursor="pointer"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-gray-500 mt-2">
                                Cliquez sur une barre pour voir la tendance de l'enseignant
                            </p>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Évolution des Gains
                            </h3>
                            
                            {/* Upgraded Teacher Multi-Select Dropdown */}
                            <div className="relative" ref={teacherSelectRef}>
                                <div className="flex items-center">
                                    <label className="text-sm text-gray-500 mr-2 shrink-0">Sélectionner :</label>
                                    <button
                                        onClick={() => setIsTeacherSelectOpen(!isTeacherSelectOpen)}
                                        className="inline-flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <span className="truncate">
                                            {selectedLineTeachers.length === 0
                                                ? "Aucun enseignant"
                                                : `${selectedLineTeachers.length} sélectionné(s)`}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform shrink-0 ${isTeacherSelectOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {isTeacherSelectOpen && (
                                    <div className="absolute z-20 mt-1 w-full md:w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
                                        <div className="p-2 border-b border-gray-200">
                                            <input
                                                type="text"
                                                placeholder="Rechercher..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                value={teacherSearchTerm}
                                                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <ul className="max-h-60 overflow-y-auto">
                                            {filteredTeacherOptions.length > 0 ? (
                                                filteredTeacherOptions.map((teacher) => (
                                                    <li
                                                        key={teacher.id}
                                                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() => handleTeacherSelect(teacher.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={selectedLineTeachers.includes(teacher.id)}
                                                            readOnly
                                                        />
                                                        <span className="ml-3 text-sm text-gray-800">{teacher.name}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-3 py-2 text-sm text-gray-500 text-center">Aucun enseignant trouvé</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={multiLineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <RechartsTooltip 
                                    formatter={(value, name) => [
                                        `${value.toFixed(2)} DH`, 
                                        teacherOptions.find(t => t.id === name)?.name || name
                                    ]}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend />
                                {selectedLineTeachers.map((tid, idx) => (
                                    <Line
                                        key={tid}
                                        type="monotone"
                                        dataKey={tid}
                                        name={teacherOptions.find(t => t.id === tid)?.name}
                                        stroke={COLORS[idx % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ fill: COLORS[idx % COLORS.length], strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: COLORS[idx % COLORS.length], strokeWidth: 2, fill: 'white' }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        
                        {selectedLineTeachers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Sélectionnez un ou plusieurs enseignants pour voir l'évolution de leurs gains</p>
                            </div>
                        )}
                    </div>

                   
                </>
            )}

        </div>
        
        {/* Detail Modal - Outside main container to avoid spacing issues */}
        <TeacherEarningsDetailModal
            teacherId={detail?.teacherId}
            teacherName={detail?.teacherName}
            month={detail?.month}
            open={!!detail}
            onClose={() => setDetail(null)}
        />
        </>
    );
};

export default TeacherEarningsTable;