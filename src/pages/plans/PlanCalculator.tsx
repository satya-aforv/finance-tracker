import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, TrendingUp } from 'lucide-react';
import Button from '../../components/common/Button';
import { Plan } from '../../types';
import { plansService } from '../../services/plans';
import toast from 'react-hot-toast';

interface PlanCalculatorProps {
  plan: Plan;
  onClose: () => void;
}

interface CalculatorForm {
  principalAmount: number;
}

interface CalculationResult {
  principalAmount: number;
  plan: {
    name: string;
    interestType: string;
    interestRate: number;
    tenure: number;
  };
  calculations: {
    totalInterest: number;
    totalReturns: number;
    effectiveRate: number;
  };
}

const PlanCalculator: React.FC<PlanCalculatorProps> = ({ plan, onClose }) => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CalculatorForm>();

  const calculateReturns = async (data: CalculatorForm) => {
    try {
      setLoading(true);
      const response = await plansService.calculateReturns(plan._id, data.principalAmount);
      setResult(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate returns');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{plan.name}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Interest Rate:</span>
            <span className="ml-2 font-medium">{plan.interestRate}% per month</span>
          </div>
          <div>
            <span className="text-blue-700">Interest Type:</span>
            <span className="ml-2 font-medium capitalize">{plan.interestType}</span>
          </div>
          <div>
            <span className="text-blue-700">Tenure:</span>
            <span className="ml-2 font-medium">{plan.tenure} months</span>
          </div>
          <div>
            <span className="text-blue-700">Payout:</span>
            <span className="ml-2 font-medium capitalize">{plan.interestPayoutFrequency}</span>
          </div>
        </div>
      </div>

      {/* Calculator Form */}
      <form onSubmit={handleSubmit(calculateReturns)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount (₹)
          </label>
          <input
            {...register('principalAmount', {
              required: 'Investment amount is required',
              min: {
                value: plan.minInvestment,
                message: `Minimum investment is ${formatCurrency(plan.minInvestment)}`
              },
              max: {
                value: plan.maxInvestment,
                message: `Maximum investment is ${formatCurrency(plan.maxInvestment)}`
              }
            })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Enter amount between ${formatCurrency(plan.minInvestment)} - ${formatCurrency(plan.maxInvestment)}`}
          />
          {errors.principalAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Range: {formatCurrency(plan.minInvestment)} - {formatCurrency(plan.maxInvestment)}
          </p>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Returns
        </Button>
      </form>

      {/* Results */}
      {result && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">Calculation Results</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Principal Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(result.principalAmount)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Interest</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(result.calculations.totalInterest)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Returns</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.calculations.totalReturns)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Effective Rate</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercentage(result.calculations.effectiveRate)}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Investment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Monthly Interest:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(result.calculations.totalInterest / result.plan.tenure)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">ROI:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage((result.calculations.totalInterest / result.principalAmount) * 100)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Maturity Period:</span>
                <span className="ml-2 font-medium">{result.plan.tenure} months</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default PlanCalculator;