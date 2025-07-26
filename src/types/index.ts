// src/types/index.ts - Updated Complete Type Definitions

// ================================
// USER & AUTHENTICATION TYPES
// ================================

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'investor';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  emailVerified: boolean;
  loginAttempts: number;
  lockUntil?: string;
  passwordChangedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// ================================
// INVESTOR TYPES
// ================================

export interface InvestorAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
}

export interface InvestorKYC {
  panNumber: string;
  aadharNumber: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  documents?: {
    panCard?: string;
    aadharCard?: string;
    bankStatement?: string;
    signature?: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface InvestorAgreement {
  fileName: string;
  filePath: string;
  uploadDate: string;
  category: 'agreement' | 'kyc' | 'legal' | 'other';
  description?: string;
}

export interface Investor {
  _id: string;
  investorId: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  address: InvestorAddress;
  kyc: InvestorKYC;
  agreements?: InvestorAgreement[];
  totalInvestment: number;
  activeInvestments: number;
  totalReturns: number;
  status: 'active' | 'inactive' | 'blocked';
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  investmentExperience: 'beginner' | 'intermediate' | 'expert';
  preferredContactMethod: 'email' | 'phone' | 'sms';
  notes?: string;
  tags: string[];
  lastContactDate?: string;
  nextFollowUpDate?: string;
  userId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PLAN TYPES (Updated Structure)
// ================================

export interface InterestPaymentConfig {
  dateOfInvestment: string;
  amountInvested: number;
  interestFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
  interestStartDate?: string;
  principalRepaymentOption: 'fixed' | 'flexible';
  withdrawalAfterPercentage?: number;
  principalSettlementTerm?: number;
}

export interface InterestWithPrincipalPaymentConfig {
  dateOfInvestment: string;
  investedAmount: number;
  principalRepaymentPercentage: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
  interestPayoutDate?: string;
  principalPayoutDate?: string;
}

export interface Plan {
  _id: string;
  planId: string;
  name: string;
  description?: string;
  
  // Basic Plan Configuration
  interestRate: number;
  interestType: 'flat' | 'reducing';
  tenure: number;
  minInvestment: number;
  maxInvestment: number;
  
  // Payment Type Selection (matches backend)
  paymentType: 'interest' | 'interestWithPrincipal';
  
  // Interest Payment Configuration
  interestPayment?: InterestPaymentConfig;
  
  // Interest with Principal Payment Configuration
  interestWithPrincipalPayment?: InterestWithPrincipalPaymentConfig;
  
  isActive: boolean;
  features?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  totalInvestors: number;
  totalInvestment: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// INVESTMENT TYPES (Updated)
// ================================

export interface PaymentSchedule {
  month: number;
  dueDate: string;
  interestAmount: number;
  principalAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount: number;
  paidDate?: string;
}

export interface InvestmentDocument {
  _id: string;
  category: 'agreement' | 'kyc' | 'payment_proof' | 'communication' | 'legal' | 'other';
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
  isActive: boolean;
}

export interface TimelineEntry {
  _id: string;
  date: string;
  type: 'investment_created' | 'payment_received' | 'payment_overdue' | 'document_uploaded' | 'status_changed' | 'note_added' | 'schedule_updated';
  description: string;
  amount: number;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata: any;
}

export interface RiskAssessment {
  score: number;
  factors: string[];
  lastUpdated: string;
}

export interface Investment {
  _id: string;
  investmentId: string;
  investor: {
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
    address?: InvestorAddress;
  };
  plan: {
    _id: string;
    planId: string;
    name: string;
    paymentType: 'interest' | 'interestWithPrincipal';
    interestType: string;
    interestRate: number;
    tenure: number;
  };
  
  // Basic Investment Details
  principalAmount: number;
  investmentDate: string;
  maturityDate: string;
  status: 'active' | 'completed' | 'closed' | 'defaulted';
  
  // Financial Details (copied from plan for historical record)
  interestRate: number;
  interestType: 'flat' | 'reducing';
  tenure: number;
  paymentType: 'interest' | 'interestWithPrincipal';
  
  // Calculated Fields
  totalExpectedReturns: number;
  totalInterestExpected: number;
  totalPaidAmount: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  remainingAmount: number;
  
  // Payment Schedule
  schedule: PaymentSchedule[];
  
  // Document management
  documents: InvestmentDocument[];
  
  // Timeline/Activity log
  timeline: TimelineEntry[];
  
  notes?: string;
  
  // Risk assessment
  riskAssessment?: RiskAssessment;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PAYMENT TYPES (Enhanced)
// ================================

export interface PaymentDocument {
  _id: string;
  category: 'receipt' | 'bank_statement' | 'cheque_copy' | 'upi_screenshot' | 'other';
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
}

export interface PaymentAuditEntry {
  action: 'created' | 'updated' | 'verified' | 'document_added' | 'document_removed' | 'status_changed';
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  details: any;
}

export interface Payment {
  _id: string;
  paymentId: string;
  investment: {
    _id: string;
    investmentId: string;
    principalAmount: number;
    maturityDate?: string;
  };
  investor: {
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
    address?: InvestorAddress;
  };
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'overdue';
  type: 'interest' | 'principal' | 'mixed' | 'penalty' | 'bonus';
  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;
  bonusAmount: number;
  notes?: string;
  
  // Enhanced document support - multiple documents per payment
  documents: PaymentDocument[];
  
  // Legacy receipt field for backward compatibility
  receipt?: {
    fileName: string;
    filePath: string;
    uploadDate: string;
  };
  
  processedBy: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedAt?: string;
  
  // Additional tracking fields
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedAt?: string;
  
  // Audit trail
  auditLog: PaymentAuditEntry[];
  
  createdAt: string;
  updatedAt: string;
}

// ================================
// FORM DATA TYPES
// ================================

export interface InvestmentFormData {
  investor: string;
  plan: string;
  principalAmount: number;
  investmentDate: string;
  notes: string;
}

export interface PaymentFormData {
  investment: string;
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber?: string;
  type?: 'interest' | 'principal' | 'mixed' | 'penalty' | 'bonus';
  interestAmount?: number;
  principalAmount?: number;
  penaltyAmount?: number;
  bonusAmount?: number;
  notes?: string;
  documentCategory?: 'receipt' | 'bank_statement' | 'cheque_copy' | 'upi_screenshot' | 'other';
  documentDescription?: string;
}

export interface CreateInvestorData extends Partial<Investor> {
  // User account creation fields
  createUserAccount?: boolean;
  userAccountDetails?: {
    password: string;
    confirmPassword: string;
    sendCredentials?: boolean;
    temporaryPassword?: boolean;
  };
}

// ================================
// STATISTICS & DASHBOARD TYPES
// ================================

export interface DashboardStats {
  totalInvestments: number;
  activeInvestments: number;
  completedInvestments: number;
  totalValue: number;
  totalPaid: number;
  remainingValue: number;
  overduePayments: number;
  averageInvestmentSize: number;
  documentStats?: any;
}

export interface InvestorStats {
  totalInvestors: number;
  activeInvestors: number;
  inactiveInvestors: number;
  newThisMonth: number;
  totalInvestment: number;
  averageInvestment: number;
  withUserAccounts: number;
  activeUserAccounts: number;
  userAccountPercentage: number;
}

export interface PaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
  thisMonthPayments: number;
  averagePayment: number;
  paymentsByMethod: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  documentsStats: Array<{
    _id: string;
    count: number;
  }>;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  plansByType: Array<{
    _id: string;
    count: number;
    averageRate: number;
  }>;
  plansByPaymentType: Array<{
    _id: string;
    count: number;
    averageRate: number;
  }>;
  mostPopularPlan: {
    _id: string;
    name: string;
    paymentType: string;
    investmentCount: number;
    totalInvestment: number;
  } | null;
}

// ================================
// SETTINGS TYPES
// ================================

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
}

export interface CompanySettings {
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: CompanyAddress;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface FinancialSettings {
  defaultCurrency: string;
  currencySymbol: string;
  financialYearStart: 'January' | 'April' | 'July' | 'October';
  interestCalculationMethod: 'daily' | 'monthly' | 'yearly';
  defaultLateFee: number;
  gracePeriodDays: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  paymentReminders: {
    enabled: boolean;
    daysBefore: number;
  };
  overdueAlerts: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  investmentMaturity: {
    enabled: boolean;
    daysBefore: number;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
}

export interface Settings {
  _id: string;
  company: CompanySettings;
  financial: FinancialSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  backup: BackupSettings;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// API & UTILITY TYPES
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  errors?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: any;
}

export interface SearchParams {
  query?: string;
  filters?: {
    [key: string]: any;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface FileUpload {
  file: File;
  category?: string;
  description?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  };
}

// ================================
// CALCULATION TYPES
// ================================

export interface CalculationResult {
  principalAmount: number;
  plan: {
    name: string;
    paymentType: string;
    interestType: string;
    interestRate: number;
    tenure: number;
  };
  calculations: {
    totalInterest: number;
    totalReturns: number;
    effectiveRate: number;
    paymentType: string;
  };
}

export interface ScheduleGeneration {
  plan: {
    name: string;
    paymentType: string;
    interestType: string;
    interestRate: number;
    tenure: number;
  };
  principalAmount: number;
  investmentDate: string;
  schedule: PaymentSchedule[];
}

// ================================
// USER ACCOUNT MANAGEMENT TYPES
// ================================

export interface UserAccountCreationResult {
  success: boolean;
  message: string;
  data: {
    investor: Investor;
    userAccountCreated: boolean;
    emailSent: boolean;
    userId?: string;
  };
}

export interface UserAccountManagement {
  userId?: string;
  emailSent: boolean;
}

export interface BulkUserAccountResult {
  successful: Array<{ investorId: string; userId: string; password?: string }>;
  failed: Array<{ investorId: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    emailsSent: number;
  };
}

// ================================
// VALIDATION TYPES
// ================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  validation?: ValidationRule;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
}

// ================================
// ERROR TYPES
// ================================

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface FormErrors {
  [fieldName: string]: string | string[];
}

// ================================
// CHART & REPORT TYPES
// ================================

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ReportData {
  summary: any;
  details: any[];
  charts: {
    [key: string]: ChartData[] | TimeSeriesData[];
  };
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    [key: string]: any;
  };
  generatedAt: string;
  generatedBy: string;
}

// ================================
// COMPONENT PROP TYPES
// ================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  testId?: string;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
  data?: any;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize?: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  onRow?: (record: T, index: number) => any;
}

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onOk?: () => void;
  width?: string | number;
  footer?: React.ReactNode;
  destroyOnClose?: boolean;
}

export interface FormProps<T = any> extends BaseComponentProps {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  schema?: FormSchema;
}

// ================================
// UTILITY HELPER TYPES
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateType<T> = Omit<T, '_id' | 'createdAt' | 'updatedAt'>;

export type UpdateType<T> = Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>;

// ================================
// DEFAULT EXPORTS
// ================================

export default {
  User,
  Investor,
  Plan,
  Investment,
  Payment,
  ApiResponse,
  PaginationParams,
  DashboardStats,
  InvestorStats,
  PaymentStats,
  PlanStats
};