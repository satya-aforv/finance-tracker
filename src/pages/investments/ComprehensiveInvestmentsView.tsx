import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Eye,
  ArrowLeft,
  Trash2,
  Info,
  Clock,
  MessageCircleOffIcon,
  MessageCircle,
  MessageCircleCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { investorsService } from "../../services/investors";
import { plansService } from "../../services/plans";
import { investmentsService } from "../../services/investments";
import toast from "react-hot-toast";
import InvestmentTimeline from "../../components/investments/InvestmentTimeline";
import { useAuth } from "../../contexts/AuthContext";
import DocumentManager from "../../components/investments/DocumentManager";

const commentData = [
  {
    author: "Anjali Mehra",
    text: "Investment review completed. Proceed to next stage.",
    date: "2025-07-25T12:30:00Z",
    replies: [
      {
        author: "Anjali Mehra",
        text: "Acknowledged. Proceeding ahead.",
        date: "2025-07-24T14:30:00Z",
      },
    ],
  },
  {
    author: "Ravi Kumar",
    text: "Missing KYC document uploaded.",
    date: "2025-07-23T10:15:00Z",
  },
];

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      )}
      {children}
    </button>
  );
};

const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`}
      />
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
};

const ComprehensiveInvestmentsView = ({
  investmentsData,
  investmentId,
  onBack,
}) => {
  const { user } = useAuth();
  const [investor, setInvestor] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [investment, setInvestment] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlanOption, setSelectedPlanOption] = useState("existing"); // 'existing' or 'new'
  const investorId = investmentsData?.investor?._id || "";
  // Check if user can manage (admin/finance_manager)
  const canManage = user?.role === "admin" || user?.role === "finance_manager";
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: investment.status,
    notes: investment.notes || "",
  });
  const [showRemarksForm, setShowRemarksForm] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState(null);
  // Fetch investor data
  useEffect(() => {
    console.log(investmentsData, "investmentsData");
    const fetchInvestorData = async () => {
      try {
        setLoading(true);

        const [investorResponse, investmentsResponse, plansResponse] =
          await Promise.all([
            investorsService.getInvestor(investorId),
            investmentsService.getInvestments({
              investor: investorId,
            }),
            plansService.getActivePlans(),
          ]);

        setInvestor(investorResponse.data);
        console.log(investorResponse?.data, "investmentsResponse");
        setInvestments(investmentsResponse.data || []);
        setPlans(plansResponse.data || []);
      } catch (error) {
        console.error("Error fetching investor data:", error);
        if (canManage) {
          toast.error("Failed to load investor data");
        }
      } finally {
        setLoading(false);
      }
    };

    if (investorId) {
      fetchInvestorData();
    }
  }, [investorId]);

  // Fetch investor data
  useEffect(() => {
    const fetchInvestment = async (id: string) => {
      try {
        setLoading(true);
        const response = await investmentsService.getInvestment(id);

        setInvestment(response.data || []);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch investments"
        );
      } finally {
        setLoading(false);
      }
    };

    if (investmentsData?._id) {
      fetchInvestment(investmentsData?._id);
    }
  }, [investmentsData?._id]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const classes = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      blocked: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      closed: "bg-gray-100 text-gray-800",
      defaulted: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          classes[status] || classes.active
        }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const handleCreateInvestment = async (data) => {
    try {
      await investmentsService.createInvestment({
        ...data,
        investor: investorId,
      });

      toast.success("Investment created successfully");
      setShowInvestmentForm(false);

      // Refresh data
      const [investorResponse, investmentsResponse] = await Promise.all([
        investorsService.getInvestor(investorId),
        investmentsService.getInvestments({ investor: investorId }),
      ]);

      setInvestor(investorResponse.data);
      setInvestments(investmentsResponse.data || []);
    } catch (error) {
      console.error("Error creating investment:", error);
      toast.error(
        error.response?.data?.message || "Failed to create investment"
      );
    }
  };

  const handleRemarksSubmit = async (data) => {
    try {
      await investmentsService.addRemarks(investmentId, data.remarks);
      toast.success("Remarks added successfully");
      setShowRemarksForm(false);

      // Refresh investment data
      const response = await investmentsService.getInvestment(investmentId);
      setInvestment(response.data || []);
    } catch (error) {
      console.error("Error adding remarks:", error);
      toast.error(error.response?.data?.message || "Failed to add remarks");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // if (!investor) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  //         <p className="text-gray-500">Investor not found</p>
  //         {onBack && (
  //           <Button onClick={onBack} variant="outline" className="mt-4">
  //             <ArrowLeft className="h-4 w-4 mr-2" />
  //             Go Back
  //           </Button>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  const handleCancelEdit = () => {
    setEditData({
      status: investment.status,
      notes: investment.notes || "",
    });
    setIsEditing(false);
  };

  const getProgressPercentage = () => {
    console.log(investment, "investment");
    if (investment.totalExpectedReturns === 0) return 0;
    return Math.round(
      (investment.totalPaidAmount / investment.totalExpectedReturns) * 100
    );
  };

  const getProgressCounts = () => {
    // Check if investment data exists
    if (!investment?.schedule?.length) return 0;

    // Count completed schedules (paid or partial_paid)
    const completedCount = investment.schedule.filter(
      (s) => s.status === "paid" || s.status === "partial_paid"
    ).length;

    const totalSchedules = investment.schedule.length;

    // Calculate progress percentage (completed/total)
    const progressPercentage = (completedCount / totalSchedules) * 100;

    return Math.round(progressPercentage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button onClick={onBack} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {investor && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {investor?.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Investor ID: {investor?.investorId}
                  </p>
                </div>
              )}
            </div>
            {investor && (
              <div className="flex items-center space-x-3">
                {getStatusBadge(investor?.status)}
                <Button
                  onClick={() => setShowInvestmentForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Header with Edit Functionality */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg mt-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h2 className="text-3xl font-bold">
                    {investment?.investmentId}
                  </h2>
                  {getStatusBadge(investment?.status)}
                </div>
                <p className="text-blue-100 mt-2">
                  Investment created on {formatDate(investment.createdAt)}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-blue-200">Investor:</span>
                    <div className="font-medium">
                      {investment?.investor?.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-200">Plan:</span>
                    <div className="font-medium">{investment?.plan?.name}</div>
                  </div>
                  <div>
                    <span className="text-blue-200">Progress:</span>
                    <div className="font-medium">
                      {getProgressPercentage()}% Complete
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {canManage && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-green-600 border-green-600 text-white hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="bg-red-600 border-red-600 text-white hover:bg-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        {/* Quick Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Investment
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(investor.totalInvestment)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Returns
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(investor.totalReturns)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Investments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {investor.activeInvestments}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Member Since
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(investor.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>
        </div> */}

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "schedule", label: "Payment Schedule", icon: Calendar },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "timeline", label: "Activity Timeline", icon: Clock },
                { id: "referal", label: "Referal Details", icon: Clock },
              ].map((tab) => {
                if (user?.role !== "admin" && tab.id === "referal") {
                  return null;
                } else {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                }
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-700">
                          Principal
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(investment.principalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-700">
                          Expected Returns
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(investment.totalExpectedReturns)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-700">
                          Amount Paid
                        </p>
                        <p className="text-xl font-bold text-purple-900">
                          {formatCurrency(investment.totalPaidAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-500 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-700">
                          Remaining
                        </p>
                        <p className="text-xl font-bold text-orange-900">
                          {formatCurrency(investment.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Progress
                    </h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {investment?.schedule &&
                          investment?.schedule?.length > 0 &&
                          investment?.schedule
                            .map(
                              (s) =>
                                s.status == "paid" || s.status == "partial_paid"
                            )
                            .filter(Boolean).length}
                      </span>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getProgressCounts()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>
                      Started: {formatDate(investment.investmentDate)} <br />
                      Total Installments: {investment?.schedule?.length || 0}
                    </span>
                    <span>
                      Pending Installments:{" "}
                      {investment?.schedule
                        ? investment?.schedule?.length -
                          investment?.schedule
                            .map(
                              (s) =>
                                s.status == "paid" || s.status == "partial_paid"
                            )
                            .filter(Boolean).length
                        : 0}{" "}
                      <br />
                      Maturity: {formatDate(investment.maturityDate)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Investment Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Investment Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Investment Date:</span>
                        <span className="font-medium">
                          {formatDate(investment.investmentDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Maturity Date:</span>
                        <span className="font-medium">
                          {formatDate(investment.maturityDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium text-green-600">
                          {investment.interestRate}% per month
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Type:</span>
                        <span className="font-medium capitalize">
                          {investment.interestType}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Tenure:</span>
                        <span className="font-medium">
                          {investment.tenure} months
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Status:</span>
                        {isEditing ? (
                          <select
                            value={editData.status}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                status: e.target.value as any,
                              })
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="closed">Closed</option>
                            <option value="defaulted">Defaulted</option>
                          </select>
                        ) : (
                          getStatusBadge(investment.status)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Investor Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Investor Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {investment?.investor?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Investor ID:</span>
                        <span className="font-medium text-blue-600">
                          {investment?.investor?.investorId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {investment?.investor?.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {investment?.investor?.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referal Details */}
                {!canManage && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Referal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Referrer Name</p>
                        <p className="font-semibold text-lg">
                          {investor?.referralCode || "N/A"}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Referrer Email</p>
                        <p className="font-semibold text-lg text-blue-600">
                          {investor?.referredBy?.name || "N/A"}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Referrer Mobile</p>
                        <p className="font-semibold text-lg capitalize">
                          {investor?.referredBy?.mobile || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Details */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Plan Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Plan Name</p>
                      <p className="font-semibold text-lg">
                        {investment?.plan?.name}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Plan ID</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {investment?.plan?.planId}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Interest Type</p>
                      <p className="font-semibold text-lg capitalize">
                        {investment?.plan?.interestType}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Tenure</p>
                      <p className="font-semibold text-lg">
                        {investment?.plan?.tenure} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notes
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editData.notes}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add notes about this investment..."
                    />
                  ) : (
                    <div className="text-gray-700">
                      {investment?.notes ? (
                        <p className="whitespace-pre-wrap">
                          {investment?.notes}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">
                          No notes available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Schedule
                  </h3>
                  <div className="text-sm text-gray-500">
                    {investment?.schedule?.length} total payments
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Principal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {investment?.schedule.map((payment, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{payment.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.interestAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.principalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatCurrency(payment.paidAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {formatCurrency(
                              payment.totalAmount - payment.paidAmount
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <MessageCircleCode
                              onClick={() => {
                                setPaymentSchedule(payment);
                                setShowRemarksForm(true);
                              }}
                              className="h-5 w-5 text-blue-600 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <DocumentManager
                  investmentId={investment._id}
                  isEditable={canManage}
                />
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <InvestmentTimeline
                  investmentId={investment._id}
                  isEditable={canManage}
                />
              </motion.div>
            )}

            {/* Referal Tab */}
            {activeTab === "referal" && user?.role === "admin" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Referral Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Referrer Name : {investor?.referralCode || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Referrer Email : {investor?.referredBy?.name || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Referrer Mobile : {investor?.referredBy?.mobile || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Referrer Alt Mobile : {investor?.referredBy?.name || 0}
                    </p>
                  </div>
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Relation with referrer : {investor?.referredBy?.name || 0}
                    </p>
                  </div>
                  <div className="bg-white px-6 ">
                    <p className="text-md text-gray-900">
                      Relation fee : {investor?.referredBy?.name || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Creation Modal */}
      <Modal
        isOpen={showInvestmentForm}
        onClose={() => setShowInvestmentForm(false)}
        title="Create New Investment"
        size="2xl"
      >
        <InvestmentCreationForm
          investor={investor}
          plans={plans}
          onSubmit={handleCreateInvestment}
          onCancel={() => setShowInvestmentForm(false)}
        />
      </Modal>

      {/* Remarks Creation Modal */}
      <Modal
        isOpen={showRemarksForm}
        onClose={() => setShowRemarksForm(false)}
        title={`Add Remarks for ${investment.investmentId}`}
        size="md"
      >
        <CreateRemarksForm
          investmentId={investment._id}
          investment={investment}
          paymentSchedule={paymentSchedule}
          onSubmit={handleRemarksSubmit}
          onCancel={() => setShowRemarksForm(false)}
        />
      </Modal>
    </div>
  );
};

// Investment Creation Form Component
const InvestmentCreationForm = ({ investor, plans, onSubmit, onCancel }) => {
  const [selectedPlanOption, setSelectedPlanOption] = useState("existing");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      investmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      principalAmount: "",
      plan: "",
      // New plan fields with complete payment structure
      newPlan: {
        name: `${investor.name.split(" ")[0]} Custom Plan`,
        description: "",
        interestRate: 2.5,
        interestType: "flat",
        tenure: 12,
        minInvestment: 10000,
        maxInvestment: 1000000,
        paymentType: "interest",
        riskLevel: "medium",
        features: [],
        // Interest Payment Configuration
        interestPayment: {
          dateOfInvestment: new Date().toISOString().split("T")[0],
          amountInvested: 0,
          interestFrequency: "monthly",
          principalRepaymentOption: "fixed",
          withdrawalAfterPercentage: 50,
          principalSettlementTerm: 12,
        },
        // Interest with Principal Payment Configuration
        interestWithPrincipalPayment: {
          dateOfInvestment: new Date().toISOString().split("T")[0],
          investedAmount: 0,
          principalRepaymentPercentage: 10,
          paymentFrequency: "monthly",
          interestPayoutDate: "",
          principalPayoutDate: "",
        },
      },
    },
  });

  const watchPlan = watch("plan");
  const watchPrincipalAmount = watch("principalAmount");
  const watchNewPlan = watch("newPlan");

  useEffect(() => {
    if (selectedPlanOption === "existing" && watchPlan) {
      const plan = plans.find((p) => p._id === watchPlan);
      setSelectedPlan(plan || null);
    } else if (selectedPlanOption === "new") {
      setSelectedPlan(watchNewPlan);
    }
  }, [selectedPlanOption, watchPlan, watchNewPlan, plans]);

  useEffect(() => {
    if (
      selectedPlan &&
      watchPrincipalAmount &&
      parseFloat(watchPrincipalAmount) >= (selectedPlan.minInvestment || 0)
    ) {
      calculateReturns();
    } else {
      setCalculationResult(null);
    }
  }, [selectedPlan, watchPrincipalAmount]);

  const calculateReturns = async () => {
    if (!selectedPlan || !watchPrincipalAmount) return;

    const principalAmount = parseFloat(watchPrincipalAmount);
    if (isNaN(principalAmount) || principalAmount <= 0) return;

    try {
      setCalculating(true);
      let response;

      if (selectedPlanOption === "existing") {
        response = await investmentsService.calculateReturns({
          planId: selectedPlan._id,
          principalAmount: principalAmount,
        });
      } else {
        // For new plans, we'll do a client-side calculation
        const monthlyRate = parseFloat(selectedPlan.interestRate) / 100;
        const tenure = parseInt(selectedPlan.tenure) || 0;

        const totalInterest =
          selectedPlan.interestType === "flat"
            ? principalAmount * monthlyRate * tenure
            : principalAmount * (Math.pow(1 + monthlyRate, tenure) - 1);

        const totalReturns = principalAmount + totalInterest;

        response = {
          data: {
            principalAmount: principalAmount,
            calculations: {
              totalInterest: totalInterest,
              totalReturns: totalReturns,
              effectiveRate:
                principalAmount > 0
                  ? (totalInterest / principalAmount) * 100
                  : 0,
            },
          },
        };
      }

      setCalculationResult(response.data);
    } catch (error) {
      console.warn("Calculation failed:", error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);

      let planToUse;

      if (selectedPlanOption === "new") {
        // Create the plan first
        const planResponse = await plansService.createPlan({
          ...data.newPlan,
          isActive: true,
        });
        planToUse = planResponse.data._id;
      } else {
        planToUse = data.plan;
      }

      await onSubmit({
        plan: planToUse,
        principalAmount: parseFloat(data.principalAmount),
        investmentDate: data.investmentDate,
        notes: data.notes,
        calculationResult,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error.response?.data?.message || "Failed to create investment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Investor Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          Creating Investment For:
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Name:</span>
            <span className="ml-2 font-medium">{investor.name}</span>
          </div>
          <div>
            <span className="text-blue-700">ID:</span>
            <span className="ml-2 font-medium">{investor.investorId}</span>
          </div>
          <div>
            <span className="text-blue-700">Email:</span>
            <span className="ml-2 font-medium">{investor.email}</span>
          </div>
          <div>
            <span className="text-blue-700">Phone:</span>
            <span className="ml-2 font-medium">{investor.phone}</span>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Select Investment Plan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="existing"
              checked={selectedPlanOption === "existing"}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg ${
                selectedPlanOption === "existing"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedPlanOption === "existing"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlanOption === "existing" && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Select Existing Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    Choose from {plans.length} available plans
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="new"
              checked={selectedPlanOption === "new"}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg ${
                selectedPlanOption === "new"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedPlanOption === "new"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlanOption === "new" && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Create New Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    Create a custom plan for this investor
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Existing Plan Selection */}
        {selectedPlanOption === "existing" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Plan *
            </label>
            <select
              {...register("plan", { required: "Please select a plan" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - {plan.interestRate}% {plan.interestType} (
                  {plan.tenure} months)
                </option>
              ))}
            </select>
            {errors.plan && (
              <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>
            )}
          </div>
        )}

        {/* New Plan Creation */}
        {selectedPlanOption === "new" && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900">Plan Configuration</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plan Name *
                </label>
                <input
                  {...register("newPlan.name", {
                    required: "Plan name is required",
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter plan name"
                />
                {errors.newPlan?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interest Rate (% per month) *
                </label>
                <input
                  {...register("newPlan.interestRate", {
                    required: "Interest rate is required",
                    min: {
                      value: 0,
                      message: "Interest rate must be positive",
                    },
                  })}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.5"
                />
                {errors.newPlan?.interestRate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.interestRate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interest Type *
                </label>
                <select
                  {...register("newPlan.interestType")}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flat">Flat Interest</option>
                  <option value="reducing">Reducing Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tenure (months) *
                </label>
                <input
                  {...register("newPlan.tenure", {
                    required: "Tenure is required",
                    min: {
                      value: 1,
                      message: "Tenure must be at least 1 month",
                    },
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
                />
                {errors.newPlan?.tenure && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.tenure.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Risk Level
                </label>
                <select
                  {...register("newPlan.riskLevel")}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Investment (₹) *
                </label>
                <input
                  {...register("newPlan.minInvestment", {
                    required: "Minimum investment is required",
                    min: {
                      value: 1000,
                      message: "Minimum investment must be at least ₹1,000",
                    },
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
                {errors.newPlan?.minInvestment && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.minInvestment.message}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Structure Section */}
            <div className="border-t pt-4">
              <h6 className="text-md font-medium text-gray-900 mb-4">
                Payment Structure
              </h6>

              {/* Payment Type Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        {...register("newPlan.paymentType")}
                        type="radio"
                        value="interest"
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-lg ${
                          watch("newPlan.paymentType") === "interest"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 ${
                              watch("newPlan.paymentType") === "interest"
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {watch("newPlan.paymentType") === "interest" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Interest Payment
                            </div>
                            <div className="text-sm text-gray-500">
                              Regular interest payments with principal at
                              maturity
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        {...register("newPlan.paymentType")}
                        type="radio"
                        value="interestWithPrincipal"
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-lg ${
                          watch("newPlan.paymentType") ===
                          "interestWithPrincipal"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 ${
                              watch("newPlan.paymentType") ===
                              "interestWithPrincipal"
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {watch("newPlan.paymentType") ===
                              "interestWithPrincipal" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Interest + Principal
                            </div>
                            <div className="text-sm text-gray-500">
                              Combined interest and principal payments
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Interest Payment Configuration */}
                {watch("newPlan.paymentType") === "interest" && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h6 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Interest Payment Frequency *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestPayment.interestFrequency",
                            {
                              required:
                                watch("newPlan.paymentType") === "interest"
                                  ? "Interest frequency is required"
                                  : false,
                            }
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select Frequency --</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half-yearly">Half-Yearly</option>
                          <option value="yearly">Yearly</option>
                          <option value="others">Others (Custom)</option>
                        </select>
                        {errors.newPlan?.interestPayment?.interestFrequency && (
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestPayment.interestFrequency
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Principal Repayment Option *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestPayment.principalRepaymentOption"
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fixed">
                            Fixed Tenure - Principal at maturity
                          </option>
                          <option value="flexible">
                            Flexible Withdrawal - Early withdrawal allowed
                          </option>
                        </select>
                      </div>

                      {watch(
                        "newPlan.interestPayment.principalRepaymentOption"
                      ) === "flexible" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Withdrawal After (%)
                            </label>
                            <input
                              {...register(
                                "newPlan.interestPayment.withdrawalAfterPercentage"
                              )}
                              type="number"
                              min="0"
                              max="100"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              % of tenure after which withdrawal is allowed
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Principal Settlement Term (Months)
                            </label>
                            <input
                              {...register(
                                "newPlan.interestPayment.principalSettlementTerm"
                              )}
                              type="number"
                              min="1"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="12"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Maximum months for principal settlement
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Interest with Principal Configuration */}
                {watch("newPlan.paymentType") === "interestWithPrincipal" && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h6 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest + Principal Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Principal Repayment Percentage (%) *
                        </label>
                        <input
                          {...register(
                            "newPlan.interestWithPrincipalPayment.principalRepaymentPercentage",
                            {
                              required:
                                watch("newPlan.paymentType") ===
                                "interestWithPrincipal"
                                  ? "Principal repayment percentage is required"
                                  : false,
                              min: {
                                value: 0,
                                message: "Percentage cannot be negative",
                              },
                              max: {
                                value: 100,
                                message: "Percentage cannot exceed 100%",
                              },
                            }
                          )}
                          type="number"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                        {errors.newPlan?.interestWithPrincipalPayment
                          ?.principalRepaymentPercentage && (
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestWithPrincipalPayment
                                .principalRepaymentPercentage.message
                            }
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          % of principal paid with each payment
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Frequency *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestWithPrincipalPayment.paymentFrequency",
                            {
                              required:
                                watch("newPlan.paymentType") ===
                                "interestWithPrincipal"
                                  ? "Payment frequency is required"
                                  : false,
                            }
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select Frequency --</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half-yearly">Half-Yearly</option>
                          <option value="yearly">Yearly</option>
                          <option value="others">Others (Custom)</option>
                        </select>
                        {errors.newPlan?.interestWithPrincipalPayment
                          ?.paymentFrequency && (
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestWithPrincipalPayment
                                .paymentFrequency.message
                            }
                          </p>
                        )}
                      </div>

                      {watch(
                        "newPlan.interestWithPrincipalPayment.paymentFrequency"
                      ) === "others" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Interest Payout Date
                            </label>
                            <input
                              {...register(
                                "newPlan.interestWithPrincipalPayment.interestPayoutDate"
                              )}
                              type="date"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Principal Payout Date
                            </label>
                            <input
                              {...register(
                                "newPlan.interestWithPrincipalPayment.principalPayoutDate"
                              )}
                              type="date"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("newPlan.description")}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter plan description"
              />
            </div>
          </div>
        )}
      </div>

      {/* Investment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Principal Amount (₹) *
          </label>
          <input
            {...register("principalAmount", {
              required: "Principal amount is required",
              min: { value: 1, message: "Amount must be greater than 0" },
            })}
            type="number"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter investment amount"
          />
          {errors.principalAmount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.principalAmount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Investment Date *
          </label>
          <input
            {...register("investmentDate", {
              required: "Investment date is required",
            })}
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.investmentDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.investmentDate.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any additional notes"
          />
        </div>
      </div>

      {/* Calculation Results */}
      {selectedPlan && watchPrincipalAmount && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-md font-medium text-green-900 mb-3 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Investment Calculation
            {calculating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 ml-2" />
            )}
          </h4>

          {calculationResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Principal Amount</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(calculationResult.principalAmount)}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Interest</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculationResult.calculations.totalInterest)}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Returns</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(calculationResult.calculations.totalReturns)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-green-700">
              {calculating ? (
                <>
                  <Info className="h-4 w-4" />
                  <span>Calculating returns...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Enter valid amount to see calculations</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan Preview */}
      {selectedPlan && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium text-blue-900 mb-3">
            Selected Plan Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Interest Rate:</span>
              <div className="font-medium">
                {selectedPlan.interestRate}% per month
              </div>
            </div>
            <div>
              <span className="text-blue-700">Interest Type:</span>
              <div className="font-medium capitalize">
                {selectedPlan.interestType}
              </div>
            </div>
            <div>
              <span className="text-blue-700">Tenure:</span>
              <div className="font-medium">{selectedPlan.tenure} months</div>
            </div>
            <div>
              <span className="text-blue-700">Payment Type:</span>
              <div className="font-medium">
                {selectedPlan.paymentType === "interest"
                  ? "Interest Only"
                  : "Interest + Principal"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          loading={submitting}
          disabled={!calculationResult || calculating || submitting}
          className="bg-green-600 hover:bg-green-700"
        >
          Create Investment
        </Button>
      </div>
    </div>
  );
};

const CreateRemarksForm = ({
  investmentId,
  investment,
  paymentSchedule,
  onSubmit,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState(commentData);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      remarks: "",
    },
  });
  console.log(paymentSchedule, "paymentSchedule");

  const [activeReply, setActiveReply] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReplyToggle = (index: number) => {
    setActiveReply(index);
    setReplyText("");
  };

  const handleReplySubmit = (e: React.FormEvent, parentIndex: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply = {
      author: "Current User", // dynamically from logged-in user
      text: replyText,
      date: new Date().toISOString(),
    };

    const updated = [...comments];
    updated[parentIndex].replies = [
      ...(updated[parentIndex].replies || []),
      newReply,
    ];
    setComments(updated);
    setActiveReply(null);
    setReplyText("");
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);
      await investmentsService.addRemarks(investmentId, data.remarks);
      toast.success("Remarks added successfully");
      onSubmit();
    } catch (error) {
      console.error("Error adding remarks:", error);
      toast.error(error.response?.data?.message || "Failed to add remarks");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded shadow-sm">
            <p className="text-sm text-white">
              Payment Due Date:{" "}
              {new Date(paymentSchedule?.dueDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) || "N/A"}
            </p>
            <p className="text-sm text-white">
              Amount Due:{" "}
              {formatCurrency(paymentSchedule?.totalAmount) || "N/A"}
            </p>
          </div>
          <div>
            <ul className="space-y-6">
              {comments.map((comment, index) => (
                <li key={index} className="relative group">
                  {/* Main comment */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {comment.author?.[0]}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {comment.author}
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {comment.text}
                      </div>

                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => handleReplyToggle(index)}
                        className="mt-1 text-xs text-blue-500 hover:underline"
                      >
                        Reply
                      </button>

                      {/* Reply form */}
                      {activeReply === index && (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, index)}
                          className="mt-2 space-y-2"
                        >
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Write a reply..."
                          />
                          <div className="flex space-x-2 justify-end">
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:underline"
                              onClick={() => setActiveReply(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="text-xs text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Post
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <ul className="mt-3 space-y-2 pl-6 border-l border-gray-300">
                          {comment.replies.map((reply, rIndex) => (
                            <li
                              key={rIndex}
                              className="flex items-start space-x-3"
                            >
                              <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-semibold">
                                  {reply.author?.[0]}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  {reply.author}
                                  <span className="text-[10px] text-gray-500 ml-1">
                                    {new Date(reply.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-700">
                                  {reply.text}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Remarks *
            </label>
            <textarea
              {...register("remarks", { required: "Remarks are required" })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter remarks"
            />
            {errors.remarks && (
              <p className="mt-1 text-sm text-red-600">
                {errors.remarks.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Remarks
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ComprehensiveInvestmentsView;
