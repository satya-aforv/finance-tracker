// src/pages/investments/InvestmentDetails.tsx
import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  User, 
  FileText, 
  Clock, 
  Edit, 
  Save, 
  X,
  Upload,
  Download,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import DocumentManager from '../../components/investments/DocumentManager';
import InvestmentTimeline from '../../components/investments/InvestmentTimeline';
import { Investment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { investmentsService } from '../../services/investments';
import toast from 'react-hot-toast';

interface InvestmentDetailsProps {
  investment: Investment;
  onClose: () => void;
  onUpdate?: (updatedInvestment: Investment) => void;
}

const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({ 
  investment, 
  onClose, 
  onUpdate 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'documents' | 'timeline'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: investment.status,
    notes: investment.notes || ''
  });

  // Check if user can manage (admin/finance_manager)
  const canManage = user?.role === 'admin' || user?.role === 'finance_manager';

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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
      defaulted: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${classes[status as keyof typeof classes]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getProgressPercentage = () => {
    if (investment.totalExpectedReturns === 0) return 0;
    return Math.round((investment.totalPaidAmount / investment.totalExpectedReturns) * 100);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await investmentsService.updateInvestment(investment._id, editData);
      toast.success('Investment updated successfully');
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update investment');
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      status: investment.status,
      notes: investment.notes || ''
    });
    setIsEditing(false);
  };

  return (
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
              <h2 className="text-3xl font-bold">{investment.investmentId}</h2>
              {getStatusBadge(investment.status)}
            </div>
            <p className="text-blue-100 mt-2">
              Investment created on {formatDate(investment.createdAt)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-blue-200">Investor:</span>
                <div className="font-medium">{investment.investor.name}</div>
              </div>
              <div>
                <span className="text-blue-200">Plan:</span>
                <div className="font-medium">{investment.plan.name}</div>
              </div>
              <div>
                <span className="text-blue-200">Progress:</span>
                <div className="font-medium">{getProgressPercentage()}% Complete</div>
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
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'schedule', label: 'Payment Schedule', icon: Calendar },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'timeline', label: 'Activity Timeline', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          {activeTab === 'overview' && (
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
                      <p className="text-sm font-medium text-green-700">Principal</p>
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
                      <p className="text-sm font-medium text-blue-700">Expected Returns</p>
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
                      <p className="text-sm font-medium text-purple-700">Amount Paid</p>
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
                      <p className="text-sm font-medium text-orange-700">Remaining</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">Payment Progress</h3>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
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
                  <span>Started: {formatDate(investment.investmentDate)}</span>
                  <span>Maturity: {formatDate(investment.maturityDate)}</span>
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
                      <span className="font-medium">{formatDate(investment.investmentDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-medium">{formatDate(investment.maturityDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium text-green-600">{investment.interestRate}% per month</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Interest Type:</span>
                      <span className="font-medium capitalize">{investment.interestType}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tenure:</span>
                      <span className="font-medium">{investment.tenure} months</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Status:</span>
                      {isEditing ? (
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value as any})}
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
                      <span className="font-medium">{investment.investor.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Investor ID:</span>
                      <span className="font-medium text-blue-600">{investment.investor.investorId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{investment.investor.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{investment.investor.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Plan Name</p>
                    <p className="font-semibold text-lg">{investment.plan.name}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Plan ID</p>
                    <p className="font-semibold text-lg text-blue-600">{investment.plan.planId}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Interest Type</p>
                    <p className="font-semibold text-lg capitalize">{investment.plan.interestType}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Tenure</p>
                    <p className="font-semibold text-lg">{investment.plan.tenure} months</p>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                {isEditing ? (
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add notes about this investment..."
                  />
                ) : (
                  <div className="text-gray-700">
                    {investment.notes ? (
                      <p className="whitespace-pre-wrap">{investment.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No notes available</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
                <div className="text-sm text-gray-500">
                  {investment.schedule.length} total payments
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
                    {investment.schedule.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                          {formatCurrency(payment.totalAmount - payment.paidAmount)}
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
          {activeTab === 'documents' && (
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
          {activeTab === 'timeline' && (
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
  );
};

export default InvestmentDetails;