// src/services/investors.ts - Complete Enhanced Investors Service
import api from './api';
import { Investor, ApiResponse, PaginationParams } from '../types';

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

export interface InvestorSummary {
  investor: Investor;
  totalInvested: number;
  totalReturns: number;
  pendingReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  recentPayments: any[];
  upcomingPayments: any[];
  documentsSummary: {
    total: number;
    byCategory: { [key: string]: number };
  };
}

export const investorsService = {
  // ================================
  // BASIC CRUD OPERATIONS
  // ================================

  // Get all investors with enhanced filtering
  async getInvestors(params?: PaginationParams & {
    status?: 'active' | 'inactive' | 'blocked';
    hasUserAccount?: boolean;
    kycStatus?: 'pending' | 'verified' | 'rejected';
    riskProfile?: 'conservative' | 'moderate' | 'aggressive';
    dateFrom?: string;
    dateTo?: string;
    minInvestment?: number;
    maxInvestment?: number;
  }): Promise<ApiResponse<Investor[]>> {
    return api.get('/investors', { params });
  },

  // Get single investor with detailed information
  async getInvestor(id: string): Promise<ApiResponse<Investor & {
    investments: any[];
    paymentSummary: {
      totalAmount: number;
      totalInterest: number;
      totalPrincipal: number;
      count: number;
    };
  }>> {
    return api.get(`/investors/${id}`);
  },

  // Create investor with optional user account
  async createInvestor(data: CreateInvestorData): Promise<UserAccountCreationResult> {
    return api.post('/investors', data);
  },

  // Update investor
  async updateInvestor(id: string, data: Partial<Investor>): Promise<ApiResponse<Investor>> {
    return api.put(`/investors/${id}`, data);
  },

  // Delete investor
  async deleteInvestor(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/investors/${id}`);
  },

  // ================================
  // USER ACCOUNT MANAGEMENT
  // ================================

  // Create user account for existing investor
  async createUserAccount(
    investorId: string, 
    credentials: {
      password: string;
      sendCredentials?: boolean;
      temporaryPassword?: boolean;
    }
  ): Promise<ApiResponse<UserAccountManagement>> {
    return api.post(`/investors/${investorId}/create-user-account`, credentials);
  },

  // Reset password for investor's user account
  async resetPassword(
    investorId: string,
    passwordData: {
      newPassword: string;
      sendCredentials?: boolean;
    }
  ): Promise<ApiResponse<UserAccountManagement>> {
    return api.post(`/investors/${investorId}/reset-password`, passwordData);
  },

  // Check if investor has user account
  async checkUserAccount(investorId: string): Promise<ApiResponse<{
    hasUserAccount: boolean;
    userId?: string;
    userEmail?: string;
    userStatus?: string;
    lastLogin?: string;
  }>> {
    const investor = await this.getInvestor(investorId);
    return {
      success: true,
      data: {
        hasUserAccount: !!investor.data.userId,
        userId: investor.data.userId,
        userEmail: investor.data.email,
        userStatus: investor.data.status
      }
    };
  },

  // Bulk create user accounts
  async bulkCreateUserAccounts(
    investorIds: string[],
    options: {
      generateTempPasswords?: boolean;
      sendCredentials?: boolean;
      passwordLength?: number;
    } = {}
  ): Promise<ApiResponse<{
    successful: Array<{ investorId: string; userId: string; password?: string }>;
    failed: Array<{ investorId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      emailsSent: number;
    };
  }>> {
    return api.post('/investors/bulk/create-user-accounts', {
      investorIds,
      options
    });
  },

  // Get investors without user accounts
  async getInvestorsWithoutUserAccounts(params?: PaginationParams): Promise<ApiResponse<Investor[]>> {
    return api.get('/investors', { 
      params: { 
        ...params,
        hasUserAccount: false 
      } 
    });
  },

  // ================================
  // DOCUMENT MANAGEMENT
  // ================================

  // Upload documents for investor
  async uploadDocuments(
    id: string, 
    files: File[],
    metadata?: {
      category?: 'agreement' | 'kyc' | 'legal' | 'other';
      description?: string;
    }
  ): Promise<ApiResponse<{
    uploaded: number;
    documents: any[];
  }>> {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }

    return api.post(`/investors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get investor documents
  async getInvestorDocuments(id: string, params?: {
    category?: string;
    includeInactive?: boolean;
  }): Promise<ApiResponse<any[]>> {
    return api.get(`/investors/${id}/documents`, { params });
  },

  // Delete investor document
  async deleteInvestorDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return api.delete(`/investors/${id}/documents/${documentId}`);
  },

  // ================================
  // STATISTICS & ANALYTICS
  // ================================

  // Get investor statistics
  async getStats(): Promise<ApiResponse<{
    totalInvestors: number;
    activeInvestors: number;
    inactiveInvestors: number;
    newThisMonth: number;
    totalInvestment: number;
    averageInvestment: number;
    withUserAccounts: number;
    activeUserAccounts: number;
    userAccountPercentage: number;
  }>> {
    return api.get('/investors/stats/overview');
  },

  // Get investor performance metrics
  async getInvestorPerformance(id: string): Promise<ApiResponse<{
    totalInvested: number;
    totalReturns: number;
    roi: number;
    averageInvestmentSize: number;
    investmentFrequency: number;
    riskScore: number;
    performance: 'above_average' | 'average' | 'below_average';
    trends: Array<{
      month: string;
      invested: number;
      returns: number;
    }>;
  }>> {
    return api.get(`/investors/${id}/performance`);
  },

  // Get portfolio summary for investor
  async getPortfolioSummary(investorId: string): Promise<ApiResponse<InvestorSummary>> {
    return api.get(`/investors/${investorId}/portfolio-summary`);
  },

  // Get investor investment summary with utility methods
  async getInvestmentSummary(id: string): Promise<ApiResponse<{
    totalInvestments: number;
    activeInvestments: number;
    completedInvestments: number;
    totalInvested: number;
    totalReturns: number;
    totalExpectedReturns: number;
    avgInvestmentSize: number;
    roi: number;
  }>> {
    return api.get(`/investors/${id}/investment-summary`);
  },

  // Get pending payments for investor
  async getPendingPayments(id: string): Promise<ApiResponse<number>> {
    const response = await api.get(`/investors/${id}/pending-payments`);
    return response;
  },

  // Get overdue payments for investor
  async getOverduePayments(id: string): Promise<ApiResponse<Array<{
    investmentId: string;
    month: number;
    dueDate: string;
    amount: number;
    daysPastDue: number;
  }>>> {
    return api.get(`/investors/${id}/overdue-payments`);
  },

  // Get upcoming payments for investor
  async getUpcomingPayments(id: string, days?: number): Promise<ApiResponse<Array<{
    investmentId: string;
    month: number;
    dueDate: string;
    amount: number;
    daysUntilDue: number;
  }>>> {
    return api.get(`/investors/${id}/upcoming-payments`, { params: { days } });
  },

  // ================================
  // KYC & COMPLIANCE
  // ================================

  // Update KYC status
  async updateKYCStatus(
    investorId: string,
    kycUpdate: {
      status: 'pending' | 'verified' | 'rejected';
      verifiedBy?: string;
      verificationDate?: string;
      notes?: string;
      documents?: string[];
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investors/${investorId}/kyc-status`, kycUpdate);
  },

  // Get compliance status
  async getComplianceStatus(investorId: string): Promise<ApiResponse<{
    kycStatus: 'pending' | 'verified' | 'rejected';
    amlStatus: 'clear' | 'flagged' | 'under_review';
    taxCompliance: 'compliant' | 'non_compliant' | 'pending';
    riskRating: 'low' | 'medium' | 'high';
    lastReviewDate?: string;
    nextReviewDate?: string;
    flags: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      createdAt: string;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/compliance-status`);
  },

  // Validate investor data for user account creation
  async validateForUserAccount(investorData: Partial<Investor>): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }>> {
    return api.post('/investors/validate-for-user-account', investorData);
  },

  // ================================
  // COMMUNICATION & ACTIVITY
  // ================================

  // Get user account activity for investor
  async getUserAccountActivity(investorId: string): Promise<ApiResponse<{
    lastLogin?: string;
    loginCount: number;
    investmentsViewed: number;
    paymentsViewed: number;
    documentsDownloaded: number;
    recentActivity: Array<{
      action: string;
      timestamp: string;
      details?: any;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/user-activity`);
  },

  // Send login instructions to investor
  async sendLoginInstructions(
    investorId: string,
    options: {
      includeResetLink?: boolean;
      customMessage?: string;
    } = {}
  ): Promise<ApiResponse<{ emailSent: boolean }>> {
    return api.post(`/investors/${investorId}/send-login-instructions`, options);
  },

  // Get communication history
  async getCommunicationHistory(investorId: string): Promise<ApiResponse<{
    emails: Array<{
      type: string;
      subject: string;
      sentAt: string;
      status: 'sent' | 'delivered' | 'opened' | 'failed';
      content?: string;
    }>;
    sms: Array<{
      type: string;
      message: string;
      sentAt: string;
      status: 'sent' | 'delivered' | 'failed';
    }>;
    notifications: Array<{
      type: string;
      title: string;
      message: string;
      sentAt: string;
      readAt?: string;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/communication-history`);
  },

  // Send custom communication to investor
  async sendCommunication(
    investorId: string,
    communication: {
      type: 'email' | 'sms' | 'notification';
      subject?: string;
      message: string;
      templateId?: string;
      variables?: { [key: string]: any };
      priority?: 'low' | 'normal' | 'high';
      scheduledFor?: string;
    }
  ): Promise<ApiResponse<{ 
    communicationId: string; 
    status: string; 
    scheduledFor?: string; 
  }>> {
    return api.post(`/investors/${investorId}/send-communication`, communication);
  },

  // ================================
  // PREFERENCES & SETTINGS
  // ================================

  // Get investor preferences
  async getInvestorPreferences(investorId: string): Promise<ApiResponse<{
    communication: {
      email: boolean;
      sms: boolean;
      notifications: boolean;
    };
    language: string;
    timezone: string;
    currency: string;
    reports: {
      frequency: 'monthly' | 'quarterly' | 'yearly';
      format: 'pdf' | 'excel';
      includeDocuments: boolean;
    };
  }>> {
    return api.get(`/investors/${investorId}/preferences`);
  },

  // Update investor preferences
  async updateInvestorPreferences(
    investorId: string,
    preferences: any
  ): Promise<ApiResponse<any>> {
    return api.put(`/investors/${investorId}/preferences`, preferences);
  },

  // ================================
  // RELATIONSHIP MANAGEMENT
  // ================================

  // Get relationship summary
  async getRelationshipSummary(investorId: string): Promise<ApiResponse<{
    relationshipStartDate: string;
    totalLifetimeValue: number;
    averageInvestmentSize: number;
    investmentFrequency: number;
    lastInteractionDate: string;
    satisfactionScore?: number;
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    preferredContactMethod: 'email' | 'phone' | 'sms';
    assignedRelationshipManager?: {
      id: string;
      name: string;
      email: string;
    };
    notes: Array<{
      id: string;
      content: string;
      createdBy: string;
      createdAt: string;
      category: 'general' | 'investment' | 'service' | 'complaint';
    }>;
  }>> {
    return api.get(`/investors/${investorId}/relationship-summary`);
  },

  // Add relationship note
  async addRelationshipNote(
    investorId: string,
    note: {
      content: string;
      category: 'general' | 'investment' | 'service' | 'complaint';
      priority?: 'low' | 'normal' | 'high';
      followUpDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investors/${investorId}/relationship-notes`, note);
  },

  // ================================
  // SEARCH & FILTERING
  // ================================

  // Advanced search for investors
  async searchInvestors(searchParams: {
    query?: string;
    filters?: {
      status?: string[];
      hasUserAccount?: boolean;
      dateRange?: { start: string; end: string };
      investmentRange?: { min: number; max: number };
      location?: {
        city?: string;
        state?: string;
        pincode?: string;
      };
      kycStatus?: string[];
      riskProfile?: string[];
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Investor[]>> {
    return api.post('/investors/search', searchParams);
  },

  // Get top investors by various metrics
  async getTopInvestors(criteria: {
    metric: 'investment_amount' | 'returns' | 'frequency' | 'roi';
    limit?: number;
    period?: 'month' | 'quarter' | 'year' | 'all';
  }): Promise<ApiResponse<Array<{
    investor: Investor;
    value: number;
    rank: number;
  }>>> {
    return api.get('/investors/top-investors', { params: criteria });
  },

  // ================================
  // BULK OPERATIONS
  // ================================

  // Bulk update investors
  async bulkUpdateInvestors(
    investorIds: string[],
    updates: {
      status?: string;
      riskProfile?: string;
      preferredContactMethod?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ investorId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.put('/investors/bulk-update', { investorIds, updates });
  },

  // Bulk communication
  async bulkCommunication(
    investorIds: string[],
    communication: {
      type: 'email' | 'sms' | 'notification';
      subject?: string;
      message: string;
      templateId?: string;
    }
  ): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ investorId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.post('/investors/bulk-communication', { investorIds, communication });
  },

  // ================================
  // EXPORT & IMPORT
  // ================================

  // Export investors data
  async exportInvestors(options: {
    format: 'csv' | 'excel' | 'pdf';
    includeUserAccounts?: boolean;
    includeInvestments?: boolean;
    includeDocuments?: boolean;
    filters?: any;
  }): Promise<Blob> {
    const response = await api.get('/investors/export', { 
      params: options,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Import investors from file
  async importInvestors(
    file: File,
    options: {
      createUserAccounts?: boolean;
      sendWelcomeEmails?: boolean;
      skipValidation?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: Array<{
      row: number;
      field?: string;
      error: string;
    }>;
    summary: {
      totalRows: number;
      processedRows: number;
      userAccountsCreated: number;
      emailsSent: number;
    };
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, String(options[key as keyof typeof options]));
    });

    return api.post('/investors/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // ================================
  // EMAIL TESTING & CONFIGURATION
  // ================================

  // Test email configuration
  async testEmail(email: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    messageId?: string;
    sentTo: string;
  }>> {
    return api.post('/investors/test-email', { email });
  },

  // ================================
  // UTILITY METHODS (Client-side)
  // ================================

  // Calculate total ROI for investor (client-side utility)
  calculateTotalROI(investor: Investor): number {
    if (investor.totalInvestment === 0) return 0;
    return Number(((investor.totalReturns / investor.totalInvestment) * 100).toFixed(2));
  },

  // Check if investor needs follow-up (client-side utility)
  needsFollowUp(investor: Investor): boolean {
    if (!investor.nextFollowUpDate) return false;
    return new Date() >= new Date(investor.nextFollowUpDate);
  },

  // Format investor full address (client-side utility)
  getFullAddress(investor: Investor): string {
    const addr = investor.address;
    if (!addr.street) return '';
    
    return [addr.street, addr.city, addr.state, addr.pincode, addr.country]
      .filter(Boolean)
      .join(', ');
  },

  // Check if KYC is complete (client-side utility)
  isKYCComplete(investor: Investor): boolean {
    return investor.kyc && 
           investor.kyc.panNumber && 
           investor.kyc.aadharNumber && 
           investor.kyc.bankDetails.accountNumber &&
           investor.kyc.verificationStatus === 'verified';
  },

  // Get investor risk level color (client-side utility)
  getRiskLevelColor(riskProfile: string): string {
    const colors = {
      conservative: 'green',
      moderate: 'yellow',
      aggressive: 'red'
    };
    return colors[riskProfile as keyof typeof colors] || 'gray';
  },

  // Format currency amount (client-side utility)
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }
};