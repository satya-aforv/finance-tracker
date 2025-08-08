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
  Users2Icon,
  MessageCircleCode,
  MessageCircleOffIcon,
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
import InvestmentPaymentForm from "../investments/InvestmentPaymentForm";
import CreateRemarksForm from "../../components/common/CreateRemarksForm";
import { PaginatedSchedule } from "../../components/common/Paggination";
import { Investment } from "../../types";
import { getPaymentFrequency } from "../investments/InvestmentForm";

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

const ComprehensiveInvestorView = ({ investorId, onBack }) => {
  const { user } = useAuth();
  const [investor, setInvestor] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [investment, setInvestment] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  // const [selectedPlanOption, setSelectedPlanOption] = useState("existing"); // 'existing' or 'new'
  const [expandedId, setExpandedId] = useState(null);
  const [investmentActiveTab, setInvestmentActiveTab] = useState("schedule");
  const [showRemarksForm, setShowRemarksForm] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState(null);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);

  // Check if user can manage (admin/finance_manager)
  const canManage = user?.role === "admin" || user?.role === "finance_manager";

  const toggleExpand = (id) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  // Fetch investor data
  useEffect(() => {
    const fetchInvestorData = async () => {
      try {
        setLoading(true);
        const [investorResponse, investmentsResponse, plansResponse] =
          await Promise.all([
            investorsService.getInvestor(investorId),
            investmentsService.getInvestments({ investor: investorId }),
            plansService.getActivePlans(),
          ]);

        setInvestor(investorResponse.data);
        console.log(investorResponse?.data, "investorResponse");
        console.log(
          investorResponse?.data?.investments,
          "investorResponse?.data?.investments"
        );
        const responseInvestMent = investmentsResponse?.data?.length
          ? investmentsResponse.data // Check if array exists and has length
          : investorResponse?.data?.investments?.length
          ? investorResponse.data.investments
          : [];
        console.log(responseInvestMent, "investmentsResponse");
        setInvestments(responseInvestMent);

        setPlans(plansResponse.data || []);
      } catch (error) {
        console.error("Error fetching investor data:", error);
        toast.error("Failed to load investor data");
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

    if (investment?._id) {
      fetchInvestment(investment?._id);
    }
  }, [investment?._id, showInvestmentForm]);

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
      overdue: "bg-red-100 text-red-800",
      pending: "bg-red-100 text-red-800",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Investor not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button onClick={onBack} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {investor.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Investor ID: {investor.investorId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(investor.status)}
              <Button
                onClick={() => setShowInvestmentForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border w-full">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "investments", label: "Investments", icon: TrendingUp },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "referal", label: "Referal Details", icon: Clock },
              ].map((tab) => {
                if (user?.role === "investor" && tab.id === "referal") {
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

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Investment Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">{investor?.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{investor?.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-green-600">
                          {investor?.phone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Alternate Phone:</span>
                        <span className="font-xs capitalize">
                          {investor?.altPhone || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Present Address:</span>
                        <span className="font-medium text-[14px]">
                          {investor?.address?.present
                            ? [
                                // investor?.address?.present?.street,
                                investor?.address?.present?.city,
                                investor?.address?.present?.state,
                                investor?.address?.present?.pincode,
                                investor?.address?.present?.country,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600">
                          Permanent Address:
                        </span>
                        <span className="font-medium text-[14px]">
                          {investor?.address?.permanent
                            ? [
                                // investor?.address?.permanent?.street,
                                investor?.address?.permanent?.city,
                                investor?.address?.permanent?.state,
                                investor?.address?.permanent?.pincode,
                                investor?.address?.permanent?.country,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Bank Details
                    </h3>
                    <div className="space-y-4 mb-10">
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-medium">
                          {investor.kyc?.bankDetails?.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600">Branch Name:</span>
                        <span className="font-medium text-blue-600">
                          {investor.kyc?.bankDetails?.branchName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600"> IFSC:</span>
                        <span className="font-medium text-blue-600">
                          {investor.kyc?.bankDetails?.ifscCode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600"> Account:</span>
                        <span className="font-medium text-blue-600">
                          ****
                          {investor.kyc?.bankDetails?.accountNumber?.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      KYC Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600">PAN Numbe:</span>
                        <span className="font-medium">
                          {investor.kyc?.panNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100">
                        <span className="text-gray-600">Aadhar Number:</span>
                        <span className="font-medium text-blue-600">
                          {investor.kyc?.aadharNumber
                            ? `****-****-${investor.kyc.aadharNumber.slice(-4)}`
                            : "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nominee Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Nominee Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {investor?.nominee?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {investor?.nominee?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600"> Mobile:</span>
                        <span className="font-medium">
                          {investor?.nominee?.mobile || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600"> Relation:</span>
                        <span className="font-medium">
                          {investor?.nominee?.relation || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600"> KYC Status:</span>
                        <span
                          className={`font-medium ${
                            investor.kyc?.verificationStatus === "pending"
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        >
                          {investor.kyc?.verificationStatus || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Investments Tab */}
            {activeTab === "investments" && (
              <div>
                {/* <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Investment Portfolio
                  </h3>
                  <Button
                    onClick={() => setShowInvestmentForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Investment
                  </Button>
                </div> */}

                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No investments found</p>
                    <Button
                      onClick={() => setShowInvestmentForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create First Investment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment, index) => {
                      const isExpanded =
                        expandedId === investment?.investmentId;
                      return (
                        <motion.div
                          key={investment._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div key={investment.investmentId} className="">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Investment ID
                                </p>
                                <p className="font-semibold text-blue-600">
                                  {investment.investmentId}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {investment.plan?.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Principal Amount
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(investment.principalAmount)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {investment.plan?.interestRate}%{" "}
                                  {investment.plan?.interestType}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Investment Date
                                </p>
                                <p className="font-semibold">
                                  {formatDate(investment.investmentDate)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Maturity:{" "}
                                  {formatDate(investment.maturityDate)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Status
                                  </p>
                                  {getStatusBadge(investment.status)}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toggleExpand(investment.investmentId);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isExpanded ? "Hide Details" : "View Details"}
                                </Button>
                              </div>
                            </div>

                            {/* Animated expand/collapse section */}
                            <div
                              className={`transition-[max-height,opacity,margin] duration-200 overflow-hidden mt-2 ${
                                isExpanded
                                  ? "opacity-100 max-h-[1000px] mb-4"
                                  : "opacity-0 max-h-0 mb-0"
                              }`}
                              style={{
                                visibility: isExpanded ? "visible" : "hidden",
                              }}
                            >
                              <div className="pt-4 border-t text-sm text-gray-700">
                                {/* Tabs */}
                                <div className="bg-white rounded-lg shadow-sm border">
                                  <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex space-x-8 px-6">
                                      {[
                                        {
                                          id: "schedule",
                                          label: "Payment Schedule",
                                          icon: Calendar,
                                        },
                                        {
                                          id: "timeline",
                                          label: "Activity Timeline",
                                          icon: Clock,
                                        },
                                      ].map((tab) => {
                                        if (
                                          user?.role !== "admin" &&
                                          tab.id === "referal"
                                        ) {
                                          return null;
                                        } else {
                                          return (
                                            <button
                                              key={tab.id}
                                              onClick={() =>
                                                setInvestmentActiveTab(tab.id)
                                              }
                                              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                                investmentActiveTab === tab.id
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

                                  <div className="p-6">
                                    {/* Schedule Tab */}
                                    {investments && investments?.length > 0 ? (
                                      investmentActiveTab === "schedule" && (
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
                                              {investment?.schedule?.length}{" "}
                                              total payments ({" "}
                                              {
                                                investment?.schedule?.filter(
                                                  (e) => e.status == "overdue"
                                                ).length
                                              }{" "}
                                              overdue /{" "}
                                              {
                                                investment?.schedule?.filter(
                                                  (e) => e.status == "pending"
                                                ).length
                                              }{" "}
                                              pending /{" "}
                                              {
                                                investment?.schedule?.filter(
                                                  (e) => e.status == "paid"
                                                ).length
                                              }{" "}
                                              paid )
                                            </div>
                                          </div>

                                          {isExpanded &&
                                          investment?.schedule &&
                                          investment?.schedule?.length > 0 ? (
                                            <div className="bg-white rounded-lg border border-gray-200  overflow-x-auto">
                                              <PaginatedSchedule
                                                schedule={
                                                  investment.schedule || []
                                                }
                                                rowsPerPage={6}
                                                tableHead={
                                                  <thead className="bg-gray-50">
                                                    <tr>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Month
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Due Date
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Interest
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Principal
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Amount
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Paid Amount
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Balance
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                      </th>
                                                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Remarks
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                }
                                                renderRow={(payment, idx) => (
                                                  <tr
                                                    key={idx}
                                                    className="hover:bg-gray-50 transition-colors"
                                                  >
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                                                      #{payment.month}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                                                      {formatDate(
                                                        payment.dueDate
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                                                      {formatCurrency(
                                                        payment.interestAmount
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                                                      {formatCurrency(
                                                        payment.principalAmount
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                                                      {formatCurrency(
                                                        payment.totalAmount
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs text-green-600 font-xs">
                                                      {formatCurrency(
                                                        payment.paidAmount
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-xs text-red-600 font-xs">
                                                      {formatCurrency(
                                                        payment.totalAmount -
                                                          payment.paidAmount
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                      {getStatusBadge(
                                                        payment.status
                                                      )}
                                                    </td>
                                                    <td className="px-4 w-20 py-4 justify-space-between whitespace-nowrap">
                                                      <div className="flex items-center space-x-2">
                                                        <span title="Add Remarks">
                                                          <MessageCircleCode
                                                            onClick={() => {
                                                              setPaymentSchedule(
                                                                payment
                                                              );
                                                              setShowRemarksForm(
                                                                true
                                                              );
                                                            }}
                                                            className="h-5 w-5 text-blue-600 cursor-pointer"
                                                          />
                                                        </span>

                                                        {payment?.status ===
                                                          "overdue" && (
                                                          <span title="Record Payment">
                                                            <CreditCard
                                                              onClick={() => {
                                                                setPaymentSchedule(
                                                                  payment
                                                                );
                                                                setShowPaymentSchedule(
                                                                  true
                                                                );
                                                              }}
                                                              className="h-5 w-5 text-green-600 cursor-pointer ml-2"
                                                            />
                                                          </span>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              />
                                            </div>
                                          ) : null}
                                        </motion.div>
                                      )
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={9}
                                          className="h-12 px-6 py-6 text-center"
                                        >
                                          <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                          >
                                            <div className="min-w-full text-center py-4 text-gray-500">
                                              <MessageCircleOffIcon className="mx-auto h-12 w-12 text-gray-400" />
                                              <p className="mt-2 text-lg">
                                                No payment schedule available.
                                              </p>
                                              <p className="text-sm">
                                                Once payments are scheduled,
                                                they will appear here.
                                              </p>
                                            </div>
                                          </motion.div>
                                        </td>
                                      </tr>
                                    )}

                                    {/* Timeline Tab */}
                                    {investments &&
                                    investments?.length > 0 &&
                                    investmentActiveTab === "timeline"
                                      ? investment && (
                                          <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                          >
                                            <InvestmentTimeline
                                              investmentId={investment?._id}
                                              isEditable={canManage}
                                            />
                                          </motion.div>
                                        )
                                      : investmentActiveTab === "timeline" && (
                                          <div className="text-center py-12">
                                            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-500">
                                              No activity timeline available for
                                              this investment
                                            </p>
                                          </div>
                                        )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
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

            {/* Referal Tab */}
            {activeTab === "referal" && canManage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Investment Details */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Referral Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Referrer Name:</span>
                        <span className="font-medium">
                          {investor?.referral?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Referrer Email:</span>
                        <span className="font-medium">
                          {" "}
                          {investor?.referral?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Referrer Mobile:</span>
                        <span className="font-medium text-green-600">
                          {investor?.referral?.mobile || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">
                          Referrer Alt Mobile:
                        </span>
                        <span className="font-medium capitalize">
                          {investor?.referral?.altMobile || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">
                          Relation with referrer:
                        </span>
                        <span className="font-medium">
                          {investor?.referral?.type || "N/A"}
                        </span>
                      </div>
                      {/* <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600">Referal fee:</span>
                        <span className="font-medium">
                          {investor?.referral?.referalFee || "N/A"}
                        </span>
                      </div> */}
                    </div>
                  </div>
                </div>
              </motion.div>
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
        title={`Add Remarks for ${investment?.investmentId}`}
        size="lg"
      >
        <CreateRemarksForm
          investmentId={investment?._id}
          investment={investment}
          paymentSchedule={paymentSchedule}
          onSubmit={handleRemarksSubmit}
          onCancel={() => setShowRemarksForm(false)}
        />
      </Modal>

      {/* Remarks Creation Modal */}
      <Modal
        isOpen={showPaymentSchedule}
        onClose={() => setShowPaymentSchedule(false)}
        title={`Record payment for ${investment?.investmentId}`}
        size="xl"
      >
        <InvestmentPaymentForm
          investmentId={investment._id}
          investment={investment}
          paymentSchedule={paymentSchedule}
          onSubmit={handleRemarksSubmit}
          onCancel={() => {
            setShowPaymentSchedule(false);
          }}
        />
      </Modal>
    </div>
  );
};

// Investment Creation Form Component
const InvestmentCreationForm = ({ investor, plans, onSubmit, onCancel }) => {
  // const [selectedPlanOption, setSelectedPlanOption] = useState("existing");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [planMode, setPlanMode] = useState<"existing" | "new" | "">("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      investmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      principalAmount: "",
      planMode: "",
      plan: "",
      // New plan fields with complete payment structure
      customPlan: {
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
        isActive: false,
        disbursementDate: "",
        // Interest Payment Configuration
        interestPayment: {
          dateOfInvestment: new Date().toISOString().split("T")[0],
          amountInvested: 0,
          interestFrequency: "monthly",
          principalRepaymentOption: "fixed",
          withdrawalAfterPercentage: 50,
          principalSettlementTerm: 12,
          interestStartDate: "",
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
  const watchNewPlan = watch("customPlan");
  const watchInvestmentPlanMode = watch("planMode");

  const getPaymentTypeLabel = (paymentType: string) => {
    return paymentType === "interest"
      ? "Interest Only"
      : "Interest + Principal";
  };

  const watchPaymentType = useWatch({
    control,
    name: "customPlan.paymentType",
  });

  useEffect(() => {
    if (planMode === "existing" && watchPlan) {
      const plan = plans.find((p) => p._id === watchPlan);
      setSelectedPlan(plan || null);
    } else if (planMode === "new") {
      setSelectedPlan(watchNewPlan);
    }
  }, [planMode, watchPlan, watchNewPlan, plans]);

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

      if (planMode === "existing") {
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

      if (planMode === "new") {
        // Create the plan first
        const planResponse = await plansService.createPlan({
          ...data.customPlan,
          planType: "custom",
          isActive: true,
        });
        planToUse = planResponse.data._id;
      } else {
        planToUse = data.plan;
      }

      if (!planToUse) {
        toast.error("Plan is not configured correctly!");
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

      <div className="space-y-6">
        {/* Investment Details & Plan Configuration */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Investing Amount & Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("principalAmount", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Amount >= 0" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
              />
              {errors.principalAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.principalAmount.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Investment Date
              </label>
              <input
                type="date"
                {...register("investmentDate")}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tenure (Months)
                    </label>
                    <input
                      type="number"
                      {...register("investment.tenureMonths", {
                        valueAsNumber: true,
                        min: { value: 0, message: ">=0" },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="12"
                    />
                    {errors.investment?.tenureMonths && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.investment.tenureMonths.message}
                      </p>
                    )}
                  </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Interest Rate (%) Monthly
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("investment.interestRateMonthly", {
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2"
                    />
                  </div> */}
            {/* {watchReferralFeeExpect === true && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Referral % (Monthly)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("investment.referralPercentMonthly", {
                          valueAsNumber: true,
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.20"
                      />
                    </div>
                  )} */}
          </div>

          {/* Plan Mode Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Plan
            </label>
            <select
              {...register("planMode")}
              value={planMode || watchInvestmentPlanMode || ""}
              onChange={(e) => {
                const v = e.target.value as "existing" | "new" | "";
                setPlanMode(v);
                if (v === "existing") {
                  setValue("customPlan", {}); // reset custom plan fields
                } else if (v === "new") {
                  setValue("plan", ""); // reset existing plan id
                }
              }}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500
    focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="existing">Existing</option>
              <option value="new">New Configuration</option>
            </select>
          </div>

          {/* Existing Plan Dropdown */}
          {planMode === "existing" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Plan
              </label>
              <select
                {...register("plan")}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Existing Plan</option>
                {plans &&
                  plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - {p.interestRate}% {p.interestType} (
                      {getPaymentTypeLabel(p.paymentType)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Custom Plan Configuration */}
          {planMode === "new" && (
            <div className="mt-6 space-y-6">
              <h4 className="text-md font-semibold text-gray-800">
                New Plan Configuration
              </h4>

              {/* Plan Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Plan Name *
                  </label>
                  <input
                    {...register("customPlan.name", {
                      required: "Plan name is required",
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter plan name"
                  />
                  {errors.customPlan?.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.name.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register("customPlan.description")}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter plan description"
                  />
                </div>
              </div>

              {/* Shared Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interest Rate (% per month) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("customPlan.interestRate", {
                      required: "Interest rate is required",
                      min: {
                        value: 0,
                        message: "Interest rate must be positive",
                      },
                      max: {
                        value: 100,
                        message: "Interest rate cannot exceed 100%",
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2.5"
                  />
                  {errors.customPlan?.interestRate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.interestRate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interest Type *
                  </label>
                  <select
                    {...register("customPlan.interestType", {
                      required: "Interest type is required",
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="flat">Flat Interest</option>
                    <option value="reducing">Reducing Balance</option>
                  </select>
                  {errors.customPlan?.interestType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.interestType.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tenure (months) *
                  </label>
                  <input
                    type="number"
                    {...register("customPlan.tenure", {
                      required: "Tenure is required",
                      min: {
                        value: 1,
                        message: "Tenure must be at least 1 month",
                      },
                      max: {
                        value: 240,
                        message: "Tenure cannot exceed 240 months",
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12"
                  />
                  {errors.customPlan?.tenure && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.tenure.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Risk Level
                  </label>
                  <select
                    {...register("customPlan.riskLevel")}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Investment (₹) *
                  </label>
                  <input
                    type="number"
                    {...register("customPlan.minInvestment", {
                      required: "Minimum investment is required",
                      min: {
                        value: 1000,
                        message: "Minimum investment must be at least ₹1,000",
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                  />
                  {errors.customPlan?.minInvestment && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.minInvestment.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Investment (₹) *
                  </label>
                  <input
                    type="number"
                    {...register("customPlan.maxInvestment", {
                      required: "Maximum investment is required",
                      min: {
                        value: 1000,
                        message: "Maximum investment must be at least ₹1,000",
                      },
                      validate: (value) => {
                        const min = getValues("customPlan.minInvestment");
                        return (
                          !min ||
                          value >= min ||
                          "Maximum must be greater than or equal to minimum"
                        );
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000000"
                  />
                  {errors.customPlan?.maxInvestment && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customPlan.maxInvestment.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      {...register("customPlan.isActive")}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Plan is Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Structure
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="relative cursor-pointer">
                        <input
                          {...register("customPlan.paymentType")}
                          type="radio"
                          value="interest"
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border-2 rounded-lg ${
                            watchPaymentType === "interest"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                watchPaymentType === "interest"
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {watchPaymentType === "interest" && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Interest Payment
                              </div>
                              <div className="text-xs text-gray-500">
                                Regular interest payments with principal at
                                maturity
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>

                      <label className="relative cursor-pointer">
                        <input
                          {...register("customPlan.paymentType")}
                          type="radio"
                          value="interestWithPrincipal"
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border-2 rounded-lg ${
                            watchPaymentType === "interestWithPrincipal"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                watchPaymentType === "interestWithPrincipal"
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {watchPaymentType === "interestWithPrincipal" && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Interest + Principal
                              </div>
                              <div className="text-xs text-gray-500">
                                Combined interest and principal payments
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Configuration */}
              {watch("customPlan.paymentType") === "interest" && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-4">
                  <h4 className="text-md font-medium text-blue-900 mb-4 flex items-center">
                    Interest Payment Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Interest Payment Frequency *
                      </label>
                      <select
                        {...register(
                          "customPlan.interestPayment.interestFrequency",
                          { required: "Interest frequency is required" }
                        )}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="others">Others (Custom)</option>
                      </select>
                      {errors.customPlan?.interestPayment
                        ?.interestFrequency && (
                        <p className="mt-1 text-sm text-red-600">
                          {
                            errors.customPlan.interestPayment.interestFrequency
                              .message
                          }
                        </p>
                      )}
                    </div>
                    {watch("customPlan.interestPayment.interestFrequency") ===
                    "others" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Custom Interest Start Date
                        </label>
                        <input
                          {...register(
                            "customPlan.interestPayment.interestStartDate"
                          )}
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Disbursement date
                        </label>
                        <input
                          {...register("customPlan.disbursementDate")}
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Principal Repayment Option *
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            {...register(
                              "customPlan.interestPayment.principalRepaymentOption"
                            )}
                            type="radio"
                            value="fixed"
                            className="mr-2"
                          />
                          <span className="text-sm">
                            Fixed Tenure – Principal repaid at maturity
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register(
                              "customPlan.interestPayment.principalRepaymentOption"
                            )}
                            type="radio"
                            value="flexible"
                            className="mr-2"
                          />
                          <span className="text-sm">
                            Flexible Withdrawal – Early withdrawal allowed
                          </span>
                        </label>
                      </div>
                    </div>
                    {watch(
                      "customPlan.interestPayment.principalRepaymentOption"
                    ) === "flexible" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Withdrawal Allowed After (%)
                          </label>
                          <input
                            {...register(
                              "customPlan.interestPayment.withdrawalAfterPercentage"
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
                              "customPlan.interestPayment.principalSettlementTerm"
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

              {watch("customPlan.paymentType") === "interestWithPrincipal" && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-4">
                  <h4 className="text-md font-medium text-green-900 mb-4 flex items-center">
                    Interest + Principal Payment Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Principal Repayment Percentage (%) *
                      </label>
                      <input
                        {...register(
                          "customPlan.interestWithPrincipalPayment.principalRepaymentPercentage",
                          {
                            required:
                              "Principal repayment percentage is required",
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
                      {errors.customPlan?.interestWithPrincipalPayment
                        ?.principalRepaymentPercentage && (
                        <p className="mt-1 text-sm text-red-600">
                          {
                            errors.customPlan.interestWithPrincipalPayment
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
                          "customPlan.interestWithPrincipalPayment.paymentFrequency",
                          {
                            required: "Payment frequency is required",
                          }
                        )}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="others">Others (Custom)</option>
                      </select>
                      {errors.customPlan?.interestWithPrincipalPayment
                        ?.paymentFrequency && (
                        <p className="mt-1 text-sm text-red-600">
                          {
                            errors.customPlan.interestWithPrincipalPayment
                              .paymentFrequency.message
                          }
                        </p>
                      )}
                    </div>
                    {watch(
                      "customPlan.interestWithPrincipalPayment.paymentFrequency"
                    ) === "others" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Interest Payout Date
                          </label>
                          <input
                            {...register(
                              "customPlan.interestWithPrincipalPayment.interestPayoutDate"
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
                              "customPlan.interestWithPrincipalPayment.principalPayoutDate"
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

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Features (comma-separated)
                </label>
                <textarea
                  {...register("customPlan.features")}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="High Returns, Monthly Payouts, Flexible Terms"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter features separated by commas
                </p>
              </div>

              {/* Features */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700">
                  Disbursement date
                </label>
                <input
                  {...register("customPlan.disbursementDate")}
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div> */}

              {/* Plan Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Plan Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Payment Type:</span>
                    <div className="font-medium">
                      {watch("customPlan.paymentType") === "interest"
                        ? "Interest Only"
                        : "Interest + Principal"}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <div className="font-medium">
                      {watch("customPlan.interestRate") || 0}% per month
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tenure:</span>
                    <div className="font-medium">
                      {watch("customPlan.tenure") || 0} months
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Level:</span>
                    <div className="font-medium capitalize">
                      {watch("customPlan.riskLevel")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Plan Details */}
        {selectedPlan && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-md font-medium text-green-900 mb-3">
              Selected Plan Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700">Interest Rate:</span>
                <div className="font-medium">
                  {selectedPlan.interestRate}% per month
                </div>
              </div>
              <div>
                <span className="text-green-700">Interest Type:</span>
                <div className="font-medium capitalize">
                  {selectedPlan.interestType}
                </div>
              </div>
              <div>
                <span className="text-green-700">Tenure:</span>
                <div className="font-medium">{selectedPlan.tenure} months</div>
              </div>
              <div>
                <span className="text-green-700">Payment Type:</span>
                <div className="font-medium">
                  {getPaymentTypeLabel(selectedPlan.paymentType)}
                </div>
              </div>
              <div>
                <span className="text-green-700">Payment Frequency:</span>
                <div className="font-medium capitalize">
                  {getPaymentFrequency(selectedPlan)}
                </div>
              </div>
              <div>
                <span className="text-green-700">Risk Level:</span>
                <div className="font-medium capitalize">
                  {selectedPlan.riskLevel}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculation Results */}
        {selectedPlan && watchPrincipalAmount && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-md font-medium text-purple-900 mb-3 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Investment Calculation
              {calculating && <LoadingSpinner size="sm" className="ml-2" />}
            </h4>

            {calculationResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Principal Amount</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(calculationResult.principalAmount)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Total Interest</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      calculationResult.calculations.totalInterest
                    )}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Total Returns</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      calculationResult.calculations.totalReturns
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-purple-700">
                {calculating ? (
                  <>
                    <Info className="h-4 w-4" />
                    <span>Calculating returns...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Enter a valid amount within the plan range to see
                      calculations
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Maturity Information */}
        {selectedPlan && watch("investmentDate") && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="text-md font-medium text-yellow-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Investment Timeline
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Start Date:</span>
                <div className="font-medium">
                  {new Date(watch("investmentDate")).toLocaleDateString(
                    "en-IN"
                  )}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">Maturity Date:</span>
                <div className="font-medium">
                  {(() => {
                    const startDate = new Date(watch("investmentDate"));
                    const maturityDate = new Date(startDate);
                    maturityDate.setMonth(
                      maturityDate.getMonth() + selectedPlan.tenure
                    );
                    return maturityDate.toLocaleDateString("en-IN");
                  })()}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">Duration:</span>
                <div className="font-medium">{selectedPlan.tenure} months</div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Status */}
        {selectedPlan && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Validation Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              {/* <div className="flex items-center">
                      {watchInvestor ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="ml-2">Investor Selected</span>
                    </div> */}
              <div className="flex items-center">
                {selectedPlan ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="ml-2">Plan Selected</span>
              </div>
              <div className="flex items-center">
                {watchPrincipalAmount &&
                selectedPlan &&
                watchPrincipalAmount >= selectedPlan.minInvestment &&
                watchPrincipalAmount <= selectedPlan.maxInvestment ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="ml-2">Valid Amount</span>
              </div>
              <div className="flex items-center">
                {calculationResult ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="ml-2">Calculations Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          loading={submitting}
          disabled={!calculationResult || calculating || submitting}
          // disabled={submitting}
          className="bg-green-600 hover:bg-green-700"
        >
          Create Investment
        </Button>
      </div>
    </div>
  );
};

// Example usage component
const ExampleUsage = () => {
  const [currentView, setCurrentView] = useState("list");
  const [selectedInvestorId, setSelectedInvestorId] = useState(null);

  if (currentView === "investor" && selectedInvestorId) {
    return (
      <ComprehensiveInvestorView
        investorId={selectedInvestorId}
        onBack={() => {
          setCurrentView("list");
          setSelectedInvestorId(null);
        }}
      />
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Investor Management</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-2">Sample Investors</h3>
          <div className="space-y-2">
            <Button
              onClick={() => {
                setSelectedInvestorId("sample-investor-1");
                setCurrentView("investor");
              }}
              variant="outline"
              className="w-full justify-start"
            >
              View Rajesh Kumar (INV001)
            </Button>
            <Button
              onClick={() => {
                setSelectedInvestorId("sample-investor-2");
                setCurrentView("investor");
              }}
              variant="outline"
              className="w-full justify-start"
            >
              View Priya Sharma (INV002)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveInvestorView;
