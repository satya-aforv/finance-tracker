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
  const [selectedPlanOption, setSelectedPlanOption] = useState("existing");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [investmentData, setInvestmentData] = useState<Investment | null>(null);
  const [editForm, setEditForm] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<
    Investor | null | unknown
  >(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      investor: "",
      investmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      principalAmount: "",
      plan: "",
      planMode: "",
      // New plan fields with complete payment structure
      newPlan: {
        name: ``,
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
  const watchInvestor = watch("investor");
  const watchInvestmentPlanMode = watch("planMode");
  const watchPaymentType = useWatch({
    control,
    name: "newPlan.paymentType",
  });

  useEffect(() => {
    // console.log(investment, "investment");
    setInvestmentData(investment ? investment : null);
    setEditForm(investmentData ? true : false);
    console.log(watchInvestor, "watchInvestor");
    if (watchInvestor) {
      setSelectedInvestor(investors.find((i) => i._id === watchInvestor));
    }
    console.log(selectedInvestor, "selectedInvestor");
  }, [investmentData, watchInvestor]);

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

  const getPaymentTypeLabel = (paymentType: string) => {
    return paymentType === "interest"
      ? "Interest Only"
      : "Interest + Principal";
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

      // if(data?.)
      let planToUse;

      if (selectedPlanOption === "new") {
        // Create the plan first
        data.newPlan = {
          ...data.newPlan,
          features: [...data.newPlan.features],
        };
        const planResponse = await plansService.createPlan({
          ...data.newPlan,
          isActive: true,
        });
        planToUse = planResponse.data._id;
      } else {
        planToUse = data.plan;
      }

      onSubmit({
        plan: planToUse,
        principalAmount: parseFloat(data.principalAmount),
        investmentDate: data.investmentDate,
        notes: data.notes,
        calculationResult,
        investor: data.investor || selectedInvestor?._id,
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
            <span className="ml-2 font-medium">{selectedInvestor?.name}</span>
          </div>
          <div>
            <span className="text-blue-700">ID:</span>
            <span className="ml-2 font-medium">
              {selectedInvestor?.investorId}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Email:</span>
            <span className="ml-2 font-medium">{selectedInvestor?.email}</span>
          </div>
          <div>
            <span className="text-blue-700">Phone:</span>
            <span className="ml-2 font-medium">{selectedInvestor?.phone}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Investment Details & Plan Configuration */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Investing Amount & Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Investor *
              </label>
              <select
                {...register("investor", {
                  required: "Please select an investor",
                })}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Investor</option>
                {investors.map((investor) => (
                  <option key={investor._id} value={investor._id}>
                    {investor.name} ({investor.investorId})
                  </option>
                ))}
              </select>
              {errors.investor && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investor.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("principalAmount", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Amount >= 0" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
              />
              {errors.principalAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.principalAmount.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Investment Date
              </label>
              <input
                type="date"
                {...register("investmentDate")}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tenure (Months)
                      </label>
                      <input
                        type="number"
                        {...register("investment.tenureMonths", {
                          valueAsNumber: true,
                          min: { value: 0, message: ">=0" },
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12"
                      />
                      {errors.investment?.tenureMonths && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.investment.tenureMonths.message}
                        </p>
                      )}
                    </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Interest Rate (%) Monthly
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("investment.interestRateMonthly", {
                          valueAsNumber: true,
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="2"
                      />
                    </div> */}
            {/* {watchReferralFeeExpect === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Referral % (Monthly)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register("investment.referralPercentMonthly", {
                            valueAsNumber: true,
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.20"
                        />
                      </div>
                    )} */}
          </div>

          {/* Plan Mode Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Plan
            </label>
            <select
              {...register("planMode")}
              value={selectedPlanOption || watchInvestmentPlanMode || ""}
              onChange={(e) => {
                const v = e.target.value as "existing" | "new" | "";
                setSelectedPlanOption(v);
                if (v === "existing") {
                  setValue("newPlan", {}); // reset custom plan fields
                } else if (v === "new") {
                  setValue("plan", ""); // reset existing plan id
                }
              }}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500
      focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="existing">Existing</option>
              <option value="new">New Configuration</option>
            </select>
          </div>

          {/* Existing Plan Dropdown */}
          {selectedPlanOption === "existing" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Plan
              </label>
              <select
                {...register("plan")}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Existing Plan</option>
                {plans &&
                  plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - {p.interestRate}% {p.interestType} (
                      {getPaymentTypeLabel(p.paymentType)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Custom Plan Configuration */}
          {selectedPlanOption === "new" && (
            <div className="mt-6 space-y-6">
              <h4 className="text-md font-semibold text-gray-800">
                New Plan Configuration
              </h4>

              {/* Plan Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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

              {/* Shared Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interest Rate (% per month) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("newPlan.interestRate", {
                      required: "Interest rate is required",
                      min: {
                        value: 0,
                        message: "Interest rate must be positive",
                      },
                      max: {
                        value: 100,
                        message: "Interest rate cannot exceed 100%",
                      },
                    })}
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
                    {...register("newPlan.interestType", {
                      required: "Interest type is required",
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="flat">Flat Interest</option>
                    <option value="reducing">Reducing Balance</option>
                  </select>
                  {errors.newPlan?.interestType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPlan.interestType.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tenure (months) *
                  </label>
                  <input
                    type="number"
                    {...register("newPlan.tenure", {
                      required: "Tenure is required",
                      min: {
                        value: 1,
                        message: "Tenure must be at least 1 month",
                      },
                      max: {
                        value: 240,
                        message: "Tenure cannot exceed 240 months",
                      },
                    })}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Investment (₹) *
                  </label>
                  <input
                    type="number"
                    {...register("newPlan.minInvestment", {
                      required: "Minimum investment is required",
                      min: {
                        value: 1000,
                        message: "Minimum investment must be at least ₹1,000",
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                  />
                  {errors.newPlan?.minInvestment && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPlan.minInvestment.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Investment (₹) *
                  </label>
                  <input
                    type="number"
                    {...register("newPlan.maxInvestment", {
                      required: "Maximum investment is required",
                      min: {
                        value: 1000,
                        message: "Maximum investment must be at least ₹1,000",
                      },
                      validate: (value) => {
                        const min = getValues("newPlan.minInvestment");
                        return (
                          !min ||
                          value >= min ||
                          "Maximum must be greater than or equal to minimum"
                        );
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000000"
                  />
                  {errors.newPlan?.maxInvestment && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPlan.maxInvestment.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      {...register("newPlan.isActive")}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Plan is Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Structure
                </h3>
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
                            watchPaymentType === "interest"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                watchPaymentType === "interest"
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {watchPaymentType === "interest" && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Interest Payment
                              </div>
                              <div className="text-xs text-gray-500">
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
                            watchPaymentType === "interestWithPrincipal"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                watchPaymentType === "interestWithPrincipal"
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {watchPaymentType === "interestWithPrincipal" && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Interest + Principal
                              </div>
                              <div className="text-xs text-gray-500">
                                Combined interest and principal payments
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Configuration */}
              {watch("newPlan.paymentType") === "interest" && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-4">
                  <h4 className="text-md font-medium text-blue-900 mb-4 flex items-center">
                    Interest Payment Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Interest Payment Frequency *
                      </label>
                      <select
                        {...register(
                          "newPlan.interestPayment.interestFrequency",
                          { required: "Interest frequency is required" }
                        )}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
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
                    {watch("newPlan.interestPayment.interestFrequency") ===
                    "others" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Custom Interest Start Date
                        </label>
                        <input
                          {...register(
                            "newPlan.interestPayment.interestStartDate"
                          )}
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Disbursement date
                        </label>
                        <input
                          {...register("newPlan.disbursementDate")}
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Principal Repayment Option *
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            {...register(
                              "newPlan.interestPayment.principalRepaymentOption"
                            )}
                            type="radio"
                            value="fixed"
                            className="mr-2"
                          />
                          <span className="text-sm">
                            Fixed Tenure – Principal repaid at maturity
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register(
                              "newPlan.interestPayment.principalRepaymentOption"
                            )}
                            type="radio"
                            value="flexible"
                            className="mr-2"
                          />
                          <span className="text-sm">
                            Flexible Withdrawal – Early withdrawal allowed
                          </span>
                        </label>
                      </div>
                    </div>
                    {watch(
                      "newPlan.interestPayment.principalRepaymentOption"
                    ) === "flexible" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Withdrawal Allowed After (%)
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

              {watch("newPlan.paymentType") === "interestWithPrincipal" && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-4">
                  <h4 className="text-md font-medium text-green-900 mb-4 flex items-center">
                    Interest + Principal Payment Configuration
                  </h4>
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
                              "Principal repayment percentage is required",
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
                            required: "Payment frequency is required",
                          }
                        )}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
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

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Features (comma-separated)
                </label>
                <textarea
                  {...register("newPlan.features", {
                    required: "Please add features",
                  })}
                  required
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="High Returns, Monthly Payouts, Flexible Terms"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter features separated by commas
                </p>
              </div>

              {/* Features */}
              {/* <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Disbursement date
                  </label>
                  <input
                    {...register("newPlan.disbursementDate")}
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div> */}

              {/* Plan Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Plan Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Payment Type:</span>
                    <div className="font-medium">
                      {watch("newPlan.paymentType") === "interest"
                        ? "Interest Only"
                        : "Interest + Principal"}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <div className="font-medium">
                      {watch("newPlan.interestRate") || 0}% per month
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tenure:</span>
                    <div className="font-medium">
                      {watch("newPlan.tenure") || 0} months
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Level:</span>
                    <div className="font-medium capitalize">
                      {watch("newPlan.riskLevel")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Plan Details */}
        {selectedPlan && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-md font-medium text-green-900 mb-3">
              Selected Plan Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700">Interest Rate:</span>
                <div className="font-medium">
                  {selectedPlan.interestRate}% per month
                </div>
              </div>
              <div>
                <span className="text-green-700">Interest Type:</span>
                <div className="font-medium capitalize">
                  {selectedPlan.interestType}
                </div>
              </div>
              <div>
                <span className="text-green-700">Tenure:</span>
                <div className="font-medium">{selectedPlan.tenure} months</div>
              </div>
              <div>
                <span className="text-green-700">Payment Type:</span>
                <div className="font-medium">
                  {getPaymentTypeLabel(selectedPlan.paymentType)}
                </div>
              </div>
              <div>
                <span className="text-green-700">Payment Frequency:</span>
                <div className="font-medium capitalize">
                  {getPaymentFrequency(selectedPlan)}
                </div>
              </div>
              <div>
                <span className="text-green-700">Risk Level:</span>
                <div className="font-medium capitalize">
                  {selectedPlan.riskLevel}
                </div>
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
                    {formatCurrency(
                      calculationResult.calculations.totalInterest
                    )}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Total Returns</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      calculationResult.calculations.totalReturns
                    )}
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
                    <span>
                      Enter a valid amount within the plan range to see
                      calculations
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Maturity Information */}
        {selectedPlan && watch("investmentDate") && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="text-md font-medium text-yellow-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Investment Timeline
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Start Date:</span>
                <div className="font-medium">
                  {new Date(watch("investmentDate")).toLocaleDateString(
                    "en-IN"
                  )}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">Maturity Date:</span>
                <div className="font-medium">
                  {(() => {
                    const startDate = new Date(watch("investmentDate"));
                    const maturityDate = new Date(startDate);
                    maturityDate.setMonth(
                      maturityDate.getMonth() + selectedPlan.tenure
                    );
                    return maturityDate.toLocaleDateString("en-IN");
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
        {selectedPlan && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Validation Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              {/* <div className="flex items-center">
                        {watchInvestor ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="ml-2">Investor Selected</span>
                      </div> */}
              <div className="flex items-center">
                {selectedPlan ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="ml-2">Plan Selected</span>
              </div>
              <div className="flex items-center">
                {watchPrincipalAmount &&
                selectedPlan &&
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
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          loading={submitting}
          disabled={!calculationResult || calculating || submitting}
          // disabled={submitting}
          className="bg-green-600 hover:bg-green-700"
        >
          Create Investment
        </Button>
      </div>
    </div>
  );
};

export default InvestmentForm;
