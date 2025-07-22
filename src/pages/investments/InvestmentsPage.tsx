// src/pages/investments/InvestmentsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Calendar, TrendingUp, FileText, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { investmentsService } from '../../services/investments';
import { Investment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import InvestmentForm from './InvestmentForm';
import InvestmentDetails from './InvestmentDetails';

const InvestmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'finance_manager';

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await investmentsService.getInvestments({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      
      setInvestments(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [currentPage, searchTerm, statusFilter]);

  const handleCreateInvestment = async (data: any) => {
    try {
      await investmentsService.createInvestment(data);
      toast.success('Investment created successfully');
      setShowCreateModal(false);
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create investment');
    }
  };

  const handleViewDetails = async (investment: Investment) => {
    try {
      const response = await investmentsService.getInvestment(investment._id);
      setSelectedInvestment(response.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch investment details');
    }
  };

  const handleUpdateInvestment = (updatedInvestment: Investment) => {
    setSelectedInvestment(updatedInvestment);
    // Update the investment in the list
    setInvestments(prev => 
      prev.map(inv => inv._id === updatedInvestment._id ? updatedInvestment : inv)
    );
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
      defaulted: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${classes[status as keyof typeof classes]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (investment: Investment) => {
    if (investment.totalExpectedReturns === 0) return 0;
    return Math.round((investment.totalPaidAmount / investment.totalExpectedReturns) * 100);
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-600 mt-1">
            {canManage ? 'Manage all investments and track performance' : 'View your investment portfolio'}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Total: {investments.length}</span>
            <span>•</span>
            <span>Active: {investments.filter(i => i.status === 'active').length}</span>
            <span>•</span>
            <span>Completed: {investments.filter(i => i.status === 'completed').length}</span>
          </div>
        </div>
        {canManage && (
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Investment
            </Button>
          </div>
        )}
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by investment ID, investor name, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Investments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investment Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor & Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financial Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress & Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {investments.map((investment) => {
                    const progress = getProgressPercentage(investment);
                    const daysToMaturity = getDaysToMaturity(investment.maturityDate);
                    
                    return (
                      <tr key={investment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-blue-600">
                              {investment.investmentId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created: {formatDate(investment.investmentDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Maturity: {formatDate(investment.maturityDate)}
                              {daysToMaturity > 0 && (
                                <span className="ml-1 text-orange-600">
                                  ({daysToMaturity} days left)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {investment.investor.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {investment.investor.investorId}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              {investment.plan.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {investment.plan.interestRate}% {investment.plan.interestType}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(investment.principalAmount)}
                            </div>
                            <div className="text-xs text-green-600">
                              Expected: {formatCurrency(investment.totalExpectedReturns)}
                            </div>
                            <div className="text-xs text-blue-600">
                              Paid: {formatCurrency(investment.totalPaidAmount)}
                            </div>
                            <div className="text-xs text-orange-600">
                              Remaining: {formatCurrency(investment.remainingAmount)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">{progress}%</span>
                              <span className="text-xs text-gray-500">{investment.tenure}m</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {investment.schedule.filter(s => s.status === 'paid').length} of {investment.schedule.length} payments
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {getStatusBadge(investment.status)}
                            {investment.schedule.some(s => s.status === 'overdue') && (
                              <div className="text-xs text-red-600 font-medium">
                                Overdue payments
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(investment)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(investment)}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Schedule"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(investment)}
                              className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Documents"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(investment)}
                              className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                              title="View Timeline"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage} of {totalPages}
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

      {/* Create Investment Modal */}
      {canManage && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Investment"
          size="xl"
        >
          <InvestmentForm
            onSubmit={handleCreateInvestment}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Investment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedInvestment(null);
        }}
        title="Investment Details"
        size="xl"
      >
        {selectedInvestment && (
          <InvestmentDetails
            investment={selectedInvestment}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedInvestment(null);
            }}
            onUpdate={handleUpdateInvestment}
          />
        )}
      </Modal>
    </div>
  );
};

export default InvestmentsPage;