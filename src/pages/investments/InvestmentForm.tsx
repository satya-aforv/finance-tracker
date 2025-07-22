// src/pages/investments/InvestmentForm.tsx - Updated for new plan structure
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { AlertTriangle, CheckCircle, Info, Calculator, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { investorsService } from '../../services/investors';
import { plansService } from '../../services/plans';
import { investmentsService } from '../../services/investments';
import { Investor, Plan, CalculationResult } from '../../types';
import toast from 'react-hot-toast';

interface InvestmentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  investor: string;
  plan: string;
  principalAmount: number;
  investmentDate: string;
  notes: string;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ onSubmit, onCancel }) => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      investmentDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const watchPlan = useWatch({ control, name: 'plan' });
  const watchPrincipalAmount = useWatch({ control, name: 'principalAmount' });
  const watchInvestor = useWatch({ control, name: 'investor' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investorsResponse, plansResponse] = await Promise.all([
          investorsService.getInvestors({ limit: 100 }),
          plansService.getActivePlans()
        ]);
        
        setInvestors(investorsResponse.data || []);
        setPlans(plansResponse.data || []);
      } catch (error: any) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (watchPlan) {
      const plan = plans.find(p => p._id === watchPlan);
      setSelectedPlan(plan || null);
      // Clear calculation when plan changes
      setCalculationResult(null);
    } else {
      setSelectedPlan(null);
      setCalculationResult(null);
    }
  }, [watchPlan, plans]);

  // Auto-calculate when both plan and amount are selected
  useEffect(() => {
    if (selectedPlan && watchPrincipalAmount && watchPrincipalAmount >= selectedPlan.minInvestment) {
      calculateReturns();
    } else {
      setCalculationResult(null);
    }
  }, [selectedPlan, watchPrincipalAmount]);

  const calculateReturns = async () => {
    if (!selectedPlan || !watchPrincipalAmount) return;

    try {
      setCalculating(true);
      const response = await investmentsService.calculateReturns({
        planId: selectedPlan._id,
        principalAmount: watchPrincipalAmount
      });
      setCalculationResult(response.data);
    } catch (error: any) {
      console.warn('Calculation failed:', error);
      // Don't show error toast for calculation failures as they're not critical
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedInvestor = () => {
    return investors.find(inv => inv._id === watchInvestor);
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    return paymentType === 'interest' ? 'Interest Only' : 'Interest + Principal';
  };

  const getPaymentFrequency = (plan: Plan) => {
    if (plan.paymentType === 'interest' && plan.interestPayment) {
      return plan.interestPayment.interestFrequency;
    } else if (plan.paymentType === 'interestWithPrincipal' && plan.interestWithPrincipalPayment) {
      return plan.interestWithPrincipalPayment.paymentFrequency;
    }
    return 'Not configured';
  };

  const validateAmount = (amount: number) => {
    if (!selectedPlan) return true;
    if (amount < selectedPlan.minInvestment) {
      return `Minimum investment is ${formatCurrency(selectedPlan.minInvestment)}`;
    }
    if (amount > selectedPlan.maxInvestment) {
      return `Maximum investment is ${formatCurrency(selectedPlan.maxInvestment)}`;
    }
    return true;
  };

  const handleFormSubmit = (data: FormData) => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    if (!calculationResult) {
      toast.error('Unable to calculate returns. Please check your inputs.');
      return;
    }

    // Submit with calculation data
    onSubmit({
      ...data,
      calculationResult
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const selectedInvestor = getSelectedInvestor();

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Investment Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Investor *</label>
            <select
              {...register('investor', { required: 'Please select an investor' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Investor</option>
              {investors.map((investor) => (
                <option key={investor._id} value={investor._id}>
                  {investor.name} ({investor.investorId})
                </option>
              ))}
            </select>
            {errors.investor && <p className="mt-1 text-sm text-red-600">{errors.investor.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Investment Plan *</label>
            <select
              {...register('plan', { required: 'Please select a plan' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - {plan.interestRate}% {plan.interestType} ({getPaymentTypeLabel(plan.paymentType)})
                </option>
              ))}
            </select>
            {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Principal Amount (₹) *</label>
            <input
              {...register('principalAmount', {
                required: 'Principal amount is required',
                min: { value: 1, message: 'Amount must be greater than 0' },
                validate: validateAmount
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter investment amount"
            />
            {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>}
            {selectedPlan && (
              <p className="mt-1 text-sm text-gray-500">
                Range: {formatCurrency(selectedPlan.minInvestment)} - {formatCurrency(selectedPlan.maxInvestment)}
              </p>
            )}
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
      </div>

      {/* Selected Investor Details */}
      {selectedInvestor && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium text-blue-900 mb-3">Selected Investor</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Name:</span>
              <div className="font-medium">{selectedInvestor.name}</div>
            </div>
            <div>
              <span className="text-blue-700">Email:</span>
              <div className="font-medium">{selectedInvestor.email}</div>
            </div>
            <div>
              <span className="text-blue-700">Phone:</span>
              <div className="font-medium">{selectedInvestor.phone}</div>
            </div>
            <div>
              <span className="text-blue-700">Active Investments:</span>
              <div className="font-medium">{selectedInvestor.activeInvestments}</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-md font-medium text-green-900 mb-3">Selected Plan Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700">Interest Rate:</span>
              <div className="font-medium">{selectedPlan.interestRate}% per month</div>
            </div>
            <div>
              <span className="text-green-700">Interest Type:</span>
              <div className="font-medium capitalize">{selectedPlan.interestType}</div>
            </div>
            <div>
              <span className="text-green-700">Tenure:</span>
              <div className="font-medium">{selectedPlan.tenure} months</div>
            </div>
            <div>
              <span className="text-green-700">Payment Type:</span>
              <div className="font-medium">{getPaymentTypeLabel(selectedPlan.paymentType)}</div>
            </div>
            <div>
              <span className="text-green-700">Payment Frequency:</span>
              <div className="font-medium capitalize">{getPaymentFrequency(selectedPlan)}</div>
            </div>
            <div>
              <span className="text-green-700">Risk Level:</span>
              <div className="font-medium capitalize">{selectedPlan.riskLevel}</div>
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
                  {formatCurrency(calculationResult.calculations.totalInterest)}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Returns</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculationResult.calculations.totalReturns)}
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
                  <span>Enter a valid amount within the plan range to see calculations</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Maturity Information */}
      {selectedPlan && watch('investmentDate') && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-md font-medium text-yellow-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Investment Timeline
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-yellow-700">Start Date:</span>
              <div className="font-medium">
                {new Date(watch('investmentDate')).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div>
              <span className="text-yellow-700">Maturity Date:</span>
              <div className="font-medium">
                {(() => {
                  const startDate = new Date(watch('investmentDate'));
                  const maturityDate = new Date(startDate);
                  maturityDate.setMonth(maturityDate.getMonth() + selectedPlan.tenure);
                  return maturityDate.toLocaleDateString('en-IN');
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
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Validation Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center">
            {watchInvestor ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="ml-2">Investor Selected</span>
          </div>
          <div className="flex items-center">
            {selectedPlan ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="ml-2">Plan Selected</span>
          </div>
          <div className="flex items-center">
            {watchPrincipalAmount && selectedPlan && 
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

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          disabled={!calculationResult || calculating}
        >
          Create Investment
        </Button>
      </div>
    </form>
  );
};

export default InvestmentForm;