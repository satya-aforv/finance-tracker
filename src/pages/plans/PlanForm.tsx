// src/pages/plans/PlanForm.tsx - Updated with new Plan structure
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import { Plan } from '../../types';

interface PlanFormProps {
  plan?: Plan;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  interestRate: number;
  interestType: 'flat' | 'reducing';
  tenure: number;
  minInvestment: number;
  maxInvestment: number;
  isActive: boolean;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
  
  // Payment Type Selection
  paymentType: 'interest' | 'interestWithPrincipal';
  
  // Interest Payment Configuration
  interestPayment?: {
    dateOfInvestment: string;
    amountInvested: number;
    interestFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
    interestStartDate?: string;
    principalRepaymentOption: 'fixed' | 'flexible';
    withdrawalAfterPercentage?: number;
    principalSettlementTerm?: number;
  };
  
  // Interest with Principal Payment Configuration
  interestWithPrincipalPayment?: {
    dateOfInvestment: string;
    investedAmount: number;
    principalRepaymentPercentage: number;
    paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
    interestPayoutDate?: string;
    principalPayoutDate?: string;
  };
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, onSubmit, onCancel }) => {
  const [featuresInput, setFeaturesInput] = useState(
    plan?.features?.join(', ') || ''
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: plan ? {
      name: plan.name,
      description: plan.description || '',
      interestRate: plan.interestRate,
      interestType: plan.interestType,
      tenure: plan.tenure,
      minInvestment: plan.minInvestment,
      maxInvestment: plan.maxInvestment,
      isActive: plan.isActive,
      features: plan.features || [],
      riskLevel: plan.riskLevel,
      paymentType: plan.paymentType,
      interestPayment: plan.interestPayment,
      interestWithPrincipalPayment: plan.interestWithPrincipalPayment
    } : {
      interestType: 'flat',
      isActive: true,
      features: [],
      riskLevel: 'medium',
      paymentType: 'interest',
      interestPayment: {
        dateOfInvestment: new Date().toISOString().split('T')[0],
        amountInvested: 0,
        interestFrequency: 'monthly',
        principalRepaymentOption: 'fixed'
      }
    }
  });

  const watchPaymentType = useWatch({ control, name: 'paymentType' });
  const watchInterestFrequency = useWatch({ control, name: 'interestPayment.interestFrequency' });
  const watchIWPFrequency = useWatch({ control, name: 'interestWithPrincipalPayment.paymentFrequency' });
  const watchPrincipalOption = useWatch({ control, name: 'interestPayment.principalRepaymentOption' });
  const watchTenure = watch('tenure');
  const watchMinInvestment = watch('minInvestment');
  const watchMaxInvestment = watch('maxInvestment');

  const handleFormSubmit = (data: FormData) => {
    // Process features
    const processedData = {
      ...data,
      features: featuresInput.split(',').map(f => f.trim()).filter(f => f)
    };

    // Clean up payment configurations based on payment type
    if (data.paymentType === 'interest') {
      delete processedData.interestWithPrincipalPayment;
    } else {
      delete processedData.interestPayment;
    }

    onSubmit(processedData);
  };

  const getValidationStatus = () => {
    const hasBasicInfo = watch('name') && watch('interestRate') && watch('tenure') && 
                        watch('minInvestment') && watch('maxInvestment');
    
    let hasPaymentConfig = false;
    if (watchPaymentType === 'interest') {
      const interestPayment = watch('interestPayment');
      hasPaymentConfig = !!(interestPayment?.interestFrequency && interestPayment?.principalRepaymentOption);
    } else if (watchPaymentType === 'interestWithPrincipal') {
      const iwpPayment = watch('interestWithPrincipalPayment');
      hasPaymentConfig = !!(iwpPayment?.paymentFrequency && iwpPayment?.principalRepaymentPercentage);
    }

    return {
      basic: hasBasicInfo,
      payment: hasPaymentConfig,
      overall: hasBasicInfo && hasPaymentConfig
    };
  };

  const validation = getValidationStatus();

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Validation Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration Status</h4>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            {validation.basic ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm text-gray-700">Basic Information</span>
          </div>
          <div className="flex items-center space-x-2">
            {validation.payment ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm text-gray-700">Payment Configuration</span>
          </div>
          <div className="flex items-center space-x-2">
            {validation.overall ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm font-medium text-gray-900">Overall Status</span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
            <input
              {...register('name', { required: 'Plan name is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter plan name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter plan description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Rate (% per month) *</label>
            <input
              {...register('interestRate', {
                required: 'Interest rate is required',
                min: { value: 0, message: 'Interest rate must be positive' },
                max: { value: 100, message: 'Interest rate cannot exceed 100%' }
              })}
              type="number"
              step="0.1"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2.5"
            />
            {errors.interestRate && <p className="mt-1 text-sm text-red-600">{errors.interestRate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Type *</label>
            <select
              {...register('interestType', { required: 'Interest type is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flat">Flat Interest</option>
              <option value="reducing">Reducing Balance</option>
            </select>
            {errors.interestType && <p className="mt-1 text-sm text-red-600">{errors.interestType.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tenure (months) *</label>
            <input
              {...register('tenure', {
                required: 'Tenure is required',
                min: { value: 1, message: 'Tenure must be at least 1 month' },
                max: { value: 240, message: 'Tenure cannot exceed 240 months' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12"
            />
            {errors.tenure && <p className="mt-1 text-sm text-red-600">{errors.tenure.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Risk Level</label>
            <select
              {...register('riskLevel')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Plan is Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Investment Range */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Investment (₹) *</label>
            <input
              {...register('minInvestment', {
                required: 'Minimum investment is required',
                min: { value: 1000, message: 'Minimum investment must be at least ₹1,000' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50000"
            />
            {errors.minInvestment && <p className="mt-1 text-sm text-red-600">{errors.minInvestment.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Investment (₹) *</label>
            <input
              {...register('maxInvestment', {
                required: 'Maximum investment is required',
                min: { value: 1000, message: 'Maximum investment must be at least ₹1,000' },
                validate: (value) => {
                  return !watchMinInvestment || value >= watchMinInvestment || 'Maximum must be greater than or equal to minimum';
                }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000000"
            />
            {errors.maxInvestment && <p className="mt-1 text-sm text-red-600">{errors.maxInvestment.message}</p>}
            {watchMaxInvestment < watchMinInvestment && (
              <p className="mt-1 text-sm text-yellow-600">Maximum should be greater than minimum investment</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Type Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Structure</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="relative cursor-pointer">
                <input
                  {...register('paymentType')}
                  type="radio"
                  value="interest"
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg ${watchPaymentType === 'interest' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${watchPaymentType === 'interest' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {watchPaymentType === 'interest' && (
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
                  {...register('paymentType')}
                  type="radio"
                  value="interestWithPrincipal"
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg ${watchPaymentType === 'interestWithPrincipal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${watchPaymentType === 'interestWithPrincipal' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {watchPaymentType === 'interestWithPrincipal' && (
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
        </div>
      </div>

      {/* Interest Payment Configuration */}
      {watchPaymentType === 'interest' && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium text-blue-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Interest Payment Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Investment Template</label>
              <input
                {...register('interestPayment.dateOfInvestment')}
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Default template date (will be overridden per investment)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Template (₹)</label>
              <input
                {...register('interestPayment.amountInvested')}
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
              />
              <p className="mt-1 text-xs text-gray-500">Template amount for calculations</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Interest Payment Frequency *</label>
              <select
                {...register('interestPayment.interestFrequency', { 
                  required: 'Interest frequency is required' 
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
              {errors.interestPayment?.interestFrequency && (
                <p className="mt-1 text-sm text-red-600">{errors.interestPayment.interestFrequency.message}</p>
              )}
            </div>

            {watchInterestFrequency === 'others' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Custom Interest Start Date</label>
                <input
                  {...register('interestPayment.interestStartDate')}
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">When custom frequency applies</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal Repayment Option *</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    {...register('interestPayment.principalRepaymentOption')}
                    type="radio"
                    value="fixed"
                    className="mr-2"
                  />
                  <span className="text-sm">Fixed Tenure – Principal repaid at maturity</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...register('interestPayment.principalRepaymentOption')}
                    type="radio"
                    value="flexible"
                    className="mr-2"
                  />
                  <span className="text-sm">Flexible Withdrawal – Early withdrawal allowed</span>
                </label>
              </div>
            </div>

            {watchPrincipalOption === 'flexible' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Withdrawal Allowed After (%)</label>
                  <input
                    {...register('interestPayment.withdrawalAfterPercentage')}
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
                    {...register('interestPayment.principalSettlementTerm')}
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
      {watchPaymentType === 'interestWithPrincipal' && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h4 className="text-md font-medium text-green-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Interest + Principal Payment Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Investment Template</label>
              <input
                {...register('interestWithPrincipalPayment.dateOfInvestment')}
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Default template date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Invested Amount Template (₹)</label>
              <input
                {...register('interestWithPrincipalPayment.investedAmount')}
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
              />
              <p className="mt-1 text-xs text-gray-500">Template amount for calculations</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Principal Repayment Percentage (%) *</label>
              <input
                {...register('interestWithPrincipalPayment.principalRepaymentPercentage', {
                  required: 'Principal repayment percentage is required',
                  min: { value: 0, message: 'Percentage cannot be negative' },
                  max: { value: 100, message: 'Percentage cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
              {errors.interestWithPrincipalPayment?.principalRepaymentPercentage && (
                <p className="mt-1 text-sm text-red-600">{errors.interestWithPrincipalPayment.principalRepaymentPercentage.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">% of principal paid with each payment</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Frequency *</label>
              <select
                {...register('interestWithPrincipalPayment.paymentFrequency', {
                  required: 'Payment frequency is required'
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
              {errors.interestWithPrincipalPayment?.paymentFrequency && (
                <p className="mt-1 text-sm text-red-600">{errors.interestWithPrincipalPayment.paymentFrequency.message}</p>
              )}
            </div>

            {watchIWPFrequency === 'others' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Payout Date</label>
                  <input
                    {...register('interestWithPrincipalPayment.interestPayoutDate')}
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Principal Payout Date</label>
                  <input
                    {...register('interestWithPrincipalPayment.principalPayoutDate')}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
          <textarea
            value={featuresInput}
            onChange={(e) => setFeaturesInput(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="High Returns, Monthly Payouts, Flexible Terms"
          />
          <p className="mt-1 text-sm text-gray-500">Enter features separated by commas</p>
        </div>
      </div>

      {/* Summary Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Plan Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Payment Type:</span>
            <div className="font-medium">
              {watchPaymentType === 'interest' ? 'Interest Only' : 'Interest + Principal'}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Interest Rate:</span>
            <div className="font-medium">{watch('interestRate') || 0}% per month</div>
          </div>
          <div>
            <span className="text-gray-600">Tenure:</span>
            <div className="font-medium">{watch('tenure') || 0} months</div>
          </div>
          <div>
            <span className="text-gray-600">Risk Level:</span>
            <div className="font-medium capitalize">{watch('riskLevel')}</div>
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
          disabled={!validation.overall}
        >
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};

export default PlanForm;