// src/pages/investors/InvestorsPage.tsx - Updated with Comprehensive View Integration
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Key,
  Mail,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Users,
  TrendingUp,
  FilterIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { investorsService, CreateInvestorData } from "../../services/investors";
import { Investor } from "../../types";
import toast from "react-hot-toast";
import InvestorForm from "./InvestorForm";
import ComprehensiveInvestorView from "./ComprehensiveInvestorView";
import InvestorFilter, { InvestorFilterValues } from "./InvestorFilter";
import { useLocation } from "react-router-dom";

interface UserAccountModalState {
  show: boolean;
  investor: Investor | null;
  type: "create" | "reset" | "view";
}

const InvestorsPage: React.FC = () => {
  // Existing state
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userAccountFilter, setUserAccountFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null
  );
  const [showFliterOptions, setShowFilterOptions] = useState(false);
  const [filterValues, setFilterValues] = useState<InvestorFilterValues>({});
  const [userAccountModal, setUserAccountModal] =
    useState<UserAccountModalState>({
      show: false,
      investor: null,
      type: "create",
    });
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const params_check = useLocation();

  // NEW: State for comprehensive view
  const [currentView, setCurrentView] = useState<"list" | "comprehensive">(
    "list"
  );
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(
    null
  );

  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter as any,
        hasUserAccount:
          userAccountFilter === "with"
            ? true
            : userAccountFilter === "without"
            ? false
            : undefined,
      };

      // Map filterValues to backend params
      if (filterValues.nameOrId) params.search = filterValues.nameOrId;
      if (filterValues.contact) params.contact = filterValues.contact;
      if (filterValues.minInvestment)
        params.investmentMin = filterValues.minInvestment;
      if (filterValues.maxInvestment)
        params.investmentMax = filterValues.maxInvestment;
      if (filterValues.status) params.status = filterValues.status;
      if (filterValues.userAccount === "active") params.hasUserAccount = "true";
      if (filterValues.userAccount === "inactive")
        params.hasUserAccount = "false";

      const response = await investorsService.getInvestors(params);

      setInvestors(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch investors");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    userAccountFilter,
    filterValues.nameOrId,
    filterValues.contact,
    filterValues.minInvestment,
    filterValues.maxInvestment,
    filterValues.status,
    filterValues.userAccount,
  ]);

  useEffect(() => {
    fetchInvestors();
  }, [
    currentPage,
    fetchInvestors,
    searchTerm,
    statusFilter,
    userAccountFilter,
  ]);

  useEffect(() => {
    if (params_check?.search.includes("create=new")) {
      setShowCreateModal(true);
    }
  }, [params_check]);

  // NEW: Handler for comprehensive view
  const handleViewComprehensive = (investorId: string) => {
    setSelectedInvestorId(investorId);
    setCurrentView("comprehensive");
  };

  // NEW: Handler to go back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedInvestorId(null);
    // Refresh the list when coming back
    fetchInvestors();
  };

  const handleCreateInvestor = async (data: CreateInvestorData) => {
    try {
      if (!data.kyc.panCardFile || data.kyc.panCardFile.length === 0) {
        toast.error("PAN Card file is required");
      }

      const response = await investorsService.createInvestor(data);

      if (response.data.userAccountCreated) {
        toast.success(
          `Investor created successfully! ${
            response.data.emailSent ? "Login credentials sent via email." : ""
          }`
        );
      } else {
        toast.success("Investor created successfully");
      }

      setShowCreateModal(false);
      fetchInvestors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create investor");
    }
  };

  const handleEditInvestor = async (data: Partial<Investor>) => {
    if (!selectedInvestor) return;

    try {
      await investorsService.updateInvestor(selectedInvestor._id, data);
      toast.success("Investor updated successfully");
      setShowEditModal(false);
      setSelectedInvestor(null);
      fetchInvestors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update investor");
    }
  };

  const handleDeleteInvestor = async (investor: Investor) => {
    if (
      !confirm(
        `Are you sure you want to delete ${investor.name}? This will also delete their user account if it exists.`
      )
    )
      return;

    try {
      await investorsService.deleteInvestor(investor._id);
      toast.success("Investor deleted successfully");
      fetchInvestors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete investor");
    }
  };

  const handleCreateUserAccount = async (
    investor: Investor,
    password: string,
    sendCredentials: boolean = true
  ) => {
    const loadingKey = `create-${investor._id}`;
    try {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

      await investorsService.createUserAccount(investor._id, {
        password,
        sendCredentials,
        temporaryPassword: true,
      });

      toast.success(
        `User account created for ${investor.name}${
          sendCredentials ? ". Credentials sent via email." : ""
        }`
      );
      setUserAccountModal({ show: false, investor: null, type: "create" });
      fetchInvestors();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create user account"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleFilterChange = (filters: InvestorFilterValues) => {
    console.log("Apply filters:", filters);
    setFilterValues(filters);
    setCurrentPage(1); // Reset to first page on filter
    // setShowFilterOptions(false);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterValues({
      nameOrId: "",
      contact: "",
      minInvestment: "",
      maxInvestment: "",
      userAccount: "",
      status: "",
    });
    setCurrentPage(1);
    setShowFilterOptions(false);
  };

  const handleResetPassword = async (
    investor: Investor,
    newPassword: string,
    sendCredentials: boolean = true
  ) => {
    const loadingKey = `reset-${investor._id}`;
    try {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

      await investorsService.resetPassword(investor._id, {
        newPassword,
        sendCredentials,
      });

      toast.success(
        `Password reset for ${investor.name}${
          sendCredentials ? ". New credentials sent via email." : ""
        }`
      );
      setUserAccountModal({ show: false, investor: null, type: "reset" });
      fetchInvestors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      blocked: "bg-red-100 text-red-800",
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

  const getUserAccountBadge = (investor: Investor) => {
    if (!investor.userId) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          No Account
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active Account
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

  const handleBulkCreateAccounts = async () => {
    const investorsWithoutAccounts = investors.filter((inv) => !inv.userId);

    if (investorsWithoutAccounts.length === 0) {
      toast.info("All investors already have user accounts");
      return;
    }

    if (
      !confirm(
        `Create user accounts for ${investorsWithoutAccounts.length} investors?`
      )
    )
      return;

    try {
      const response = await investorsService.bulkCreateUserAccounts(
        investorsWithoutAccounts.map((inv) => inv._id),
        {
          generateTempPasswords: true,
          sendCredentials: true,
        }
      );

      toast.success(
        `Successfully created ${response.data.summary.successful} user accounts`
      );
      if (response.data.summary.failed > 0) {
        toast.warning(
          `Failed to create ${response.data.summary.failed} accounts`
        );
      }

      fetchInvestors();
    } catch (error: any) {
      toast.error("Failed to bulk create user accounts");
    }
  };

  // NEW: Conditional rendering for comprehensive view
  if (currentView === "comprehensive" && selectedInvestorId) {
    return (
      <ComprehensiveInvestorView
        investorId={selectedInvestorId}
        onBack={handleBackToList}
      />
    );
  }

  // Existing list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
          <p className="text-gray-600">
            Manage investor profiles, KYC information, and user accounts
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleBulkCreateAccounts}>
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Create Accounts
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investor
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                disabled={userAccountModal?.show}
                placeholder="Search by name, email, or investor ID..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={userAccountFilter}
              onChange={(e) => setUserAccountFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All User Accounts</option>
              <option value="with">With Account</option>
              <option value="without">Without Account</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Investors Table */}
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
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Account
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
                  {investors.map((investor) => (
                    <tr key={investor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {investor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {investor.investorId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {investor.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {investor.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(investor.totalInvestment)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {investor.activeInvestments} active investments
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getUserAccountBadge(investor)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(investor.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          {/* NEW: Comprehensive View Button */}
                          <button
                            onClick={() =>
                              handleViewComprehensive(investor._id)
                            }
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="View Comprehensive Details & Add Investments"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* User Account Actions */}
                          {!investor.userId ? (
                            <button
                              onClick={() =>
                                setUserAccountModal({
                                  show: true,
                                  investor,
                                  type: "create",
                                })
                              }
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                              title="Create User Account"
                              disabled={actionLoading[`create-${investor._id}`]}
                            >
                              {actionLoading[`create-${investor._id}`] ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setUserAccountModal({
                                  show: true,
                                  investor,
                                  type: "reset",
                                })
                              }
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="Reset Password"
                              disabled={actionLoading[`reset-${investor._id}`]}
                            >
                              {actionLoading[`reset-${investor._id}`] ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Key className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          {/* Standard Actions */}
                          <button
                            onClick={() => {
                              setSelectedInvestor(investor);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                            title="Edit Investor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvestor(investor)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Delete Investor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
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
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Investor"
        size="xl"
      >
        <InvestorForm
          onSubmit={handleCreateInvestor}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedInvestor(null);
        }}
        title="Edit Investor"
        size="xl"
      >
        {selectedInvestor && (
          <InvestorForm
            investor={selectedInvestor}
            onSubmit={handleEditInvestor}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedInvestor(null);
            }}
          />
        )}
      </Modal>

      {/* User Account Management Modal */}
      <Modal
        isOpen={userAccountModal.show}
        onClose={() =>
          setUserAccountModal({ show: false, investor: null, type: "create" })
        }
        title={
          userAccountModal.type === "create"
            ? `Create User Account - ${userAccountModal.investor?.name}`
            : `Reset Password - ${userAccountModal.investor?.name}`
        }
        size="md"
      >
        {userAccountModal.investor && (
          <UserAccountManagementForm
            investor={userAccountModal.investor}
            type={userAccountModal.type}
            onSubmit={(data) => {
              if (userAccountModal.type === "create") {
                handleCreateUserAccount(
                  userAccountModal.investor!,
                  data.password,
                  data.sendCredentials
                );
              } else {
                handleResetPassword(
                  userAccountModal.investor!,
                  data.password,
                  data.sendCredentials
                );
              }
            }}
            onCancel={() =>
              setUserAccountModal({
                show: false,
                investor: null,
                type: "create",
              })
            }
            loading={
              actionLoading[
                `${userAccountModal.type}-${userAccountModal.investor._id}`
              ]
            }
            generatePassword={generateTempPassword}
          />
        )}
      </Modal>

      <Modal
        isOpen={showFliterOptions}
        onClose={() => setShowFilterOptions(false)}
        title={`Add filters`}
        size="xl"
      >
        <InvestorFilter
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          onCancel={() => setShowFilterOptions(false)}
        />
      </Modal>
    </div>
  );
};

// User Account Management Form Component (unchanged)
interface UserAccountManagementFormProps {
  investor: Investor;
  type: "create" | "reset";
  onSubmit: (data: { password: string; sendCredentials: boolean }) => void;
  onCancel: () => void;
  loading: boolean;
  generatePassword: () => string;
}

const UserAccountManagementForm: React.FC<UserAccountManagementFormProps> = ({
  investor,
  type,
  onSubmit,
  onCancel,
  loading,
  generatePassword,
}) => {
  const [password, setPassword] = useState("");
  const [sendCredentials, setSendCredentials] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    onSubmit({ password, sendCredentials });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {type === "create"
                ? "Creating user account for:"
                : "Resetting password for:"}
            </p>
            <p className="text-sm text-blue-700">
              {investor.name} ({investor.email})
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {type === "create" ? "Initial Password" : "New Password"}
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePassword}
          >
            Generate
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sendCredentials"
          checked={sendCredentials}
          onChange={(e) => setSendCredentials(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        />
        <label htmlFor="sendCredentials" className="text-sm text-gray-700">
          Send login credentials via email
        </label>
      </div>

      {type === "create" && (
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The investor will be assigned the "investor"
            role and can log in to view their portfolio.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {type === "create" ? "Create Account" : "Reset Password"}
        </Button>
      </div>
    </div>
  );
};

export default InvestorsPage;
