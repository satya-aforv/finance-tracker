// src/pages/investors/InvestorForm.tsx - Enhanced with Nominee, Referral, Investment & Plan Config (additive only)
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Lock,
  TrendingUp,
  FileText,
} from "lucide-react";
import Button from "../../components/common/Button";
import { Investor } from "../../types";
import toast from "react-hot-toast";
import { plansService } from "../../services/plans";

interface InvestorFormProps {
  investor?: Investor;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  existingPlans?: Array<{ id: string; name: string }>;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  altPhone?: string;

  address: {
    present: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    permanent: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    sameAsPresent: boolean;
  };

  kyc: {
    panNumber: string;
    aadharNumber: string;
    panCardFile: FileList;
    aadharCardFile: FileList;
    bankDetails: {
      bankName: string;
      accountHolderName: string;
      accountNumber: string;
      confirmAccountNumber?: string;
      ifscCode: string;
      branchName: string;
      bankProofFile: FileList;
    };
  };

  status: "active" | "inactive" | "blocked";

  createUserAccount: boolean;
  userAccountDetails?: {
    password: string;
    confirmPassword: string;
    sendCredentials: boolean;
    temporaryPassword: boolean;
  };

  nominee: {
    name: string;
    email: string;
    mobile: string;
    relation: string;
  };

  referral?: {
    name?: string;
    email?: string;
    mobile?: string;
    altMobile?: string;
    type?:
      | "employee"
      | "agent"
      | "consultant"
      | "friend"
      | "relative"
      | "other";
    otherTypeDetail?: string;
    referralFeeExpectation?: boolean;
    referralFeePercentMonthly?: number;
  };

  investment?: {
    amount?: number;
    investmentDate?: string;
    tenureMonths?: number;
    interestRateMonthly?: number;
    referralPercentMonthly?: number;
    planMode?: "existing" | "new";
    existingPlanId?: string;
    customPlan?: {
      planType?: "interestOnly" | "interestPlusPrincipal";
      interestRate?: number;
      interestType?: "flat" | "reducing";
      paymentFrequency?: "monthly" | "quarterly" | "others";
      interestStartDate?: string;
      principalSettlement?: "fixedTenure" | "flexibleWithdrawal";
      withdrawalAfterPercentTenure?: number;
      principalSettlementTermMonths?: number;
      principalRepaymentPercent?: number;
      interestPayoutDate?: string;
      principalPayoutDate?: string;
    };
  };
}

// tabFields is now a function that takes createUserAccount as argument
const getTabFields = (
  createUserAccount: boolean
): Record<string, string[]> => ({
  basicDetails: [
    "name",
    "email",
    "phone",
    "altPhone",
    "status",
    ...(createUserAccount
      ? ["userAccountDetails.password", "userAccountDetails.confirmPassword"]
      : []),
  ],
  address: [
    "address.present.street",
    "address.present.city",
    "address.present.state",
    "address.present.pincode",
    "address.present.country",
    "address.permanent.street",
    "address.permanent.city",
    "address.permanent.state",
    "address.permanent.pincode",
    "address.permanent.country",
  ],
  bankDetails: [
    "kyc.bankDetails.bankName",
    "kyc.bankDetails.accountHolderName",
    "kyc.bankDetails.accountNumber",
    "kyc.bankDetails.confirmAccountNumber",
    "kyc.bankDetails.ifscCode",
    "kyc.bankDetails.branchName",
    "kyc.bankDetails.bankProofFile",
    "kyc.panNumber",
    "kyc.aadharNumber",
    "kyc.panCardFile",
    "kyc.aadharCardFile",
    "nominee.name",
    "nominee.email",
    "nominee.mobile",
    "nominee.relation",
  ],
  investments: [
    "investment.amount",
    "investment.investmentDate",
    "investment.tenureMonths",
    "investment.interestRateMonthly",
    "investment.planMode",
    // Add more as needed for custom plan
  ],
  referalPolicy: [
    "referral.name",
    "referral.email",
    "referral.mobile",
    "referral.type",
    // Add more as needed
  ],
});

