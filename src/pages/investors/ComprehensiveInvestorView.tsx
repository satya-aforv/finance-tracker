import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { investorsService } from '../../services/investors';
import { plansService } from '../../services/plans';
import { investmentsService } from '../../services/investments';
import toast from 'react-hot-toast';

const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, onClick, className = '', type = 'button' }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
      {children}
    </button>
  );
};

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`} />
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
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
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ComprehensiveInvestorView = ({ investorId, onBack }) => {
  const [investor, setInvestor] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlanOption, setSelectedPlanOption] = useState('existing'); // 'existing' or 'new'

  // Fetch investor data
  useEffect(() => {
    const fetchInvestorData = async () => {
      try {
        setLoading(true);
        const [investorResponse, investmentsResponse, plansResponse] = await Promise.all([
          investorsService.getInvestor(investorId),
          investmentsService.getInvestments({ investor: investorId }),
          plansService.getActivePlans()
        ]);

        setInvestor(investorResponse.data);
        setInvestments(investmentsResponse.data || []);
        setPlans(plansResponse.data || []);
      } catch (error) {
        console.error('Error fetching investor data:', error);
        toast.error('Failed to load investor data');
      } finally {
        setLoading(false);
      }
    };

    if (investorId) {
      fetchInvestorData();
    }
  }, [investorId]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
      defaulted: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[status] || classes.active}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const handleCreateInvestment = async (data) => {
    try {
      await investmentsService.createInvestment({
        ...data,
        investor: investorId
      });
      
      toast.success('Investment created successfully');
      setShowInvestmentForm(false);
      
      // Refresh data
      const [investorResponse, investmentsResponse] = await Promise.all([
        investorsService.getInvestor(investorId),
        investmentsService.getInvestments({ investor: investorId })
      ]);
      
      setInvestor(investorResponse.data);
      setInvestments(investmentsResponse.data || []);
    } catch (error) {
      console.error('Error creating investment:', error);
      toast.error(error.response?.data?.message || 'Failed to create investment');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button onClick={onBack} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
                <p className="text-sm text-gray-500">Investor ID: {investor.investorId}</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
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
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
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
                <p className="text-sm font-medium text-gray-600">Active Investments</p>
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
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(investor.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'investments', label: 'Investments', icon: TrendingUp },
                { id: 'documents', label: 'Documents', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">{investor.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{investor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{investor.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">
                          {[
                            investor.address?.street,
                            investor.address?.city,
                            investor.address?.state,
                            investor.address?.pincode,
                            investor.address?.country
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KYC Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">PAN Number</p>
                        <p className="font-medium">{investor.kyc?.panNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Aadhar Number</p>
                        <p className="font-medium">
                          {investor.kyc?.aadharNumber ? 
                            `****-****-${investor.kyc.aadharNumber.slice(-4)}` : 
                            'Not provided'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Bank Details</p>
                        <div className="space-y-1">
                          <p className="font-medium">{investor.kyc?.bankDetails?.bankName}</p>
                          <p className="text-sm text-gray-600">{investor.kyc?.bankDetails?.branchName}</p>
                          <p className="text-sm">IFSC: {investor.kyc?.bankDetails?.ifscCode}</p>
                          <p className="text-sm">
                            Account: ****{investor.kyc?.bankDetails?.accountNumber?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">KYC Status</p>
                        <p className="font-medium text-green-600">
                          {investor.kyc?.verificationStatus || 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Investments Tab */}
            {activeTab === 'investments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Investment Portfolio</h3>
                  <Button 
                    onClick={() => setShowInvestmentForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Investment
                  </Button>
                </div>

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
                    {investments.map((investment, index) => (
                      <motion.div
                        key={investment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Investment ID</p>
                            <p className="font-semibold text-blue-600">{investment.investmentId}</p>
                            <p className="text-sm text-gray-500">{investment.plan?.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Principal Amount</p>
                            <p className="font-semibold">{formatCurrency(investment.principalAmount)}</p>
                            <p className="text-sm text-gray-500">
                              {investment.plan?.interestRate}% {investment.plan?.interestType}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Investment Date</p>
                            <p className="font-semibold">{formatDate(investment.investmentDate)}</p>
                            <p className="text-sm text-gray-500">
                              Maturity: {formatDate(investment.maturityDate)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              {getStatusBadge(investment.status)}
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents</h3>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Document management coming soon</p>
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
    </div>
  );
};

// Investment Creation Form Component
const InvestmentCreationForm = ({ investor, plans, onSubmit, onCancel }) => {
  const [selectedPlanOption, setSelectedPlanOption] = useState('existing');
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
    formState: { errors }
  } = useForm({
    defaultValues: {
      investmentDate: new Date().toISOString().split('T')[0],
      notes: '',
      principalAmount: '',
      plan: '',
      // New plan fields with complete payment structure
      newPlan: {
        name: `${investor.name.split(' ')[0]} Custom Plan`,
        description: '',
        interestRate: 2.5,
        interestType: 'flat',
        tenure: 12,
        minInvestment: 10000,
        maxInvestment: 1000000,
        paymentType: 'interest',
        riskLevel: 'medium',
        features: [],
        // Interest Payment Configuration
        interestPayment: {
          dateOfInvestment: new Date().toISOString().split('T')[0],
          amountInvested: 0,
          interestFrequency: 'monthly',
          principalRepaymentOption: 'fixed',
          withdrawalAfterPercentage: 50,
          principalSettlementTerm: 12
        },
        // Interest with Principal Payment Configuration
        interestWithPrincipalPayment: {
          dateOfInvestment: new Date().toISOString().split('T')[0],
          investedAmount: 0,
          principalRepaymentPercentage: 10,
          paymentFrequency: 'monthly',
          interestPayoutDate: '',
          principalPayoutDate: ''
        }
      }
    }
  });

  const watchPlan = watch('plan');
  const watchPrincipalAmount = watch('principalAmount');
  const watchNewPlan = watch('newPlan');

  useEffect(() => {
    if (selectedPlanOption === 'existing' && watchPlan) {
      const plan = plans.find(p => p._id === watchPlan);
      setSelectedPlan(plan || null);
    } else if (selectedPlanOption === 'new') {
      setSelectedPlan(watchNewPlan);
    }
  }, [selectedPlanOption, watchPlan, watchNewPlan, plans]);

  useEffect(() => {
    if (selectedPlan && watchPrincipalAmount && parseFloat(watchPrincipalAmount) >= (selectedPlan.minInvestment || 0)) {
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
      
      if (selectedPlanOption === 'existing') {
        response = await investmentsService.calculateReturns({
          planId: selectedPlan._id,
          principalAmount: principalAmount
        });
      } else {
        // For new plans, we'll do a client-side calculation
        const monthlyRate = parseFloat(selectedPlan.interestRate) / 100;
        const tenure = parseInt(selectedPlan.tenure) || 0;
        
        const totalInterest = selectedPlan.interestType === 'flat' 
          ? principalAmount * monthlyRate * tenure
          : principalAmount * (Math.pow(1 + monthlyRate, tenure) - 1);
        
        const totalReturns = principalAmount + totalInterest;
        
        response = {
          data: {
            principalAmount: principalAmount,
            calculations: {
              totalInterest: totalInterest,
              totalReturns: totalReturns,
              effectiveRate: principalAmount > 0 ? (totalInterest / principalAmount) * 100 : 0
            }
          }
        };
      }
      
      setCalculationResult(response.data);
    } catch (error) {
      console.warn('Calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      let planToUse;
      
      if (selectedPlanOption === 'new') {
        // Create the plan first
        const planResponse = await plansService.createPlan({
          ...data.newPlan,
          isActive: true
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
        calculationResult
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Failed to create investment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Investor Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Creating Investment For:</h4>
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
        <h4 className="text-md font-medium text-gray-900 mb-4">Select Investment Plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="existing"
              checked={selectedPlanOption === 'existing'}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div className={`p-4 border-2 rounded-lg ${selectedPlanOption === 'existing' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${selectedPlanOption === 'existing' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {selectedPlanOption === 'existing' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Select Existing Plan</div>
                  <div className="text-sm text-gray-500">Choose from {plans.length} available plans</div>
                </div>
              </div>
            </div>
          </label>

          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="new"
              checked={selectedPlanOption === 'new'}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div className={`p-4 border-2 rounded-lg ${selectedPlanOption === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${selectedPlanOption === 'new' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {selectedPlanOption === 'new' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Create New Plan</div>
                  <div className="text-sm text-gray-500">Create a custom plan for this investor</div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Existing Plan Selection */}
        {selectedPlanOption === 'existing' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Plan *
            </label>
            <select
              {...register('plan', { required: 'Please select a plan' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - {plan.interestRate}% {plan.interestType} ({plan.tenure} months)
                </option>
              ))}
            </select>
            {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
          </div>
        )}

        {/* New Plan Creation */}
        {selectedPlanOption === 'new' && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900">Plan Configuration</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
                <input
                  {...register('newPlan.name', { required: 'Plan name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter plan name"
                />
                {errors.newPlan?.name && <p className="mt-1 text-sm text-red-600">{errors.newPlan.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Rate (% per month) *</label>
                <input
                  {...register('newPlan.interestRate', {
                    required: 'Interest rate is required',
                    min: { value: 0, message: 'Interest rate must be positive' }
                  })}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.5"
                />
                {errors.newPlan?.interestRate && <p className="mt-1 text-sm text-red-600">{errors.newPlan.interestRate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Type *</label>
                <select
                  {...register('newPlan.interestType')}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flat">Flat Interest</option>
                  <option value="reducing">Reducing Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tenure (months) *</label>
                <input
                  {...register('newPlan.tenure', {
                    required: 'Tenure is required',
                    min: { value: 1, message: 'Tenure must be at least 1 month' }
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
                />
                {errors.newPlan?.tenure && <p className="mt-1 text-sm text-red-600">{errors.newPlan.tenure.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                <select
                  {...register('newPlan.riskLevel')}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Minimum Investment (₹) *</label>
                <input
                  {...register('newPlan.minInvestment', {
                    required: 'Minimum investment is required',
                    min: { value: 1000, message: 'Minimum investment must be at least ₹1,000' }
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
                {errors.newPlan?.minInvestment && <p className="mt-1 text-sm text-red-600">{errors.newPlan.minInvestment.message}</p>}
              </div>
            </div>

            {/* Payment Structure Section */}
            <div className="border-t pt-4">
              <h6 className="text-md font-medium text-gray-900 mb-4">Payment Structure</h6>
              
              {/* Payment Type Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        {...register('newPlan.paymentType')}
                        type="radio"
                        value="interest"
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg ${watch('newPlan.paymentType') === 'interest' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${watch('newPlan.paymentType') === 'interest' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                            {watch('newPlan.paymentType') === 'interest' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Interest Payment</div>
                            <div className="text-sm text-gray-500">Regular interest payments with principal at maturity</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        {...register('newPlan.paymentType')}
                        type="radio"
                        value="interestWithPrincipal"
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg ${watch('newPlan.paymentType') === 'interestWithPrincipal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${watch('newPlan.paymentType') === 'interestWithPrincipal' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                            {watch('newPlan.paymentType') === 'interestWithPrincipal' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Interest + Principal</div>
                            <div className="text-sm text-gray-500">Combined interest and principal payments</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Interest Payment Configuration */}
                {watch('newPlan.paymentType') === 'interest' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h6 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Interest Payment Frequency *</label>
                        <select
                          {...register('newPlan.interestPayment.interestFrequency', { 
                            required: watch('newPlan.paymentType') === 'interest' ? 'Interest frequency is required' : false
                          })}
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
                          <p className="mt-1 text-sm text-red-600">{errors.newPlan.interestPayment.interestFrequency.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Principal Repayment Option *</label>
                        <select
                          {...register('newPlan.interestPayment.principalRepaymentOption')}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fixed">Fixed Tenure - Principal at maturity</option>
                          <option value="flexible">Flexible Withdrawal - Early withdrawal allowed</option>
                        </select>
                      </div>

                      {watch('newPlan.interestPayment.principalRepaymentOption') === 'flexible' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Withdrawal After (%)</label>
                            <input
                              {...register('newPlan.interestPayment.withdrawalAfterPercentage')}
                              type="number"
                              min="0"
                              max="100"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50"
                            />
                            <p className="mt-1 text-xs text-gray-500">% of tenure after which withdrawal is allowed</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Principal Settlement Term (Months)</label>
                            <input
                              {...register('newPlan.interestPayment.principalSettlementTerm')}
                              type="number"
                              min="1"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="12"
                            />
                            <p className="mt-1 text-xs text-gray-500">Maximum months for principal settlement</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Interest with Principal Configuration */}
                {watch('newPlan.paymentType') === 'interestWithPrincipal' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h6 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest + Principal Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Principal Repayment Percentage (%) *</label>
                        <input
                          {...register('newPlan.interestWithPrincipalPayment.principalRepaymentPercentage', {
                            required: watch('newPlan.paymentType') === 'interestWithPrincipal' ? 'Principal repayment percentage is required' : false,
                            min: { value: 0, message: 'Percentage cannot be negative' },
                            max: { value: 100, message: 'Percentage cannot exceed 100%' }
                          })}
                          type="number"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                        {errors.newPlan?.interestWithPrincipalPayment?.principalRepaymentPercentage && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPlan.interestWithPrincipalPayment.principalRepaymentPercentage.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">% of principal paid with each payment</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Frequency *</label>
                        <select
                          {...register('newPlan.interestWithPrincipalPayment.paymentFrequency', {
                            required: watch('newPlan.paymentType') === 'interestWithPrincipal' ? 'Payment frequency is required' : false
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select Frequency --</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half-yearly">Half-Yearly</option>
                          <option value="yearly">Yearly</option>
                          <option value="others">Others (Custom)</option>
                        </select>
                        {errors.newPlan?.interestWithPrincipalPayment?.paymentFrequency && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPlan.interestWithPrincipalPayment.paymentFrequency.message}</p>
                        )}
                      </div>

                      {watch('newPlan.interestWithPrincipalPayment.paymentFrequency') === 'others' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Interest Payout Date</label>
                            <input
                              {...register('newPlan.interestWithPrincipalPayment.interestPayoutDate')}
                              type="date"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Principal Payout Date</label>
                            <input
                              {...register('newPlan.interestWithPrincipalPayment.principalPayoutDate')}
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
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('newPlan.description')}
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
          <label className="block text-sm font-medium text-gray-700">Principal Amount (₹) *</label>
          <input
            {...register('principalAmount', {
              required: 'Principal amount is required',
              min: { value: 1, message: 'Amount must be greater than 0' }
            })}
            type="number"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter investment amount"
          />
          {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Investment Date *</label>
          <input
            {...register('investmentDate', { required: 'Investment date is required' })}
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.investmentDate && <p className="mt-1 text-sm text-red-600">{errors.investmentDate.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            {...register('notes')}
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
            {calculating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 ml-2" />}
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
          <h4 className="text-md font-medium text-blue-900 mb-3">Selected Plan Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Interest Rate:</span>
              <div className="font-medium">{selectedPlan.interestRate}% per month</div>
            </div>
            <div>
              <span className="text-blue-700">Interest Type:</span>
              <div className="font-medium capitalize">{selectedPlan.interestType}</div>
            </div>
            <div>
              <span className="text-blue-700">Tenure:</span>
              <div className="font-medium">{selectedPlan.tenure} months</div>
            </div>
            <div>
              <span className="text-blue-700">Payment Type:</span>
              <div className="font-medium">
                {selectedPlan.paymentType === 'interest' ? 'Interest Only' : 'Interest + Principal'}
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

// Example usage component
const ExampleUsage = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedInvestorId, setSelectedInvestorId] = useState(null);

  if (currentView === 'investor' && selectedInvestorId) {
    return (
      <ComprehensiveInvestorView
        investorId={selectedInvestorId}
        onBack={() => {
          setCurrentView('list');
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
                setSelectedInvestorId('sample-investor-1');
                setCurrentView('investor');
              }}
              variant="outline"
              className="w-full justify-start"
            >
              View Rajesh Kumar (INV001)
            </Button>
            <Button
              onClick={() => {
                setSelectedInvestorId('sample-investor-2');
                setCurrentView('investor');
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