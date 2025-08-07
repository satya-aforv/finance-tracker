// src/pages/investments/InvestmentForm.tsx - Updated for new plan structure
import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Calculator,
  Calendar,
} from "lucide-react";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { investorsService } from "../../services/investors";
import { plansService } from "../../services/plans";
import { investmentsService } from "../../services/investments";
import { Investor, Plan, CalculationResult, Investment } from "../../types";
import toast from "react-hot-toast";

interface InvestmentFormProps {
  investment?: Investment;
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

export const getPaymentFrequency = (plan: Plan) => {
  if (plan.paymentType === "interest" && plan.interestPayment) {
    return plan.interestPayment.interestFrequency;
  } else if (
    plan.paymentType === "interestWithPrincipal" &&
    plan.interestWithPrincipalPayment
  ) {
    return plan.interestWithPrincipalPayment.paymentFrequency;
  }
  return "Not configured";
};

const InvestmentForm: React.FC<InvestmentFormProps> = ({
  investment,
  onSubmit,
  onCancel,
}) => {
  const [investmentData, setInvestmentData] = useState<Investment | null>(
    investment ? investment : null
  );
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null
  );
  const [editForm, setEditForm] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [calculationResult, setCalculationResult] =
    useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState("existing");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      investmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      principalAmount: "",
      plan: "",
      // New plan fields with complete payment structure
      newPlan: {
        name: selectedInvestor
          ? `${selectedInvestor.name.split(" ")[0]} Custom Plan`
          : "",
        description: "",
        interestRate: 2.5,
        interestType: "flat",
        tenure: 12,
        minInvestment: 10000,
        maxInvestment: 1000000,
        paymentType: "interest",
        riskLevel: "medium",
        features: [],
        // Interest Payment Configuration
        interestPayment: {
          dateOfInvestment: new Date().toISOString().split("T")[0],
          amountInvested: 0,
          interestFrequency: "monthly",
          principalRepaymentOption: "fixed",
          withdrawalAfterPercentage: 50,
          principalSettlementTerm: 12,
        },
        // Interest with Principal Payment Configuration
        interestWithPrincipalPayment: {
          dateOfInvestment: new Date().toISOString().split("T")[0],
          investedAmount: 0,
          principalRepaymentPercentage: 10,
          paymentFrequency: "monthly",
          interestPayoutDate: "",
          principalPayoutDate: "",
        },
      },
    },
  });

  const watchPlan = watch("plan");
  const watchPrincipalAmount = watch("principalAmount");
  const watchNewPlan = watch("newPlan");

  useEffect(() => {
    // console.log(investment, "investment");
    setEditForm(investmentData ? true : false);
  }, [investmentData]);

  useEffect(() => {
    if (investmentData) {
      setValue("investor", investmentData.investor._id);
      setValue("plan", investmentData.plan._id);
      setValue("principalAmount", investmentData.principalAmount);
      setValue(
        "investmentDate",
        new Date(investmentData.investmentDate).toISOString().split("T")[0]
      );
      setValue("notes", investmentData.notes || "");
    }
  }, [investmentData, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investorsResponse, plansResponse] = await Promise.all([
          investorsService.getInvestors({ limit: 100 }),
          plansService.getActivePlans(),
        ]);

        setInvestors(investorsResponse.data || []);
        setPlans(plansResponse.data || []);
      } catch (error: any) {
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (watchPlan) {
      const plan = plans.find((p) => p._id === watchPlan);
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
    if (
      selectedPlan &&
      watchPrincipalAmount &&
      watchPrincipalAmount >= selectedPlan.minInvestment
    ) {
      calculateReturns();
    } else {
      setCalculationResult(null);
    }
  }, [selectedPlan, watchPrincipalAmount, watchPlan]);

  const getPaymentTypeLabel = (paymentType: string) => {
    return paymentType === "interest"
      ? "Interest Only"
      : "Interest + Principal";
  };

  const validateAmount = (amount: number) => {
    if (!selectedPlan) return true;
    if (amount < selectedPlan.minInvestment) {
      return `Minimum investment is ${formatCurrency(
        selectedPlan.minInvestment
      )}`;
    }
    if (amount > selectedPlan.maxInvestment) {
      return `Maximum investment is ${formatCurrency(
        selectedPlan.maxInvestment
      )}`;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  //investor, plans, onSubmit, onCancel

  useEffect(() => {
    if (selectedPlanOption === "existing" && watchPlan) {
      const plan = plans.find((p) => p._id === watchPlan);
      setSelectedPlan(plan || null);
    } else if (selectedPlanOption === "new") {
      setSelectedPlan(watchNewPlan);
    }
  }, [selectedPlanOption, watchPlan, watchNewPlan, plans]);

  useEffect(() => {
    if (
      selectedPlan &&
      watchPrincipalAmount &&
      parseFloat(watchPrincipalAmount) >= (selectedPlan.minInvestment || 0)
    ) {
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

      if (selectedPlanOption === "existing") {
        response = await investmentsService.calculateReturns({
          planId: selectedPlan._id,
          principalAmount: principalAmount,
        });
      } else {
        // For new plans, we'll do a client-side calculation
        const monthlyRate = parseFloat(selectedPlan.interestRate) / 100;
        const tenure = parseInt(selectedPlan.tenure) || 0;

        const totalInterest =
          selectedPlan.interestType === "flat"
            ? principalAmount * monthlyRate * tenure
            : principalAmount * (Math.pow(1 + monthlyRate, tenure) - 1);

        const totalReturns = principalAmount + totalInterest;

        response = {
          data: {
            principalAmount: principalAmount,
            calculations: {
              totalInterest: totalInterest,
              totalReturns: totalReturns,
              effectiveRate:
                principalAmount > 0
                  ? (totalInterest / principalAmount) * 100
                  : 0,
            },
          },
        };
      }

      setCalculationResult(response.data);
    } catch (error) {
      console.warn("Calculation failed:", error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);

      let planToUse;

      if (selectedPlanOption === "new") {
        // Create the plan first
        const planResponse = await plansService.createPlan({
          ...data.newPlan,
          isActive: true,
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
        calculationResult,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error.response?.data?.message || "Failed to create investment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Investor Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          Creating Investment For:
        </h4>
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
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Select Investment Plan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="existing"
              checked={selectedPlanOption === "existing"}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg ${
                selectedPlanOption === "existing"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedPlanOption === "existing"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlanOption === "existing" && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Select Existing Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    Choose from {plans.length} available plans
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label className="relative cursor-pointer">
            <input
              type="radio"
              value="new"
              checked={selectedPlanOption === "new"}
              onChange={(e) => setSelectedPlanOption(e.target.value)}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg ${
                selectedPlanOption === "new"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedPlanOption === "new"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlanOption === "new" && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Create New Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    Create a custom plan for this investor
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Existing Plan Selection */}
        {selectedPlanOption === "existing" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Plan *
            </label>
            <select
              {...register("plan", { required: "Please select a plan" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - {plan.interestRate}% {plan.interestType} (
                  {plan.tenure} months)
                </option>
              ))}
            </select>
            {errors.plan && (
              <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>
            )}
          </div>
        )}

        {/* New Plan Creation */}
        {selectedPlanOption === "new" && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900">Plan Configuration</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plan Name *
                </label>
                <input
                  {...register("newPlan.name", {
                    required: "Plan name is required",
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter plan name"
                />
                {errors.newPlan?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interest Rate (% per month) *
                </label>
                <input
                  {...register("newPlan.interestRate", {
                    required: "Interest rate is required",
                    min: {
                      value: 0,
                      message: "Interest rate must be positive",
                    },
                  })}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.5"
                />
                {errors.newPlan?.interestRate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.interestRate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interest Type *
                </label>
                <select
                  {...register("newPlan.interestType")}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flat">Flat Interest</option>
                  <option value="reducing">Reducing Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tenure (months) *
                </label>
                <input
                  {...register("newPlan.tenure", {
                    required: "Tenure is required",
                    min: {
                      value: 1,
                      message: "Tenure must be at least 1 month",
                    },
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
                />
                {errors.newPlan?.tenure && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.tenure.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Risk Level
                </label>
                <select
                  {...register("newPlan.riskLevel")}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Investment (₹) *
                </label>
                <input
                  {...register("newPlan.minInvestment", {
                    required: "Minimum investment is required",
                    min: {
                      value: 1000,
                      message: "Minimum investment must be at least ₹1,000",
                    },
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
                {errors.newPlan?.minInvestment && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPlan.minInvestment.message}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Structure Section */}
            <div className="border-t pt-4">
              <h6 className="text-md font-medium text-gray-900 mb-4">
                Payment Structure
              </h6>

              {/* Payment Type Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        {...register("newPlan.paymentType")}
                        type="radio"
                        value="interest"
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-lg ${
                          watch("newPlan.paymentType") === "interest"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 ${
                              watch("newPlan.paymentType") === "interest"
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {watch("newPlan.paymentType") === "interest" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Interest Payment
                            </div>
                            <div className="text-sm text-gray-500">
                              Regular interest payments with principal at
                              maturity
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        {...register("newPlan.paymentType")}
                        type="radio"
                        value="interestWithPrincipal"
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-lg ${
                          watch("newPlan.paymentType") ===
                          "interestWithPrincipal"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 ${
                              watch("newPlan.paymentType") ===
                              "interestWithPrincipal"
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {watch("newPlan.paymentType") ===
                              "interestWithPrincipal" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Interest + Principal
                            </div>
                            <div className="text-sm text-gray-500">
                              Combined interest and principal payments
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Interest Payment Configuration */}
                {watch("newPlan.paymentType") === "interest" && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h6 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Interest Payment Frequency *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestPayment.interestFrequency",
                            {
                              required:
                                watch("newPlan.paymentType") === "interest"
                                  ? "Interest frequency is required"
                                  : false,
                            }
                          )}
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
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestPayment.interestFrequency
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Principal Repayment Option *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestPayment.principalRepaymentOption"
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fixed">
                            Fixed Tenure - Principal at maturity
                          </option>
                          <option value="flexible">
                            Flexible Withdrawal - Early withdrawal allowed
                          </option>
                        </select>
                      </div>

                      {watch(
                        "newPlan.interestPayment.principalRepaymentOption"
                      ) === "flexible" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Withdrawal After (%)
                            </label>
                            <input
                              {...register(
                                "newPlan.interestPayment.withdrawalAfterPercentage"
                              )}
                              type="number"
                              min="0"
                              max="100"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              % of tenure after which withdrawal is allowed
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Principal Settlement Term (Months)
                            </label>
                            <input
                              {...register(
                                "newPlan.interestPayment.principalSettlementTerm"
                              )}
                              type="number"
                              min="1"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="12"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Maximum months for principal settlement
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Interest with Principal Configuration */}
                {watch("newPlan.paymentType") === "interestWithPrincipal" && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h6 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Interest + Principal Payment Configuration
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Principal Repayment Percentage (%) *
                        </label>
                        <input
                          {...register(
                            "newPlan.interestWithPrincipalPayment.principalRepaymentPercentage",
                            {
                              required:
                                watch("newPlan.paymentType") ===
                                "interestWithPrincipal"
                                  ? "Principal repayment percentage is required"
                                  : false,
                              min: {
                                value: 0,
                                message: "Percentage cannot be negative",
                              },
                              max: {
                                value: 100,
                                message: "Percentage cannot exceed 100%",
                              },
                            }
                          )}
                          type="number"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                        {errors.newPlan?.interestWithPrincipalPayment
                          ?.principalRepaymentPercentage && (
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestWithPrincipalPayment
                                .principalRepaymentPercentage.message
                            }
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          % of principal paid with each payment
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Frequency *
                        </label>
                        <select
                          {...register(
                            "newPlan.interestWithPrincipalPayment.paymentFrequency",
                            {
                              required:
                                watch("newPlan.paymentType") ===
                                "interestWithPrincipal"
                                  ? "Payment frequency is required"
                                  : false,
                            }
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select Frequency --</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half-yearly">Half-Yearly</option>
                          <option value="yearly">Yearly</option>
                          <option value="others">Others (Custom)</option>
                        </select>
                        {errors.newPlan?.interestWithPrincipalPayment
                          ?.paymentFrequency && (
                          <p className="mt-1 text-sm text-red-600">
                            {
                              errors.newPlan.interestWithPrincipalPayment
                                .paymentFrequency.message
                            }
                          </p>
                        )}
                      </div>

                      {watch(
                        "newPlan.interestWithPrincipalPayment.paymentFrequency"
                      ) === "others" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Interest Payout Date
                            </label>
                            <input
                              {...register(
                                "newPlan.interestWithPrincipalPayment.interestPayoutDate"
                              )}
                              type="date"
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Principal Payout Date
                            </label>
                            <input
                              {...register(
                                "newPlan.interestWithPrincipalPayment.principalPayoutDate"
                              )}
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
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("newPlan.description")}
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
          <label className="block text-sm font-medium text-gray-700">
            Principal Amount (₹) *
          </label>
          <input
            {...register("principalAmount", {
              required: "Principal amount is required",
              min: { value: 1, message: "Amount must be greater than 0" },
            })}
            type="number"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter investment amount"
          />
          {errors.principalAmount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.principalAmount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Investment Date *
          </label>
          <input
            {...register("investmentDate", {
              required: "Investment date is required",
            })}
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.investmentDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.investmentDate.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            {...register("notes")}
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
            {calculating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 ml-2" />
            )}
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
          <h4 className="text-md font-medium text-blue-900 mb-3">
            Selected Plan Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Interest Rate:</span>
              <div className="font-medium">
                {selectedPlan.interestRate}% per month
              </div>
            </div>
            <div>
              <span className="text-blue-700">Interest Type:</span>
              <div className="font-medium capitalize">
                {selectedPlan.interestType}
              </div>
            </div>
            <div>
              <span className="text-blue-700">Tenure:</span>
              <div className="font-medium">{selectedPlan.tenure} months</div>
            </div>
            <div>
              <span className="text-blue-700">Payment Type:</span>
              <div className="font-medium">
                {selectedPlan.paymentType === "interest"
                  ? "Interest Only"
                  : "Interest + Principal"}
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

export default InvestmentForm;
