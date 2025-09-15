"use client"

import { useState, useEffect } from "react"
import { router } from "@inertiajs/react"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { SchoolIcon } from "lucide-react"
import InvoiceDetails from "@/Components/InvoiceDetails" // Import the component
import InvoiceModal from "@/Components/InvoiceModal" // Import the modal component
import { downloadInvoicePdf } from "@/lib/invoiceUtils" // Import the utility

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Custom SVG Icons
const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
)

const CreditCardIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
)

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
    />
  </svg>
)

const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
)

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
)

const XMarkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const ArrowUpIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
  </svg>
)

const ArrowDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
  </svg>
)

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const DollarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
)

const ReceiptIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5l-5-5 4-4 5 5v6a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h7l5 5v11z"
    />
  </svg>
)

const DotsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
)

const ExternalLinkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

const CashierPage = ({
  invoices = [],
  chartData = [],
  totalPaid = 0,
  previousDayTotal = 0,
  cashierStats = {
    totalInvoices: 0,
    totalPaid: 0,
    averagePayment: 0,
    peakHour: { hour: 0, total: 0 }
  },
  date = new Date().toISOString().slice(0, 10),
  filters = { memberships: [], students: [], creators: [], schools: [], offers: [] },
  currentFilters = {
    membership_id: "",
    student_id: "",
    creator_id: "",
    date: new Date().toISOString().slice(0, 10),
    school_id: "",
    offer_id: "",
  },
  pagination = null,
  role = null,
}) => {
  const getTodayDate = () => new Date().toISOString().slice(0, 10)
  const [localFilters, setLocalFilters] = useState(() => ({
    membership_id: currentFilters.membership_id || "",
    student_id: currentFilters.student_id || "",
    creator_id: currentFilters.creator_id || "",
    date: currentFilters.date || getTodayDate(),
    school_id: currentFilters.school_id || "",
    offer_id: currentFilters.offer_id || "",
  }))

  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);


  const isAssistant = role === 'assistant';

  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  const chartDataConfig = {
    labels: chartData.map((d) => `${d.hour.toString().padStart(2, "0")}h`),
    datasets: [
      {
        label: "Total Paid",
        data: chartData.map((d) => d.total),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }

  // Calculate trends and statistics using backend data
  const dailyChange = cashierStats.totalPaid - previousDayTotal
  const dailyChangePercent = previousDayTotal > 0 ? (dailyChange / previousDayTotal) * 100 : 0
  const averagePayment = cashierStats.averagePayment
  const peakHour = cashierStats.peakHour

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.membership?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.creator?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Prepare chart data
  const maxChartValue = Math.max(...(chartData?.map((c) => c.total) || [0]), 1)

  useEffect(() => {
    setLocalFilters((prev) => {
      const next = {
        membership_id: currentFilters.membership_id || "",
        student_id: currentFilters.student_id || "",
        creator_id: currentFilters.creator_id || "",
        date: currentFilters.date || getTodayDate(),
        school_id: currentFilters.school_id || "",
        offer_id: currentFilters.offer_id || "",
      }
      const hasChanged = Object.keys(next).some((key) => prev[key] !== next[key])
      return hasChanged ? next : prev
    })
  }, [currentFilters])

  const handleFilterChange = (name, value) => {
    let newFilters = { ...localFilters, [name]: value }
    // If offer_id is changed, reset membership_id
    if (name === "offer_id") {
      newFilters.membership_id = ""
    }
    const finalFilters = {
      ...newFilters,
      date: newFilters.date && newFilters.date.trim() !== "" ? newFilters.date : getTodayDate(),
    }
    setLocalFilters(finalFilters)

    const cleanFilters = Object.fromEntries(
      Object.entries(finalFilters).filter(([key, val]) => val !== "" || key === "date"),
    )

    router.get("/cashier/daily", cleanFilters, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const clearFilters = () => {
    const todayDate = getTodayDate()
    const resetFilters = {
      membership_id: "",
      student_id: "",
      creator_id: "",
      date: todayDate,
      school_id: "",
      offer_id: "",
    }
    setLocalFilters(resetFilters)
    router.get(
      "/cashier/daily",
      { date: todayDate },
      {
        preserveState: true,
        preserveScroll: true,
      },
    )
  }

  const refreshData = () => {
    setIsRefreshing(true)
    setIsLoading(true)
    router.reload({
      onFinish: () => {
        setIsRefreshing(false)
        setIsLoading(false)
      },
    })
  }

  const exportCSV = () => {
    const header = ["ID", "Élève", "Adhésion", "Montant payé", "Créé par", "Date"]
    const rows = filteredInvoices.map((inv) => [
      inv.id,
      inv.student ? inv.student.name : "-",
      inv.membership ? inv.membership.name : "-",
      inv.amountPaid,
      inv.creator ? inv.creator.name : "-",
      new Date(inv.created_at).toLocaleString(),
    ])
    const csv = [header, ...rows].map((r) => r.map((x) => `"${x}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `caisse_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShowDetails = async (invoiceId) => {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/invoices/${invoiceId}`);
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setSelectedInvoice(data.invoice);
          setIsDetailsModalOpen(true);
      } catch (error) {
          console.error("Failed to fetch invoice details:", error);
          // Optionally, show an error message to the user
      } finally {
          setIsLoading(false);
      }
  };

  const handlePrintReceipt = (invoiceId) => {
      downloadInvoicePdf(invoiceId, setDownloadLoading);
  };

  const activeFiltersCount = Object.values(localFilters).filter((v) => v && v !== "").length - 1

  // Pagination handler
  const handlePageChange = (page) => {
    const params = { ...localFilters, page }
    router.get("/cashier/daily", params, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Caisse journalière</h1>
                <p className="text-sm text-slate-600">
                  {new Date(date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualiser
              </button>
              {!isAssistant && (
                <>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <FilterIcon className="h-4 w-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full ml-1">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Exporter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Filters Panel */}
        {showFilters && !isAssistant && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Filtres avancés</h3>
                  <p className="text-sm text-slate-600 mt-1">Affinez votre recherche avec les filtres ci-dessous</p>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={localFilters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Offer Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Offre
                  </label>
                  <select
                    value={localFilters.offer_id}
                    onChange={e => handleFilterChange("offer_id", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Toutes les offres</option>
                    {filters?.offers?.map((offer) => (
                      <option key={offer.id} value={offer.id}>{offer.name}</option>
                    ))}
                  </select>
                </div>

                {/*
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Élève
                  </label>
                  <select
                    value={localFilters.student_id}
                    onChange={(e) => handleFilterChange("student_id", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Tous les élèves</option>
                    {filters?.students?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                */}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Créé par
                  </label>
                  <select
                    value={localFilters.creator_id}
                    onChange={(e) => handleFilterChange("creator_id", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Tous les créateurs</option>
                    {filters?.creators?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* School Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <SchoolIcon className="h-4 w-4" />
                    École
                  </label>
                  <select
                    value={localFilters.school_id}
                    onChange={(e) => handleFilterChange("school_id", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Toutes les écoles</option>
                    {filters?.schools?.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Total encaissé</p>
                <p className="text-3xl font-bold text-green-700">{cashierStats.totalPaid.toLocaleString()} DH</p>
                <div className="flex items-center gap-1 text-sm">
                  {dailyChange >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className={dailyChange >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.abs(dailyChangePercent).toFixed(1)}% vs hier
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Invoices Count Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Factures</p>
                <p className="text-3xl font-bold text-blue-700">{cashierStats.totalInvoices}</p>
                <p className="text-sm text-slate-500">{filteredInvoices.length} affichées</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ReceiptIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Average Payment Card */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Paiement moyen</p>
                <p className="text-3xl font-bold text-purple-700">{averagePayment.toFixed(0)} DH</p>
                <p className="text-sm text-slate-500">Par transaction</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Peak Hour Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Heure de pointe</p>
                <p className="text-3xl font-bold text-orange-700">{peakHour.hour.toString().padStart(2, "0")}h</p>
                <p className="text-sm text-slate-500">{peakHour.total.toLocaleString()} DH encaissés</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Répartition horaire
                </h3>
                <p className="text-sm text-slate-600 mt-1">Analyse des revenus par heure de la journée</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 mx-auto text-blue-600 border-4 border-t-transparent rounded-full"></div>
              </div>
            ) : chartData.length > 0 ? (
              <Bar data={chartDataConfig} options={chartOptions} />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Aucune donnée disponible</p>
                <p className="text-sm">Les données apparaîtront ici une fois les premières ventes enregistrées</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Factures du jour</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? "s" : ""}
                  {searchTerm && ` correspondant à "${searchTerm}"`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                      N°
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        Élève
                        <ExternalLinkIcon className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Adhésion
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Créé par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredInvoices.map((invoice, index) => {
                    // Calculate global position based on pagination
                    const globalIndex = pagination ? 
                      (pagination.current_page - 1) * pagination.per_page + index + 1 : 
                      index + 1;
                    return (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">{globalIndex}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.student ? (
                          <a 
                            href={route('students.show', { student: invoice.student.id })}
                            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {invoice.student.name}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.type === 'assurance' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            Assurance
                          </span>
                        ) : invoice.membership ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {invoice.membership.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-semibold text-green-700">{invoice.amountPaid.toLocaleString()} DH</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-600">{invoice.creator ? invoice.creator.name : "-"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-slate-500">
                            {new Date(invoice.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>
                        {activeDropdown === invoice.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                                onClick={() => handleShowDetails(invoice.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <EyeIcon className="h-4 w-4" />
                              Voir détails
                            </button>
                            <button
                                onClick={() => handlePrintReceipt(invoice.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <ReceiptIcon className="h-4 w-4" />
                              Imprimer reçu
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Première
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded border text-sm ${pagination.current_page === page ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.last_page)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Dernière
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <ReceiptIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? "Aucun résultat trouvé" : "Aucune facture trouvée"}
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Essayez de modifier votre recherche ou vos filtres"
                  : "Les factures apparaîtront ici une fois créées"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Invoice Details Modal */}
        <InvoiceModal
            isOpen={isDetailsModalOpen && !!selectedInvoice}
            closeModal={() => setIsDetailsModalOpen(false)}
            invoice={selectedInvoice}
        />

      {/* Click outside to close dropdown */}
      {activeDropdown && <div className="fixed inset-0 z-0" onClick={() => setActiveDropdown(null)} />}

        {/* Download Loading Overlay */}
        {downloadLoading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
    </div>
  )
}

CashierPage.layout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default CashierPage