const InvestorForm: React.FC<InvestorFormProps> = ({
  investor,
  onSubmit,
  onCancel,
  existingPlans = [],
}) => {
  const [showAadhar, setShowAadhar] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("basicDetails");
  const [plans, setPlans] = useState(existingPlans);
  const [panValidation, setPanValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [ifscValidation, setIfscValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [createUserAccount, setCreateUserAccount] = useState(!investor); // Default to true for new investors

  const [planMode, setPlanMode] = useState<"existing" | "new" | "">("");
  const [planType, setPlanType] = useState<
    "interestOnly" | "interestPlusPrincipal" | ""
  >("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: investor
      ? {
          name: investor.name || "",
          email: investor.email || "",
          phone: investor.phone || "",
          altPhone: investor.altPhone || "",
          address: {
            present: {
              street: investor.address?.street || "",
              city: investor.address?.city || "",
              state: investor.address?.state || "",
              pincode: investor.address?.pincode || "",
              country: investor.address?.country || "India",
            },
            permanent: {
              street: investor?.address?.street || "",
              city: investor?.address?.city || "",
              state: investor?.address?.state || "",
              pincode: investor?.address?.pincode || "",
              country: investor?.address?.country || "India",
            },
            sameAsPresent: true,
          },
          kyc: {
            panNumber: investor.kyc?.panNumber || "",
            aadharNumber: investor.kyc?.aadharNumber || "",
            bankDetails: {
              bankName: investor.kyc?.bankDetails?.bankName || "",
              accountHolderName: investor.name || "",
              accountNumber: investor.kyc?.bankDetails?.accountNumber || "",
              ifscCode: investor.kyc?.bankDetails?.ifscCode || "",
              branchName: investor.kyc?.bankDetails?.branchName || "",
              bankProofFile: undefined as unknown as FileList,
            },
          },
          status: investor.status,
          createUserAccount: !!investor.userId,
          userAccountDetails: {
            password: "",
            confirmPassword: "",
            sendCredentials: false,
            temporaryPassword: false,
          },
          nominee: {
            name: "",
            email: "",
            mobile: "",
            relation: "",
          },
          referral: {
            name: "",
            email: "",
            mobile: "",
            altMobile: "",
            type: undefined,
            otherTypeDetail: "",
            referralFeeExpectation: false,
            referralFeePercentMonthly: undefined,
          },
          investment: {
            amount: undefined,
            investmentDate: "",
            tenureMonths: undefined,
            interestRateMonthly: undefined,
            referralPercentMonthly: undefined,
            planMode: undefined,
            existingPlanId: "",
            customPlan: {},
          },
        }
      : {
          name: "",
          email: "",
          phone: "",
          altPhone: "",
          address: {
            present: {
              street: "",
              city: "",
              state: "",
              pincode: "",
              country: "India",
            },
            permanent: {
              street: "",
              city: "",
              state: "",
              pincode: "",
              country: "India",
            },
            sameAsPresent: false,
          },
          kyc: {
            panNumber: "",
            aadharNumber: "",
            panCardFile: undefined as unknown as FileList,
            aadharCardFile: undefined as unknown as FileList,
            bankDetails: {
              bankName: "",
              accountHolderName: "",
              accountNumber: "",
              ifscCode: "",
              branchName: "",
              bankProofFile: undefined as unknown as FileList,
            },
          },
          status: "active",
          createUserAccount: true,
          userAccountDetails: {
            password: "",
            confirmPassword: "",
            sendCredentials: true,
            temporaryPassword: true,
          },
          nominee: {
            name: "",
            email: "",
            mobile: "",
            relation: "",
          },
          referral: {
            name: "",
            email: "",
            mobile: "",
            altMobile: "",
            type: undefined,
            otherTypeDetail: "",
            referralFeeExpectation: false,
            referralFeePercentMonthly: undefined,
          },
          investment: {
            amount: undefined,
            investmentDate: "",
            tenureMonths: undefined,
            interestRateMonthly: undefined,
            referralPercentMonthly: undefined,
            planMode: undefined,
            existingPlanId: "",
            customPlan: {},
          },
        },
  });

  const watchPan = watch("kyc.panNumber");
  const watchIfsc = watch("kyc.bankDetails.ifscCode");
  const watchPassword = watch("userAccountDetails.password");
  const watchCreateAccount = watch("createUserAccount");
  const watchSameAsPresent = watch("address.sameAsPresent");
  const watchAcct = watch("kyc.bankDetails.accountNumber");
  const watchAcctConfirm = watch("kyc.bankDetails.confirmAccountNumber");
  const watchReferralFeeExpect = watch("referral.referralFeeExpectation");
  const watchInvestmentPlanMode = watch("investment.planMode");
  const watchCustomPlanType = watch("investment.customPlan.planType");
  const watchPaymentFreq = watch("investment.customPlan.paymentFrequency");

  const tabOrder = [
    { id: "basicDetails", label: "Basic Information" },
    { id: "address", label: "Address" },
    { id: "bankDetails", label: "Bank Details" },
    { id: "investments", label: "Investments" },
    { id: "referalPolicy", label: "Referral Policy" },
  ];

  const currentTabIndex = tabOrder.findIndex((tab) => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabOrder.length - 1;
  const prevTab = !isFirstTab ? tabOrder[currentTabIndex - 1] : null;
  const nextTab = !isLastTab ? tabOrder[currentTabIndex + 1] : null;

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("userAccountDetails.password", password);
    setValue("userAccountDetails.confirmPassword", password);
  };

  const syncPermanentAddress = (checked: boolean) => {
    setValue("address.sameAsPresent", checked);
    if (checked) {
      const present = getValues("address.present");
      setValue("address.permanent", present);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await plansService.getPlans({
        page: 1,
        limit: 30,
        // search: searchTerm,
        // paymentType: paymentTypeFilter,
        // interestType: interestTypeFilter,
        // isActive: activeFilter,
      });

      setPlans(response.data || []);
      // if (response.pagination) {
      //   setTotalPages(response.pagination.pages);
      // }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch plans");
    }
  };

  const handleSameAddress = (value: boolean) => {
    syncPermanentAddress(value);
  };

  const validatePAN = (pan: string) => {
    if (!pan) return null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValid = panRegex.test(pan.toUpperCase());
    return {
      isValid,
      message: isValid
        ? "Valid PAN format"
        : "Invalid PAN format. Example: AKDPB7458C",
    };
  };

  const validateIFSC = (ifsc: string) => {
    if (!ifsc) return null;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const isValid = ifscRegex.test(ifsc.toUpperCase());
    return {
      isValid,
      message: isValid
        ? "Valid IFSC format"
        : "Invalid IFSC format. Example: SBIN0001234",
    };
  };

  React.useEffect(() => {
    fetchPlans();
    setPanValidation(watchPan ? validatePAN(watchPan) : null);
  }, [watchPan]);

  React.useEffect(() => {
    setIfscValidation(watchIfsc ? validateIFSC(watchIfsc) : null);
  }, [watchIfsc]);

  React.useEffect(() => {
    if (watchSameAsPresent) {
      const present = getValues("address.present");
      setValue("address.permanent", present, { shouldValidate: true });
    }
  }, [watchSameAsPresent, getValues, setValue]);

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setValue("kyc.panNumber", value);
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setValue("kyc.bankDetails.ifscCode", value);
  };

  const fileSizeUnder2MB = (files: FileList) => {
    if (!files || files.length === 0) return "File required";
    const f = files[0];
    const max = 2 * 1024 * 1024;
    return f.size <= max || "Max file size 2MB";
  };

  const bankProofFileCheck = (files: FileList) => {
    if (!files || files.length === 0) return "Bank proof is required";
    const f = files[0];
    const max = 2 * 1024 * 1024;
    if (f.size > max) return "Max file size 2MB";
    return true;
  };

  const ValidationIcon: React.FC<{
    validation: { isValid: boolean; message: string } | null;
  }> = ({ validation }) => {
    if (!validation) return null;
    return validation.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const passwordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: "Very Weak", color: "text-red-600" },
      { score: 1, label: "Weak", color: "text-red-500" },
      { score: 2, label: "Fair", color: "text-yellow-500" },
      { score: 3, label: "Good", color: "text-blue-500" },
      { score: 4, label: "Strong", color: "text-green-500" },
      { score: 5, label: "Very Strong", color: "text-green-600" },
    ];

    return levels[score] || levels[0];
  };

  return (
    <div className="space-y-6 w-100">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: "basicDetails", label: "Basic Information", icon: User },
              { id: "address", label: "Address", icon: User },
              { id: "bankDetails", label: "Bank Details", icon: TrendingUp },
              { id: "investments", label: "Investments", icon: TrendingUp },
              { id: "referalPolicy", label: "Referal Policy", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Details Tab */}
          {activeTab === "basicDetails" && (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      {...register("name", {
                        required: "Name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                        pattern: {
                          value: /^[a-zA-Z\s]+$/,
                          message:
                            "Name should only contain letters and spaces",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile Number *
                    </label>
                    <input
                      {...register("phone", {
                        required: "Mobile number is required",
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message:
                            "Please enter a valid 10-digit mobile number starting with 6-9",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alternate Mobile Number *
                    </label>
                    <input
                      {...register("altPhone", {
                        required: "Alternate mobile number is required",
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message:
                            "Please enter a valid 10-digit mobile number starting with 6-9",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                    {errors.altPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.altPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
              {!investor && (
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      User Account Creation
                    </h3>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center">
                      <input
                        {...register("createUserAccount")}
                        type="checkbox"
                        checked={createUserAccount}
                        onChange={(e) => setCreateUserAccount(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring
            focus:ring-blue-200 focus:ring-opacity-50 mr-3"
                      />
                      <div>
                        <label className="text-sm font-medium text-blue-900">
                          Create user account for this investor
                        </label>
                        <p className="text-sm text-blue-700">
                          This will allow the investor to log in and view their
                          investment portfolio
                        </p>
                      </div>
                    </div>
                  </div>

                  {watchCreateAccount && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              {...register("userAccountDetails.password", {
                                required: watchCreateAccount
                                  ? "Password is required"
                                  : false,
                                minLength: {
                                  value: 8,
                                  message:
                                    "Password must be at least 8 characters",
                                },
                              })}
                              type={showPassword ? "text" : "password"}
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {watchPassword && (
                            <div className="mt-1">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-1">
                                  <div
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                      passwordStrength(watchPassword).score <= 2
                                        ? "bg-red-500"
                                        : passwordStrength(watchPassword)
                                            .score <= 3
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{
                                      width: `${
                                        (passwordStrength(watchPassword).score /
                                          5) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-xs ${
                                    passwordStrength(watchPassword).color
                                  }`}
                                >
                                  {passwordStrength(watchPassword).label}
                                </span>
                              </div>
                            </div>
                          )}
                          {errors.userAccountDetails?.password && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.userAccountDetails.password.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              {...register(
                                "userAccountDetails.confirmPassword",
                                {
                                  required: watchCreateAccount
                                    ? "Please confirm password"
                                    : false,
                                  validate: (value) =>
                                    !watchCreateAccount ||
                                    value === watchPassword ||
                                    "Passwords do not match",
                                }
                              )}
                              type={showConfirmPassword ? "text" : "password"}
                              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500
                    focus:border-blue-500"
                              placeholder="Confirm password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {errors.userAccountDetails?.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">
                              {
                                errors.userAccountDetails.confirmPassword
                                  .message
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateTempPassword}
                        >
                          <Lock className="h-4 w-4 mr-2" /> Generate Temporary
                          Password
                        </Button>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <input
                              {...register(
                                "userAccountDetails.temporaryPassword"
                              )}
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                            />
                            <label className="text-sm text-gray-700">
                              Temporary password
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              {...register(
                                "userAccountDetails.sendCredentials"
                              )}
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                            />
                            <label className="text-sm text-gray-700">
                              Send credentials via email
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> The investor will be assigned
                          the "investor" role and will only be able to view
                          their own investments and payments.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Address Tab */}
          {activeTab === "address" && (
            <div className="space-y-6">
              {/* Present Address */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Present Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      {...register("address.present.street", {
                        required: "Street required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      {...register("address.present.city", {
                        required: "City required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      {...register("address.present.state", {
                        required: "State required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      {...register("address.present.pincode", {
                        required: "Pincode required",
                        pattern: {
                          value: /^\d{6}$/,
                          message: "Pincode must be 6 digits",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                    {errors.address?.present?.pincode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.address.present.pincode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      {...register("address.present.country", {
                        required: "Country required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("address.sameAsPresent")}
                    defaultChecked={investor?.address?.sameAsPresent || false}
                    onChange={(e) => handleSameAddress(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Is Permanent Address same as Present?</span>
                </label>
              </div>

              {/* Permanent Address */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Permanent Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      {...register("address.permanent.street", {
                        required: "Street required",
                      })}
                      disabled={watchSameAsPresent}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      {...register("address.permanent.city", {
                        required: "City required",
                      })}
                      disabled={watchSameAsPresent}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      {...register("address.permanent.state", {
                        required: "State required",
                      })}
                      disabled={watchSameAsPresent}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      {...register("address.permanent.pincode", {
                        required: "Pincode required",
                        pattern: {
                          value: /^\d{6}$/,
                          message: "Pincode must be 6 digits",
                        },
                      })}
                      disabled={watchSameAsPresent}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                    {errors.address?.permanent?.pincode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.address.permanent.pincode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      {...register("address.permanent.country", {
                        required: "Country required",
                      })}
                      disabled={watchSameAsPresent}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === "bankDetails" && (
            <div className="space-y-6">
              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name *
                    </label>
                    <input
                      {...register("kyc.bankDetails.bankName", {
                        required: "Bank name is required",
                        minLength: {
                          value: 2,
                          message: "Bank name must be at least 2 characters",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter bank name"
                    />
                    {errors.kyc?.bankDetails?.bankName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.bankName.message}
                      </p>
                    )}
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name of Account Holder *
                    </label>
                    <input
                      {...register("kyc.bankDetails.accountHolderName", {
                        required: "Account holder name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="As per bank records"
                    />
                    {errors.kyc?.bankDetails?.accountHolderName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.accountHolderName.message}
                      </p>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                      Account Number *
                    </label>
                    <input
                      {...register("kyc.bankDetails.accountNumber", {
                        required: "Account number is required",
                        pattern: {
                          value: /^\d{9,18}$/,
                          message: "Account number must be 9-18 digits",
                        },
                      })}
                      type={showAccount ? "text" : "password"}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full account number"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center mt-2"
                      onClick={() => setShowAccount(!showAccount)}
                    >
                      {showAccount ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {errors.kyc?.bankDetails?.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.accountNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Account Number */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Account Number *
                    </label>
                    <input
                      {...register("kyc.bankDetails.confirmAccountNumber", {
                        required: "Please confirm account number",
                        validate: (val) =>
                          val === watchAcct || "Account numbers do not match",
                      })}
                      type={showConfirmAccount ? "text" : "password"}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500
            focus:border-blue-500"
                      placeholder="Re-enter account number"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center mt-2"
                      onClick={() => setShowConfirmAccount(!showConfirmAccount)}
                    >
                      {showConfirmAccount ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {errors.kyc?.bankDetails?.confirmAccountNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.confirmAccountNumber.message}
                      </p>
                    )}
                  </div>

                  {/* IFSC Code */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                      IFSC Code *
                    </label>
                    <input
                      {...register("kyc.bankDetails.ifscCode", {
                        required: "IFSC code is required",
                        pattern: {
                          value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                          message: "Invalid IFSC format. Example: SBIN0001234",
                        },
                      })}
                      onChange={handleIfscChange}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2
                focus:ring-blue-500 focus:border-blue-500 ${
                  ifscValidation?.isValid
                    ? "border-green-300"
                    : ifscValidation?.isValid === false
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
                      placeholder="SBIN0001234"
                      maxLength={11}
                      style={{ textTransform: "uppercase" }}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <ValidationIcon validation={ifscValidation} />
                    </div>
                    {errors.kyc?.bankDetails?.ifscCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.ifscCode.message}
                      </p>
                    )}
                  </div>

                  {/* Branch Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Branch Name *
                    </label>
                    <input
                      {...register("kyc.bankDetails.branchName", {
                        required: "Branch name is required",
                        minLength: {
                          value: 2,
                          message: "Branch name must be at least 2 characters",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter branch name"
                    />
                    {errors.kyc?.bankDetails?.branchName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.bankDetails.branchName.message}
                      </p>
                    )}
                  </div>

                  {/* Upload Bank Proof */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="bankProofFile"
                      className="form-label fw-bold block text-sm font-medium text-gray-700 mb-1"
                    >
                      Upload Cancelled Cheque / Passbook / Bank Statement
                      (PDF/JPEG/PNG) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bankProofFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      {...register("kyc.bankDetails.bankProofFile", {
                        required: "Bank proof is required",
                        validate: bankProofFileCheck,
                      })}
                      className={`form-control ${
                        errors.kyc?.bankDetails?.bankProofFile
                          ? "is-invalid"
                          : ""
                      }`}
                    />
                    {errors.kyc?.bankDetails?.bankProofFile && (
                      <div className="invalid-feedback">
                        {errors.kyc.bankDetails.bankProofFile.message as string}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nominee Details (NEW) */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  👤 Nominee Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nominee Name *
                    </label>
                    <input
                      {...register("nominee.name", {
                        required: "Nominee name is required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                    {errors.nominee?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nominee.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nominee Email *
                    </label>
                    <input
                      {...register("nominee.email", {
                        required: "Nominee email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email",
                        },
                      })}
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                    {errors.nominee?.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nominee.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nominee Mobile *
                    </label>
                    <input
                      {...register("nominee.mobile", {
                        required: "Nominee mobile is required",
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: "Invalid mobile",
                        },
                      })}
                      maxLength={10}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 10-digit mobile"
                    />
                    {errors.nominee?.mobile && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nominee.mobile.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Relation *
                    </label>
                    <select
                      {...register("nominee.relation", {
                        required: "Relation required",
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select relation</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.nominee?.relation && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nominee.relation.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* KYC Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  KYC Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      PAN Number *
                    </label>
                    <div className="relative">
                      <input
                        {...register("kyc.panNumber", {
                          required: "PAN number is required",
                          pattern: {
                            value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                            message: "Invalid PAN format. Example: AKDPB7458C",
                          },
                        })}
                        onChange={handlePanChange}
                        className={`mt-1 block w-full border rounded-lg px-3 py-2 pr-10
                    focus:ring-blue-500 focus:border-blue-500 ${
                      panValidation?.isValid
                        ? "border-green-300"
                        : panValidation?.isValid === false
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                        placeholder="AKDPB7458C"
                        maxLength={10}
                        style={{ textTransform: "uppercase" }}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <ValidationIcon validation={panValidation} />
                      </div>
                    </div>
                    {errors.kyc?.panNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.panNumber.message}
                      </p>
                    )}
                    {panValidation && (
                      <p
                        className={`mt-1 text-sm ${
                          panValidation.isValid
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {panValidation.message}
                      </p>
                    )}
                  </div>

                  {/* Aadhar Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhar Number *
                    </label>
                    <div className="relative">
                      <input
                        {...register("kyc.aadharNumber", {
                          required: "Aadhar number is required",
                          pattern: {
                            value: /^\d{12}$/,
                            message: "Aadhar number must be exactly 12 digits",
                          },
                        })}
                        type={showAadhar ? "text" : "password"}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter 12-digit Aadhar number"
                        maxLength={12}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowAadhar(!showAadhar)}
                      >
                        {showAadhar ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.kyc?.aadharNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.kyc.aadharNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="panCardFile"
                      className="form-label fw-bold block text-sm font-medium text-gray-700 mb-1"
                    >
                      Upload PAN Card (PDF/JPEG/PNG){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="panCardFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      {...register("kyc.panCardFile", {
                        required: "PAN Card is required",
                        validate: fileSizeUnder2MB,
                      })}
                      className={`form-control ${
                        errors.kyc?.panCardFile ? "is-invalid" : ""
                      }`}
                    />
                    {errors.kyc?.panCardFile && (
                      <div className="invalid-feedback">
                        {errors.kyc.panCardFile.message as string}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="aadharCardFile"
                      className="form-label fw-bold block text-sm font-medium text-gray-700 mb-1"
                    >
                      Upload Aadhar Card (Front & Back or Combined){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="aadharCardFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      {...register("kyc.aadharCardFile", {
                        required: "Aadhar Card is required",
                        validate: fileSizeUnder2MB,
                      })}
                      className={`form-control ${
                        errors.kyc?.aadharCardFile ? "is-invalid" : ""
                      }`}
                    />
                    {errors.kyc?.aadharCardFile && (
                      <div className="invalid-feedback">
                        {errors.kyc.aadharCardFile.message as string}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Validation Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center">
                    <ValidationIcon validation={panValidation} />
                    <span className="ml-2">PAN Number Format</span>
                  </div>
                  <div className="flex items-center">
                    <ValidationIcon validation={ifscValidation} />
                    <span className="ml-2">IFSC Code Format</span>
                  </div>
                  {watchCreateAccount && (
                    <div className="flex items-center">
                      {watchPassword &&
                      passwordStrength(watchPassword).score >= 3 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-2">Password Strength</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Investments Tab */}
          {activeTab === "investments" && (
            <div className="space-y-6">
              {/* Investment Details & Plan Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Investing Amount & Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Investment Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("investment.amount", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount >= 0" },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100000"
                    />
                    {errors.investment?.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.investment.amount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Investment Date
                    </label>
                    <input
                      type="date"
                      {...register("investment.investmentDate")}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
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
                  </div>
                  {watchReferralFeeExpect === true && (
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
                  )}
                </div>

                {/* Plan Mode Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add Plan
                  </label>
                  <select
                    {...register("investment.planMode")}
                    value={planMode || watchInvestmentPlanMode || ""}
                    onChange={(e) => {
                      const v = e.target.value as "existing" | "new" | "";
                      setPlanMode(v);
                      if (v === "existing") {
                        setValue("investment.customPlan", {}); // reset custom plan fields
                      } else if (v === "new") {
                        setValue("investment.existingPlanId", ""); // reset existing plan id
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
                {planMode === "existing" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Existing Plan
                    </label>
                    <select
                      {...register("investment.existingPlanId")}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Existing Plan</option>
                      {plans &&
                        plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Custom Plan Configuration */}
                {planMode === "new" && (
                  <div className="mt-6 space-y-6">
                    <h4 className="text-md font-semibold text-gray-800">
                      Custom Plan Configuration
                    </h4>

                    {/* Choose Plan Type */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Plan Type
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="radio"
                            value="interestOnly"
                            {...register("investment.customPlan.planType")}
                            onChange={(e) => setPlanType(e.target.value as any)}
                          />
                          <span>Interest Only Plan</span>
                        </label>
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="radio"
                            value="interestPlusPrincipal"
                            {...register("investment.customPlan.planType")}
                            onChange={(e) => setPlanType(e.target.value as any)}
                          />
                          <span>Interest + Principal Plan</span>
                        </label>
                      </div>
                    </div>

                    {/* Shared Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Interest Rate (%) Monthly
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register("investment.customPlan.interestRate", {
                            valueAsNumber: true,
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Interest Type
                        </label>
                        <select
                          {...register("investment.customPlan.interestType")}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="flat">Flat</option>
                          <option value="reducing">Reducing Balance</option>
                        </select>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Interest Payment Frequency
                        </label>
                        <select
                          {...register(
                            "investment.customPlan.paymentFrequency"
                          )}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                      {watchPaymentFreq === "others" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Interest Start Date *
                          </label>
                          <input
                            type="date"
                            {...register(
                              "investment.customPlan.interestStartDate"
                            )}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Interest Only Plan Extras */}
                    {planType === "interestOnly" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Principal Settlement
                          </label>
                          <select
                            {...register(
                              "investment.customPlan.principalSettlement"
                            )}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select...</option>
                            <option value="fixedTenure">Fixed Tenure</option>
                            <option value="flexibleWithdrawal">
                              Flexible Withdrawal
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Withdrawal After % of Tenure
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(
                              "investment.customPlan.withdrawalAfterPercentTenure",
                              {
                                valueAsNumber: true,
                              }
                            )}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 for 50%"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Principal Settlement Term After Request (Months)
                          </label>
                          <input
                            type="number"
                            {...register(
                              "investment.customPlan.principalSettlementTermMonths",
                              {
                                valueAsNumber: true,
                              }
                            )}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    )}

                    {/* Interest + Principal Plan Extras */}
                    {planType === "interestPlusPrincipal" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Principal Repayment %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(
                              "investment.customPlan.principalRepaymentPercent",
                              {
                                valueAsNumber: true,
                              }
                            )}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="10 for 10%"
                          />
                        </div>
                        {watchPaymentFreq === "others" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Interest Payout Date *
                              </label>
                              <input
                                type="date"
                                {...register(
                                  "investment.customPlan.interestPayoutDate"
                                )}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Principal Payout Date *
                              </label>
                              <input
                                type="date"
                                {...register(
                                  "investment.customPlan.principalPayoutDate"
                                )}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referal Policy Tab */}
          {activeTab === "referalPolicy" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Documents
              </h3>
              {/* Referral Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  👥 Referral Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Referrer Name
                    </label>
                    <input
                      {...register("referral.name")}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter referrer's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Referrer Email
                    </label>
                    <input
                      {...register("referral.email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email",
                        },
                      })}
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter referrer's email"
                    />
                    {errors.referral?.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.referral.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Referrer Mobile
                    </label>
                    <input
                      {...register("referral.mobile", {
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: "Invalid mobile",
                        },
                      })}
                      maxLength={10}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter mobile number"
                    />
                    {errors.referral?.mobile && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.referral.mobile.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alternate Mobile
                    </label>
                    <input
                      {...register("referral.altMobile", {
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: "Invalid mobile",
                        },
                      })}
                      maxLength={10}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional alternate number"
                    />
                    {errors.referral?.altMobile && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.referral.altMobile.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Referrer Type */}
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    How is the Referrer Associated with Us?
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="employee"
                        {...register("referral.type")}
                      />
                      <span>Employee</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="agent"
                        {...register("referral.type")}
                      />
                      <span>Agent</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="consultant"
                        {...register("referral.type")}
                      />
                      <span>Consultant</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="friend"
                        {...register("referral.type")}
                      />
                      <span>Friend</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="relative"
                        {...register("referral.type")}
                      />
                      <span>Relative</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="other"
                        {...register("referral.type")}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                  {/* other type detail */}
                  <div className="mt-2">
                    <input
                      {...register("referral.otherTypeDetail")}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="If Other, specify (e.g., Agent, Friend, Consultant)"
                    />
                  </div>
                </div>

                {/* Referral Fee Expectation */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Any Referral Fee Expectation?
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="true"
                        {...register("referral.referralFeeExpectation")}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        value="false"
                        {...register("referral.referralFeeExpectation")}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {watchReferralFeeExpect === true && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Referral % (Monthly)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("referral.referralFeePercentMonthly", {
                          valueAsNumber: true,
                          min: { value: 0, message: ">= 0" },
                          max: { value: 100, message: "<= 100" },
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.20 for 0.20%"
                      />
                      {errors.referral?.referralFeePercentMonthly && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.referral.referralFeePercentMonthly.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Form Actions */}
      {activeTab === "referalPolicy" ? (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={isSubmitting}
            disabled={Boolean(
              panValidation?.isValid === false ||
                ifscValidation?.isValid === false ||
                (watchCreateAccount &&
                  passwordStrength(watchPassword || "").score < 3) ||
                (watchAcct &&
                  watchAcctConfirm &&
                  watchAcct !== watchAcctConfirm)
            )}
            onClick={handleSubmit(onSubmit)}
          >
            {investor ? "Update Investor" : "Create Investor"}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {isLastTab ? (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {!isFirstTab && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(prevTab?.id || activeTab)}
                >
                  Previous: {prevTab?.label}
                </Button>
              )}
              <Button
                type="button"
                loading={isSubmitting}
                disabled={Boolean(
                  panValidation?.isValid === false ||
                    ifscValidation?.isValid === false ||
                    (watchCreateAccount &&
                      passwordStrength(watchPassword || "").score < 3) ||
                    (watchAcct &&
                      watchAcctConfirm &&
                      watchAcct !== watchAcctConfirm)
                )}
                onClick={handleSubmit(onSubmit)}
              >
                {investor ? "Update Investor" : "Create Investor"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end space-x-3 pt-6 border-gray-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {!isFirstTab && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(prevTab?.id || activeTab)}
                >
                  Previous: {prevTab?.label}
                </Button>
              )}
              <Button
                type="button"
                loading={isSubmitting}
                onClick={async () => {
                  const valid = await trigger(
                    getTabFields(createUserAccount)[
                      activeTab
                    ] as import("react-hook-form").FieldPath<FormData>[]
                  );
                  if (valid) setActiveTab(nextTab?.id || activeTab);
                  if (valid) setActiveTab(nextTab?.id || activeTab);
                }}
              >
                Next: {nextTab?.label}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestorForm;
