import { router, usePage, Link } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import TableSearch from "../../Components/TableSearch";
import Table from "../../Components/Table";
import Pagination from "../../Components/Pagination";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Eye, RotateCcw } from "lucide-react";
import FormModal from "../../Components/FormModal";
import FilterForm from "@/Components/FilterForm";
import { motion } from "framer-motion";

const columns = [
    {
        header: "Info",
        accessor: "info",
    },
    {
        header: "ID de l'élève",
        accessor: "studentId",
        className: "hidden md:table-cell",
    },
    {
        header: "Classe",
        accessor: "class",
        className: "hidden md:table-cell",
    },
    {
        header: "Téléphone",
        accessor: "phone",
        className: "hidden lg:table-cell",
    },
    {
        header: "Adresse",
        accessor: "address",
        className: "hidden lg:table-cell",
    },
    {
        header: "Statut d'adhésion",
        accessor: "membershipStatus",
        className: "hidden lg:table-cell",
    },
    {
        header: "Actions",
        accessor: "action",
        className: "text-center",
    },
];

const StudentListPage = ({
    students,
    Allclasses,
    Alllevels,
    Allschools,
    filters: initialFilters,
    Allmemberships,
}) => {
    // State for filters and search
    const [filters, setFilters] = useState({
        school: initialFilters.school || "",
        class: initialFilters.class || "",
        level: initialFilters.level || "",
        search: initialFilters.search || "",
        membership_status: initialFilters.membership_status || "all",
    });
    // Ensure students is always an array
    const safeStudents = Array.isArray(students?.data) ? students.data : [];
    // Sort students by created_at descending (latest first)
    const sortedStudents = [...safeStudents].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    // Custom search filter for parent phone and parent name (client-side fallback)
    const filteredStudents = filters.search
        ? sortedStudents.filter((student) => {
              const search = filters.search.toLowerCase();
              // Helper to normalize phone numbers (remove spaces, dashes, parentheses, leading +, etc.)
              const normalizePhone = (phone) =>
                  phone
                      ?.replace(/\D/g, "") // Remove all non-digits
                      .replace(/^212/, "0") // Convert +212 or 212 to 0
                      .replace(/^0+/, "0"); // Ensure only one leading zero

              const normalizedSearch = normalizePhone(search);
              const normalizedStudentPhone = normalizePhone(student.phone || "");
              const normalizedGuardianPhone = normalizePhone(student.guardianNumber || "");

              // Also check original phone for partial matches (for +212... search)
              return (
                  (student.name && student.name.toLowerCase().includes(search)) ||
                  (student.studentId && student.studentId.toLowerCase().includes(search)) ||
                  (student.phone && student.phone.toLowerCase().includes(search)) ||
                  (student.address && student.address.toLowerCase().includes(search)) ||
                  (student.guardianNumber && student.guardianNumber.toLowerCase().includes(search)) ||
                  (student.guardianName && student.guardianName.toLowerCase().includes(search)) ||
                  (normalizedSearch && normalizedStudentPhone.includes(normalizedSearch)) ||
                  (normalizedSearch && normalizedGuardianPhone.includes(normalizedSearch))
              );
          })
        : sortedStudents;
    const pageProps = usePage().props;
    const role = pageProps.auth.user.role;

    const [showFilters, setShowFilters] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [hasRestored, setHasRestored] = useState(false);
    const [isPreservingPage, setIsPreservingPage] = useState(false);
    
    // Get current page from Inertia page props
    const getCurrentPage = () => {
        return pageProps.students?.current_page || 1;
    };
    
    // Check for stored state or URL page parameter on component mount
    useEffect(() => {
        // First check for stored state from navigation
        const storedState = sessionStorage.getItem('studentListState');
        if (storedState) {
            try {
                const parsedState = JSON.parse(storedState);
                // Check if the stored state is recent (within 5 minutes)
                if (Date.now() - parsedState.timestamp < 5 * 60 * 1000) {
                    // Validate page number
                    const maxPage = pageProps.students?.last_page || 1;
                    const validPage = Math.min(parsedState.page, maxPage);
                    
                    setIsRestoring(true);
                    
                    // Restore filters
                    setFilters(prevFilters => ({
                        ...prevFilters,
                        ...parsedState.filters
                    }));
                    
                    // Navigate to the stored page
                    router.get(route("students.index"), {
                        ...parsedState.filters,
                        page: validPage
                    }, {
                        preserveState: true,
                        replace: true,
                        preserveScroll: true
                    });
                    
                    // Clear the stored state after use
                    sessionStorage.removeItem('studentListState');
                    
                    // Mark that restoration has happened
                    setHasRestored(true);
                    
                    // Reset the restoring flag after a delay to ensure navigation completes
                    setTimeout(() => {
                        setIsRestoring(false);
                    }, 2000);
                }
            } catch (error) {
                console.error('Error parsing stored state:', error);
                sessionStorage.removeItem('studentListState');
            }
        } else {
            // No stored state, check if we need to preserve page from URL
            const urlParams = new URLSearchParams(window.location.search);
            const urlPage = urlParams.get('page');
            const currentPage = pageProps.students?.current_page || 1;
            
            // If URL has a page parameter, ensure it's preserved
            if (urlPage) {
                setIsPreservingPage(true);
                
                // Get current filters from URL
                const urlFilters = {
                    school: urlParams.get('school') || '',
                    class: urlParams.get('class') || '',
                    level: urlParams.get('level') || '',
                    search: (urlParams.get('search') || '').trim(), // Trim search value
                    membership_status: urlParams.get('membership_status') || 'all'
                };
                
                // Update filters state to match URL
                setFilters(urlFilters);
                
                // Build the full URL with all parameters
                const params = new URLSearchParams();
                Object.keys(urlFilters).forEach(key => {
                    if (urlFilters[key] && urlFilters[key] !== 'all') {
                        // Trim search value when building URL
                        const value = key === 'search' ? urlFilters[key].trim() : urlFilters[key];
                        if (value) {
                            params.set(key, value);
                        }
                    }
                });
                params.set('page', urlPage);
                
                const queryString = params.toString();
                const fullUrl = `/students${queryString ? `?${queryString}` : ''}`;
                
                // Navigate to ensure page state is preserved
                router.visit(fullUrl, {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        // Reset the flag after a delay to prevent filter effect from overriding
                        setTimeout(() => {
                            setIsPreservingPage(false);
                        }, 3000);
                    },
                    onError: () => {
                        setIsPreservingPage(false);
                    }
                });
            }
        }
    }, []);
    
    // Debounced function to apply filters
    useEffect(() => {
        if (isRestoring || isPreservingPage) {
            return; // Skip during restoration or page preservation
        }
        
        // Skip if we just completed page preservation and we're on the correct page
        // BUT only if we're in the initial state (no search, no active filters)
        const urlParams = new URLSearchParams(window.location.search);
        const urlPage = urlParams.get('page');
        const currentPage = pageProps.students?.current_page || 1;
        
        // Check if we're in initial state (no search, no active filters)
        const isInitialState = Object.values(filters).every(value => 
            value === '' || value === 'all'
        );
        
        if (urlPage && parseInt(urlPage) === currentPage && isInitialState) {
            return; // Skip if page matches URL and in initial state
        }
        
        // Skip if we just restored and filters haven't changed from initial state
        if (hasRestored && isInitialState) {
            return;
        }
        
        const timeoutId = setTimeout(() => {
            // Trim search value before sending
            const cleanFilters = {
                ...filters,
                search: filters.search ? filters.search.trim() : ''
            };
            
            router.get(
                route("students.index"),
                cleanFilters,
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, isRestoring, hasRestored, isPreservingPage]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Reset restoration and preservation flags when user manually changes filters
        setHasRestored(false);
        setIsPreservingPage(false);

        // Trim search value if it's the search field
        const cleanValue = name === 'search' ? value.trim() : value;

        // Update the filters state
        const newFilters = { ...filters, [name]: cleanValue };
        setFilters(newFilters);

        // Use Inertia to navigate with the new filters while resetting to page 1
        router.get(
            route("students.index"),
            {
                ...newFilters,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Clear filters and reset the page
    const clearFilters = () => {
        // Reset restoration and preservation flags when user manually clears filters
        setHasRestored(false);
        setIsPreservingPage(false);
        
        setFilters({
            school: "",
            class: "",
            level: "",
            search: "",
            membership_status: "all",
        });

        // Navigate to the index route without any query parameters
        router.get(
            route("students.index"),
            {}, // No query parameters
            { preserveState: false, replace: true, preserveScroll: true },
        );
    };

    // Toggle visibility of filters
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };
    
    // Navigate to student with preserved state
    const navigateToStudent = (studentId) => {
        const currentPage = getCurrentPage();
        
        // Store the current state in sessionStorage for back navigation
        const currentState = {
            page: currentPage,
            filters: filters,
            timestamp: Date.now()
        };
        sessionStorage.setItem('studentListState', JSON.stringify(currentState));
        
        // Navigate to student page
        router.visit(`/students/${studentId}`);
    };

    // Render table rows
    const renderRow = (item) => {

        return (
            <tr
                key={item.id}
                className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
            >
                <td
                    onClick={role !== "teacher" ? () => navigateToStudent(item.id) : undefined}
                    className="flex items-center gap-4 p-4 cursor-pointer"
                >

                <img
                    src={
                        item.profile_image
                            ? item.profile_image
                            : "/studentProfile.png"
                    }
                    alt={item.name}
                    width={40}
                    height={40}
                    className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-xs text-gray-500">
                        {
                            Alllevels.find((level) => level.id === item.levelId)
                                ?.name
                        }
                    </p>
                </div>
            </td>
            <td className="hidden md:table-cell">{item.id}</td>
            <td className="hidden md:table-cell">
                {Allclasses.find((group) => group.id === item.classId)?.name}
            </td>
            <td className="hidden md:table-cell">{item.guardianNumber}</td>
            <td className="hidden md:table-cell">{item.address}</td>
            <td className="hidden md:table-cell w-1/12">
                {Allmemberships.filter(
                    (membership) => membership.student_id === item.id,
                ).length > 0 ? (
                    <div className="flex flex-col space-y-1">
                        {/* Payment ratio with colored stats */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="font-semibold text-emerald-600">
                                    {
                                        Allmemberships.filter(
                                            (membership) =>
                                                membership.student_id ===
                                                item.id &&
                                                membership.payment_status ===
                                                "paid",
                                        ).length
                                    }
                                </span>
                                <span className="mx-1 text-gray-400">/</span>
                                <span className="font-medium text-gray-700">
                                    {
                                        Allmemberships.filter(
                                            (membership) =>
                                                membership.student_id ===
                                                item.id,
                                        ).length
                                    }
                                </span>
                            </div>
                        </div>
                        {/* Progress bar with animation */}
                        {(() => {
                            const paid = Allmemberships.filter(
                                (membership) =>
                                    membership.student_id === item.id &&
                                    membership.payment_status === "paid",
                            ).length;
                            const total = Allmemberships.filter(
                                (membership) => membership.student_id === item.id,
                            ).length;
                            const percentage = total > 0 ? (paid / total) * 100 : 0;

                            let bgColorClass = "bg-gray-300";
                            if (percentage === 100) bgColorClass = "bg-emerald-500";
                            else if (percentage >= 75) bgColorClass = "bg-green-500";
                            else if (percentage >= 50) bgColorClass = "bg-amber-500";
                            else if (percentage > 0) bgColorClass = "bg-orange-500";
                            else bgColorClass = "bg-red-500";

                            return (
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${bgColorClass}`}
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{
                                            duration: 0.8,
                                            ease: "easeInOut",
                                        }}
                                    ></motion.div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    "-"
                )}
            </td>
            <td className=" p-4">
                <div className="flex items-center gap-2 justify-center">

                    {(role === "admin" || role === "assistant") && (
                        <>
                            <button 
                                onClick={() => navigateToStudent(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
                            >
                                <Eye className="w-4 h-4 text-white" />
                            </button>
                            <FormModal
                                table="student"
                                type="update"
                                data={item}
                                levels={Alllevels}
                                classes={Allclasses}
                                schools={Allschools}
                            />
                            <FormModal
                                table="student"
                                type="delete"
                                id={item.id}
                                route="students"
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
        );
    };

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">
                    Tous les étudiants
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch
                        routeName="students.index"
                        value={filters.search}
                        onChange={(value) =>
                            setFilters((prev) => ({ ...prev, search: value }))
                        }
                    />

                    <div className="flex items-center gap-4 self-end">
                        <button
                            onClick={clearFilters}
                            className="w-8 h-8 flex  items-center justify-center rounded-full bg-lamaYellow"
                        >
                            <RotateCcw className="w-4 h-4 text-black" />
                        </button>
                        <button
                            onClick={toggleFilters}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                        >
                            <img
                                src="/filter.png"
                                alt="Filter"
                                width={14}
                                height={14}
                            />
                        </button>

                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                            <img
                                src="/sort.png"
                                alt="Sort"
                                width={14}
                                height={14}
                            />
                        </button>
                        {(role === "admin" || role === "assistant") && (
                            <FormModal
                                table="student"
                                type="create"
                                levels={Alllevels}
                                classes={Allclasses}
                                schools={Allschools}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* FILTER FORM */}
            {showFilters && (
                <FilterForm
                    schools={Allschools}
                    classes={Allclasses}
                    levels={Alllevels}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            )}

            {/* LIST */}
            <Table
                columns={columns}
                data={filteredStudents}
                renderRow={renderRow}
                emptyText="Aucun étudiant trouvé."
            />
            <Pagination links={students.links} filters={filters} />
        </div>
    );
};

StudentListPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default StudentListPage;
