// src/pages/investments/InvestmentDetails.tsx
import React, { useState } from "react";
import {
  Calendar,
  IndianRupeeIcon,
  TrendingUp,
  User,
  FileText,
  Clock,
  MessageCircleCode,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/common/Button";
import DocumentManager from "../../components/investments/DocumentManager";
import InvestmentTimeline from "../../components/investments/InvestmentTimeline";
import { Investment } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { investmentsService } from "../../services/investments";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { PaginatedSchedule } from "../../components/common/Paggination";
import CreateRemarksFormPR from "../../components/common/CreateRemarksForPR";

interface InvestmentDetailsProps {
  investment: Investment;
  onClose: () => void;
  onUpdate?: (updatedInvestment: Investment) => void;
}

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

const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({
  investment,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "schedule" | "documents" | "timeline" | "requestPrincipal"
  >("overview");
  const [investmentData, setInvestmentData] = useState(investment);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: investmentData.status,
    notes: investmentData.notes || "",
  });
  const [showRemarksForm, setShowRemarksForm] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState(null);

  const {
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      paymentType: "",
      requestedAmount: 0,
      requestedDisbursementDate: "",
      status: "pending",
      remarks: [],
    },
  });
  const [principalAmountRequestedData, setPrincipalAmountRequestedData] =
    useState({
      paymentType: "",
      requestedAmount: 0,
      requestedDisbursementDate: "",
      status: "pending",
      remarks: [],
    });

  const fetchInvestments = async () => {
    try {
      const response = await investmentsService.getInvestment(
        investmentData._id
      );

      if (!response?.data) {
        toast.error("Error fetching investment details");
        return;
      }

      setInvestmentData(response?.data);
      setPrincipalAmountRequestedData(response);
    } catch (error) {
      console.error("Error fetching investment details:", error);
    }
  };

  // Check if user can manage (admin/finance_manager)
  const canManage = user?.role === "admin" || user?.role === "finance_manager";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRemarksSubmit = async (data) => {
    try {
      await investmentsService.addPRRemarks(
        investmentData?._id,
        data?._id,
        data.remarks
      );
      toast.success("Remarks added successfully");
      setShowRemarksForm(false);

      await fetchInvestments();
    } catch (error) {
      console.error("Error adding remarks:", error);
      toast.error(error.response?.data?.message || "Failed to add remarks");
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
      defaulted: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      overdue: "bg-red-100 text-red-800 border-red-200",
      partial: "bg-orange-100 text-orange-800 border-orange-200",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
          classes[status as keyof typeof classes]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getProgressPercentage = () => {
    if (investmentData.totalExpectedReturns === 0) return 0;
    return Math.round(
      (investmentData.totalPaidAmount / investmentData.totalExpectedReturns) *
        100
    );
  };

  const handleSaveEdit = async () => {
    try {
      const response = await investmentsService.updateInvestment(
        investmentData._id,
        editData
      );
      toast.success("Investment updated successfully");
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update investment"
      );
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      status: investmentData.status,
      notes: investmentData.notes || "",
    });
    setIsEditing(false);
  };

  const handleSubmitPrincipalAmount = async () => {
    const { paymentType, requestedAmount, requestedDisbursementDate, remarks } =
      principalAmountRequestedData;

    if (!paymentType || !requestedAmount || !requestedDisbursementDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        paymentType,
        requestedAmount,
        requestedDisbursementDate,
      };

      // If a remark is provided, include it
      if (remarks?.[0]?.content) {
        payload["content"] = remarks[0].content;
        payload["attachments"] = remarks[0].attachments || [];
      }

      const { data } = await investmentsService.add_principal_request(
        investmentData._id,
        payload
      );
      toast.success("Principal request submitted successfully");
      console.log("Response:", data);
      setPrincipalAmountRequestedData({
        paymentType: "",
        requestedAmount: 0,
        requestedDisbursementDate: "",
        status: "pending",
        remarks: [],
      });
      await fetchInvestments();
    } catch (error: any) {
      console.error("Error:", error);
      alert(error?.response?.data?.message || "Submission failed");
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Edit Functionality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <h2 className="text-3xl font-bold">
                  {investmentData.investmentId}
                </h2>
                {getStatusBadge(investmentData.status)}
              </div>
              <p className="text-blue-100 mt-2">
                Investment created on {formatDate(investmentData.createdAt)}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-blue-200">Investor:</span>
                  <div className="font-medium">
                    {investmentData.investor.name}
                  </div>
                </div>
                <div>
                  <span className="text-blue-200">Plan:</span>
                  <div className="font-medium">{investmentData.plan.name}</div>
                </div>
                <div>
                  <span className="text-blue-200">Progress:</span>
                  <div className="font-medium">
                    {getProgressPercentage()}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="flex items-center space-x-3">
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
          </div> */}
          </div>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "schedule", label: "Payment Schedule", icon: Calendar },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "timeline", label: "Activity Timeline", icon: Clock },
                {
                  id: "requestPrincipal",
                  label: "Principal Request",
                  icon: IndianRupeeIcon,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
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
                        <IndianRupeeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-700">
                          Principal
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(investmentData.principalAmount)}
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
                          {formatCurrency(investmentData.totalExpectedReturns)}
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
                          {formatCurrency(investmentData.totalPaidAmount)}
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
                          {formatCurrency(investmentData.remainingAmount)}
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
                        {getProgressPercentage()}%
                      </span>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>
                      Started: {formatDate(investmentData.investmentDate)}
                    </span>
                    <span>
                      Maturity: {formatDate(investmentData.maturityDate)}
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
                          {formatDate(investmentData.investmentDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Maturity Date:</span>
                        <span className="font-medium">
                          {formatDate(investmentData.maturityDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium text-green-600">
                          {investmentData.interestRate}% per month
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Type:</span>
                        <span className="font-medium capitalize">
                          {investmentData.interestType}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Tenure:</span>
                        <span className="font-medium">
                          {investmentData.tenure} months
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
                          getStatusBadge(investmentData.status)
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
                          {investmentData.investor.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Investor ID:</span>
                        <span className="font-medium text-blue-600">
                          {investmentData.investor.investorId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {investmentData.investor.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {investmentData.investor.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Plan Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Plan Name</p>
                      <p className="font-semibold text-lg">
                        {investmentData.plan.name}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Plan ID</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {investmentData.plan.planId}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Interest Type</p>
                      <p className="font-semibold text-lg capitalize">
                        {investmentData.plan.interestType}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Tenure</p>
                      <p className="font-semibold text-lg">
                        {investmentData.plan.tenure} months
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
                      placeholder="Add notes about this investmentData..."
                    />
                  ) : (
                    <div className="text-gray-700">
                      {investmentData.notes ? (
                        <p className="whitespace-pre-wrap">
                          {investmentData.notes}
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
                    {investmentData.schedule.length} total payments
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {investmentData.schedule.map((payment, index) => (
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
                  investmentId={investmentData._id}
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
                  investmentId={investmentData._id}
                  isEditable={canManage}
                />
              </motion.div>
            )}

            {activeTab === "requestPrincipal" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Principal Request
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-x-auto bg-white rounded-lg border border-gray-200 px-4 py-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment type
                    </label>
                    <select
                      value={principalAmountRequestedData.paymentType}
                      onChange={(e) => {
                        e.preventDefault();
                        if (e.target.value == "partial") {
                          console.log(e.target.value, "e.target.value");
                          setPrincipalAmountRequestedData({
                            ...principalAmountRequestedData,
                            requestedAmount: "",
                          });
                        }
                        setPrincipalAmountRequestedData({
                          ...principalAmountRequestedData,
                          paymentType: e.target.value,
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        select
                      </option>
                      <option value="full">Full</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Requested Amount
                    </label>
                    <input
                      value={
                        principalAmountRequestedData?.paymentType == "full"
                          ? investmentData?.principalAmount
                          : principalAmountRequestedData?.requestedAmount
                      }
                      disabled={
                        principalAmountRequestedData?.paymentType == "full"
                      }
                      onChange={(e) =>
                        setPrincipalAmountRequestedData({
                          ...principalAmountRequestedData,
                          requestedAmount: e.target.value,
                        })
                      }
                      type="number"
                      placeholder="e.g 1000000"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Principal Payout Timeline
                    </label>
                    <input
                      onChange={(e) =>
                        setPrincipalAmountRequestedData({
                          ...principalAmountRequestedData,
                          requestedDisbursementDate: e.target.value,
                        })
                      }
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex pt-7 justify-center min-w-full">
                    <Button
                      type="button"
                      onClick={() => handleSubmitPrincipalAmount()}
                      className="w-[300px] shadow-lg text-white font-medium text-sm px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
                      variant="primary"
                      disabled={
                        !principalAmountRequestedData?.requestedAmount ||
                        principalAmountRequestedData?.requestedAmount == 0 ||
                        !principalAmountRequestedData?.paymentType ||
                        !principalAmountRequestedData?.requestedDisbursementDate
                      }
                    >
                      Submit
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200  overflow-x-auto">
                  <PaginatedSchedule
                    schedule={investmentData?.principalRequest}
                    rowsPerPage={6}
                    tableHead={
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SN
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requested Amount
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payout TImeline
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
                          #{payment.month || idx}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                          {formatDate(payment.requestedDisbursementDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs font-xs text-gray-900">
                          {formatCurrency(payment.requestedAmount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-4 w-20 py-4 justify-space-between whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span title="Add Remarks">
                              <MessageCircleCode
                                onClick={() => {
                                  setPaymentSchedule(payment);
                                  setShowRemarksForm(true);
                                }}
                                className="h-5 w-5 text-blue-600 cursor-pointer"
                              />
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end space-x-3"
        >
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </motion.div>
      </div>

      {/* Remarks Creation Modal */}
      <Modal
        isOpen={showRemarksForm}
        onClose={() => setShowRemarksForm(false)}
        title={`Add Remarks for ${investmentData?.investmentId}`}
        size="xl"
      >
        <CreateRemarksFormPR
          investmentId={investmentData?._id}
          investment={investmentData}
          principalRequest={paymentSchedule}
          onSubmit={() => fetchInvestments()}
          onCancel={() => setShowRemarksForm(false)}
        />
      </Modal>
    </>
  );
};

export default InvestmentDetails;
