import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Upload,
  Download,
  FilterIcon,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { paymentsService } from "../../services/payments";
import { Payment } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import PaymentForm from "./PaymentForm";
import PaymentsFilter, { PaymentsFilterValues } from "./PaymentsFilter";
import PaymentRecordForm from "./PaymentRecordForm";
import { useLocation } from "react-router-dom";

const PAYMENT_FILTERS_STORAGE_KEY = "paymentFilters";

const PaymentsPage: React.FC = () => {
  const getInitialPaymentFilters = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PAYMENT_FILTERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return {
      paymentId: "",
      investor: "",
      investmentId: "",
      amountMin: "",
      amountMax: "",
      method: "",
      status: "",
    };
  };

  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFliterOptions, setShowFilterOptions] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState(null);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);

  const [paymentFilters, setPaymentFilters] = useState(
    getInitialPaymentFilters()
  );
  const params_check = useLocation();
  const canManage = user?.role === "admin" || user?.role === "finance_manager";

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      };

      if (paymentFilters.paymentId) params.search = paymentFilters.paymentId;
      if (paymentFilters.investor) params.investor = paymentFilters.investor;
      if (paymentFilters.investmentId)
        params.investmentId = paymentFilters.investmentId;
      if (paymentFilters.amountMin) params.amountMin = paymentFilters.amountMin;
      if (paymentFilters.amountMax) params.amountMax = paymentFilters.amountMax;
      if (paymentFilters.method) params.method = paymentFilters.method;
      if (paymentFilters.status) params.status = paymentFilters.status;

      const response = await paymentsService.getPayments(params);

      setPayments(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch payments");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchTerm, statusFilter, paymentFilters]);

  useEffect(() => {
    if (params_check?.search.includes("create=new")) {
      setShowCreateModal(true);
    }
  }, [params_check]);

  const handleCreatePayment = async (data: any) => {
    try {
      await paymentsService.createPayment(data);
      toast.success("Payment recorded successfully");
      setShowCreateModal(false);
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const handleFilterChange = (filters: PaymentsFilterValues) => {
    setPaymentFilters(filters);
    setCurrentPage(1);
    setShowFilterOptions(false);
  };

  const handleFilterReset = () => {
    const resetFilters: PaymentsFilterValues = {
      paymentId: "",
      investor: "",
      investmentId: "",
      amountMin: "",
      amountMax: "",
      method: "",
      status: "",
    };
    setPaymentFilters(resetFilters);
    setCurrentPage(1);
    setShowFilterOptions(false);
  };

  const handleRecordSubmit = async (data: any) => {
    try {
      // await paymentsService.recordPayment(data);
      toast.success("Payment recorded successfully");
      setShowPaymentSchedule(false);
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          classes[status as keyof typeof classes]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const classes = {
      cash: "bg-green-100 text-green-800",
      cheque: "bg-blue-100 text-blue-800",
      bank_transfer: "bg-purple-100 text-purple-800",
      upi: "bg-orange-100 text-orange-800",
      card: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          classes[method as keyof typeof classes]
        }`}
      >
        {method.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">
            {canManage
              ? "Track and manage all payment transactions"
              : "View your payment history"}
          </p>
        </div>
        <div className="flex space-x-3">
          {canManage && (
            <>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by payment ID, reference number, or investor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="border rounded-lg px-2 flex items-center space-x-2">
              <FilterIcon
                color="gray"
                className="my-2 cursor-pointer"
                onClick={() => setShowFilterOptions(true)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Breakdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments && payments?.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.paymentId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(payment.paymentDate)}
                            </div>
                            <div className="text-xs text-gray-400">
                              Month {payment.scheduleMonth}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.investment.investmentId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Principal:{" "}
                              {formatCurrency(
                                payment.investment.principalAmount
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.investor.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.investor.investorId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Interest: {formatCurrency(payment.interestAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Principal:{" "}
                              {formatCurrency(payment.principalAmount)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getMethodBadge(payment.paymentMethod)}
                            {payment.referenceNumber && (
                              <div className="text-xs text-gray-500">
                                Ref: {payment.referenceNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {payment.receipt && (
                              <button
                                className="text-green-600 hover:text-green-900"
                                title="Download Receipt"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {(payment?.status === "overdue" ||
                              payment?.status === "completed") &&
                              user?.role != "investor" && (
                                <span title="Record Payment">
                                  <CreditCard
                                    onClick={() => {
                                      setPaymentSchedule(payment);
                                      setShowPaymentSchedule(true);
                                      console.log(payment, "payment");
                                    }}
                                    className="h-5 w-5 text-green-600 cursor-pointer ml-2"
                                  />
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="h-[200px]">
                      <td
                        colSpan={6}
                        className="min-h-[300px] px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center"
                      >
                        <p className="text-gray-500">No data found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Create Modal */}
      {canManage && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Record New Payment"
          size="xl"
        >
          <PaymentForm
            onSubmit={handleCreatePayment}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      <Modal
        isOpen={showFliterOptions}
        onClose={() => setShowFilterOptions(false)}
        title={`Add filters`}
        size="xl"
      >
        <PaymentsFilter
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          onCancel={() => setShowFilterOptions(false)}
        />
      </Modal>

      {/* Remarks Creation Modal */}
      <Modal
        isOpen={showPaymentSchedule}
        onClose={() => setShowPaymentSchedule(false)}
        title={`Record payment for ${paymentSchedule?.investment?.investmentId}`}
        size="xl"
      >
        <PaymentRecordForm
          investmentId={paymentSchedule?.investment?.investmentId}
          investment={paymentSchedule?.investment}
          paymentSchedule={paymentSchedule}
          onSubmit={handleRecordSubmit}
          onCancel={() => setShowPaymentSchedule(false)}
        />
      </Modal>
    </div>
  );
};

export default PaymentsPage;
