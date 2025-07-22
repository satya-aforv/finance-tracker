// src/pages/plans/PlansPage.tsx - Updated with new Plan structure
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calculator, Eye, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { plansService } from '../../services/plans';
import { Plan } from '../../types';
import toast from 'react-hot-toast';
import PlanForm from './PlanForm';
import PlanCalculator from './PlanCalculator';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [interestTypeFilter, setInterestTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await plansService.getPlans({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        paymentType: paymentTypeFilter,
        interestType: interestTypeFilter,
        isActive: activeFilter
      });
      
      setPlans(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentPage, searchTerm, paymentTypeFilter, interestTypeFilter, activeFilter]);

  const handleCreatePlan = async (data: any) => {
    try {
      await plansService.createPlan(data);
      toast.success('Plan created successfully');
      setShowCreateModal(false);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleEditPlan = async (data: any) => {
    if (!selectedPlan) return;
    
    try {
      await plansService.updatePlan(selectedPlan._id, data);
      toast.success('Plan updated successfully');
      setShowEditModal(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!confirm(`Are you sure you want to delete ${plan.name}?`)) return;
    
    try {
      await plansService.deletePlan(plan._id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleCopyPlan = async (plan: Plan) => {
    try {
      await plansService.copyPlan(plan._id, {
        name: `${plan.name} (Copy)`,
        description: `Copy of ${plan.name}`
      });
      toast.success('Plan copied successfully');
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to copy plan');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getPaymentTypeBadge = (paymentType: string) => {
    const classes = {
      interest: 'bg-blue-100 text-blue-800',
      interestWithPrincipal: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      interest: 'Interest Only',
      interestWithPrincipal: 'Interest + Principal'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[paymentType as keyof typeof classes]}`}>
        {labels[paymentType as keyof typeof labels]}
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const classes = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[riskLevel as keyof typeof classes]}`}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
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

  const getPaymentFrequency = (plan: Plan) => {
    if (plan.paymentType === 'interest' && plan.interestPayment) {
      return plan.interestPayment.interestFrequency;
    } else if (plan.paymentType === 'interestWithPrincipal' && plan.interestWithPrincipalPayment) {
      return plan.interestWithPrincipalPayment.paymentFrequency;
    }
    return 'Not configured';
  };

  const getValidationStatus = (plan: Plan) => {
    // Basic validation - check if required configurations are present
    const hasBasicConfig = plan.interestRate && plan.tenure && plan.minInvestment && plan.maxInvestment;
    
    let hasPaymentConfig = false;
    if (plan.paymentType === 'interest' && plan.interestPayment) {
      hasPaymentConfig = !!(plan.interestPayment.interestFrequency && plan.interestPayment.principalRepaymentOption);
    } else if (plan.paymentType === 'interestWithPrincipal' && plan.interestWithPrincipalPayment) {
      hasPaymentConfig = !!(plan.interestWithPrincipalPayment.paymentFrequency && plan.interestWithPrincipalPayment.principalRepaymentPercentage);
    }
    
    return hasBasicConfig && hasPaymentConfig;
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
          <h1 className="text-2xl font-bold text-gray-900">Investment Plans</h1>
          <p className="text-gray-600">Configure and manage investment plans with different payment structures</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
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
                placeholder="Search by plan name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Payment Types</option>
              <option value="interest">Interest Only</option>
              <option value="interestWithPrincipal">Interest + Principal</option>
            </select>
            <select
              value={interestTypeFilter}
              onChange={(e) => setInterestTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Interest Types</option>
              <option value="flat">Flat Interest</option>
              <option value="reducing">Reducing Balance</option>
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Plans Table */}
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
                      Plan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Structure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terms & Investment Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Validation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.planId}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            {plan.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getPaymentTypeBadge(plan.paymentType)}
                          <div className="text-sm text-gray-900">
                            {plan.interestRate}% {plan.interestType}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getPaymentFrequency(plan)} payments
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {plan.tenure} months
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(plan.minInvestment)} - {formatCurrency(plan.maxInvestment)}
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {getRiskBadge(plan.riskLevel)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {plan.totalInvestors} investors
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(plan.totalInvestment)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getStatusBadge(plan.isActive)}
                          <div className="flex items-center space-x-1">
                            {getValidationStatus(plan) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {getValidationStatus(plan) ? 'Valid' : 'Incomplete'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowCalculatorModal(true);
                            }}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Calculate Returns"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCopyPlan(plan)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Copy Plan"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                            title="Edit Plan"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Delete Plan"
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
        title="Create New Plan"
        size="xl"
      >
        <PlanForm
          onSubmit={handleCreatePlan}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlan(null);
        }}
        title="Edit Plan"
        size="xl"
      >
        {selectedPlan && (
          <PlanForm
            plan={selectedPlan}
            onSubmit={handleEditPlan}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPlan(null);
            }}
          />
        )}
      </Modal>

      {/* Calculator Modal */}
      <Modal
        isOpen={showCalculatorModal}
        onClose={() => {
          setShowCalculatorModal(false);
          setSelectedPlan(null);
        }}
        title="Investment Calculator"
        size="lg"
      >
        {selectedPlan && (
          <PlanCalculator
            plan={selectedPlan}
            onClose={() => {
              setShowCalculatorModal(false);
              setSelectedPlan(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default PlansPage;