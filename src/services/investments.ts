// src/services/investments.ts - Updated Investments Service
import api from './api';
import { Investment, ApiResponse, PaginationParams, CalculationResult } from '../types';

export const investmentsService = {
  // ================================
  // BASIC CRUD OPERATIONS
  // ================================

  async getInvestments(params?: PaginationParams & {
    status?: 'active' | 'completed' | 'closed' | 'defaulted';
    paymentType?: 'interest' | 'interestWithPrincipal';
    investor?: string;
    plan?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<Investment[]>> {
    return api.get('/investments', { params });
  },

  async getInvestment(id: string): Promise<ApiResponse<Investment>> {
    return api.get(`/investments/${id}`);
  },

  async createInvestment(data: {
    investor: string;
    plan: string;
    principalAmount: number;
    investmentDate?: string;
    notes?: string;
  }): Promise<ApiResponse<Investment>> {
    return api.post('/investments', data);
  },

  async updateInvestment(
    id: string, 
    data: {
      status?: 'active' | 'completed' | 'closed' | 'defaulted';
      notes?: string;
    }
  ): Promise<ApiResponse<Investment>> {
    return api.put(`/investments/${id}`, data);
  },

  // ================================
  // CALCULATION METHODS
  // ================================

  async calculateReturns(data: {
    planId: string;
    principalAmount: number;
  }): Promise<ApiResponse<CalculationResult>> {
    return api.post('/investments/calculate', data);
  },

  // ================================
  // PAYMENT SCHEDULE MANAGEMENT
  // ================================

  async getSchedule(id: string): Promise<ApiResponse<{
    investment: {
      investmentId: string;
      investor: any;
      plan: any;
      totalExpectedReturns: number;
      totalPaidAmount: number;
      remainingAmount: number;
    };
    schedule: any[];
  }>> {
    return api.get(`/investments/${id}/schedule`);
  },

  async updateSchedule(
    id: string,
    scheduleUpdates: Array<{
      month: number;
      dueDate?: string;
      amount?: number;
      notes?: string;
    }>
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/schedule`, { scheduleUpdates });
  },

  // ================================
  // DOCUMENT MANAGEMENT
  // ================================

  async getDocuments(id: string, params?: { 
    category?: 'agreement' | 'kyc' | 'payment_proof' | 'communication' | 'legal' | 'other' 
  }): Promise<ApiResponse<{
    investmentId: string;
    documents: any[];
    totalDocuments: number;
    documentsByCategory: { [key: string]: number };
  }>> {
    return api.get(`/investments/${id}/documents`, { params });
  },

  async uploadDocuments(
    id: string, 
    files: File[], 
    data: { 
      category: 'agreement' | 'kyc' | 'payment_proof' | 'communication' | 'legal' | 'other';
      description?: string;
    }
  ): Promise<ApiResponse<{
    uploadedCount: number;
    documents: any[];
  }>> {
    const formData = new FormData();
    
    // Append files
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    // Append metadata
    formData.append('category', data.category);
    if (data.description) {
      formData.append('description', data.description);
    }

    return api.post(`/investments/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async deleteDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return api.delete(`/investments/${id}/documents/${documentId}`);
  },

  async downloadDocument(id: string, documentId: string): Promise<Blob> {
    const response = await api.get(`/investments/${id}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ================================
  // TIMELINE MANAGEMENT
  // ================================

  async getTimeline(id: string): Promise<ApiResponse<{
    investmentId: string;
    timeline: any[];
    totalEntries: number;
  }>> {
    return api.get(`/investments/${id}/timeline`);
  },

  async addTimelineEntry(
    id: string, 
    data: {
      type: 'note_added' | 'communication' | 'status_changed' | 'other';
      description: string;
      amount?: number;
      metadata?: any;
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/timeline`, data);
  },

  // ================================
  // STATISTICS & REPORTING
  // ================================

  async getStats(): Promise<ApiResponse<{
    totalInvestments: number;
    activeInvestments: number;
    completedInvestments: number;
    totalValue: number;
    totalPaid: number;
    remainingValue: number;
    overduePayments: number;
    averageInvestmentSize: number;
    documentStats: any[];
  }>> {
    return api.get('/investments/stats/overview');
  },

  async getUpcomingDue(days?: number): Promise<ApiResponse<Array<{
    investmentId: string;
    investor: {
      id: string;
      investorId: string;
      name: string;
      email: string;
      phone: string;
    };
    plan: {
      id: string;
      name: string;
    };
    month: number;
    dueDate: string;
    totalAmount: number;
    interestAmount: number;
    principalAmount: number;
  }>>> {
    return api.get('/investments/due/upcoming', { params: { days } });
  },

  // ================================
  // INVESTMENT ANALYTICS
  // ================================

  async getInvestmentAnalytics(id: string): Promise<ApiResponse<{
    performance: {
      totalReturns: number;
      expectedReturns: number;
      roi: number;
      paymentTimeliness: number;
    };
    cashFlow: Array<{
      month: number;
      expected: number;
      actual: number;
      cumulative: number;
    }>;
    riskMetrics: {
      score: number;
      factors: string[];
      trends: any[];
    };
    comparisons: {
      vs_plan_average: number;
      vs_investor_average: number;
      vs_market_benchmark: number;
    };
  }>> {
    return api.get(`/investments/${id}/analytics`);
  },

  async getPortfolioAnalytics(investorId: string): Promise<ApiResponse<{
    summary: {
      totalInvestments: number;
      totalValue: number;
      totalReturns: number;
      avgROI: number;
    };
    diversification: {
      byPlan: any[];
      byRisk: any[];
      byTenure: any[];
    };
    performance: {
      monthlyTrends: any[];
      paymentHistory: any[];
      projections: any[];
    };
  }>> {
    return api.get(`/investors/${investorId}/portfolio-analytics`);
  },

  // ================================
  // INVESTMENT WORKFLOW
  // ================================

  async updateWorkflow(
    id: string,
    workflow: {
      stage: 'application' | 'verification' | 'approval' | 'active' | 'maturity' | 'closure';
      notes?: string;
      nextAction?: string;
      actionDueDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/workflow`, workflow);
  },

  async getWorkflowHistory(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/investments/${id}/workflow/history`);
  },

  // ================================
  // INVESTMENT NOTIFICATIONS
  // ================================

  async sendNotification(
    id: string,
    notification: {
      type: 'payment_reminder' | 'maturity_notice' | 'document_request' | 'status_update' | 'custom';
      message: string;
      channel: 'email' | 'sms' | 'both';
      priority?: 'low' | 'normal' | 'high';
      scheduledFor?: string;
    }
  ): Promise<ApiResponse<{
    notificationId: string;
    status: string;
    scheduledFor?: string;
  }>> {
    return api.post(`/investments/${id}/notifications`, notification);
  },

  async getNotificationHistory(id: string): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    message: string;
    channel: string;
    status: string;
    sentAt: string;
    deliveredAt?: string;
  }>>> {
    return api.get(`/investments/${id}/notifications`);
  },

  // ================================
  // RISK MANAGEMENT
  // ================================

  async updateRiskAssessment(
    id: string,
    riskData: {
      score: number;
      factors: string[];
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/risk-assessment`, riskData);
  },

  async getRiskAnalysis(id: string): Promise<ApiResponse<{
    currentRisk: {
      score: number;
      level: string;
      factors: string[];
    };
    riskTrends: Array<{
      date: string;
      score: number;
      factors: string[];
    }>;
    recommendations: string[];
    mitigation: Array<{
      risk: string;
      action: string;
      priority: string;
    }>;
  }>> {
    return api.get(`/investments/${id}/risk-analysis`);
  },

  // ================================
  // BULK OPERATIONS
  // ================================

  async bulkUpdateInvestments(
    investmentIds: string[],
    updates: {
      status?: string;
      notes?: string;
      riskScore?: number;
    }
  ): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.put('/investments/bulk', { investments: investmentIds, updates });
  },

  async bulkSendNotifications(
    investmentIds: string[],
    notification: {
      type: string;
      message: string;
      channel: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.post('/investments/bulk-notifications', { 
      investmentIds, 
      notification 
    });
  },

  // ================================
  // ADVANCED SEARCH & FILTERING
  // ================================

  async searchInvestments(searchParams: {
    query?: string;
    filters?: {
      status?: string[];
      paymentType?: string[];
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
      plans?: string[];
      investors?: string[];
      riskLevels?: string[];
      overdueOnly?: boolean;
      maturingSoon?: boolean;
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Investment[]>> {
    return api.post('/investments/search', searchParams);
  },

  // ================================
  // EXPORT & REPORTING
  // ================================

  async exportInvestments(options: {
    format: 'csv' | 'excel' | 'pdf';
    investmentIds?: string[];
    includeSchedule?: boolean;
    includeDocuments?: boolean;
    includeTimeline?: boolean;
    dateRange?: { start: string; end: string };
  }): Promise<Blob> {
    const response = await api.get('/investments/export', { 
      params: options,
      responseType: 'blob' 
    });
    return response.data;
  },

  async generateReport(
    id: string,
    reportType: 'summary' | 'detailed' | 'financial' | 'compliance' | 'performance'
  ): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/reports/${reportType}`);
  },

  async generatePortfolioReport(
    investorId: string,
    options?: {
      includeProjections?: boolean;
      includeDocuments?: boolean;
      format?: 'pdf' | 'excel';
      dateRange?: { start: string; end: string };
    }
  ): Promise<Blob> {
    const response = await api.post(`/investors/${investorId}/portfolio-report`, options, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ================================
  // COMPLIANCE & AUDIT
  // ================================

  async getComplianceStatus(id: string): Promise<ApiResponse<{
    kycStatus: 'pending' | 'verified' | 'rejected';
    amlStatus: 'pending' | 'cleared' | 'flagged';
    taxStatus: 'compliant' | 'non_compliant';
    documentStatus: 'complete' | 'incomplete';
    overallStatus: 'compliant' | 'non_compliant' | 'under_review';
    issues: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
  }>> {
    return api.get(`/investments/${id}/compliance`);
  },

  async updateComplianceStatus(
    id: string,
    compliance: {
      kycStatus?: 'pending' | 'verified' | 'rejected';
      amlStatus?: 'pending' | 'cleared' | 'flagged';
      taxStatus?: 'compliant' | 'non_compliant';
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/compliance`, compliance);
  },

  async getAuditTrail(id: string): Promise<ApiResponse<Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    details: any;
    ipAddress?: string;
  }>>> {
    return api.get(`/investments/${id}/audit-trail`);
  },

  // ================================
  // PERFORMANCE TRACKING
  // ================================

  async getROIAnalysis(id: string): Promise<ApiResponse<{
    currentROI: number;
    projectedROI: number;
    benchmarkROI: number;
    performance: 'above' | 'at' | 'below';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
  }>> {
    return api.get(`/investments/${id}/roi-analysis`);
  },

  async getPerformanceComparison(
    id: string,
    benchmarks: string[]
  ): Promise<ApiResponse<{
    investment: any;
    comparisons: Array<{
      benchmark: string;
      performance: number;
      difference: number;
      percentile: number;
    }>;
    summary: {
      rank: number;
      totalComparisons: number;
      outperformingBenchmarks: number;
    };
  }>> {
    return api.post(`/investments/${id}/performance-comparison`, { benchmarks });
  },

  // ================================
  // AUTOMATED ACTIONS
  // ================================

  async setupAutomatedActions(
    id: string,
    actions: Array<{
      trigger: 'payment_due' | 'payment_overdue' | 'maturity_approaching' | 'document_expiry' | 'risk_threshold';
      condition: any;
      action: 'send_notification' | 'generate_report' | 'update_status' | 'create_task' | 'escalate';
      parameters: any;
      isActive: boolean;
    }>
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/automated-actions`, { actions });
  },

  async getAutomatedActions(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/investments/${id}/automated-actions`);
  },

  // ================================
  // INTEGRATION WITH EXTERNAL SYSTEMS
  // ================================

  async syncWithExternalSystem(
    id: string,
    system: 'bank' | 'accounting' | 'crm' | 'regulatory',
    action: 'sync' | 'validate' | 'update'
  ): Promise<ApiResponse<{
    success: boolean;
    recordsProcessed: number;
    errors: any[];
    lastSyncAt: string;
  }>> {
    return api.post(`/investments/${id}/sync/${system}`, { action });
  },

  // ================================
  // INVESTMENT PLANNING & PROJECTIONS
  // ================================

  async getMaturityProjections(id: string): Promise<ApiResponse<{
    maturityDate: string;
    projectedReturns: number;
    riskAdjustedReturns: number;
    scenarios: Array<{
      scenario: 'optimistic' | 'realistic' | 'pessimistic';
      projectedValue: number;
      probability: number;
    }>;
    recommendations: string[];
  }>> {
    return api.get(`/investments/${id}/maturity-projections`);
  },

  async getReinvestmentOptions(id: string): Promise<ApiResponse<{
    availablePlans: any[];
    recommendations: Array<{
      plan: any;
      reasoning: string;
      projectedReturns: number;
      riskLevel: string;
    }>;
    marketConditions: {
      outlook: string;
      factors: string[];
    };
  }>> {
    return api.get(`/investments/${id}/reinvestment-options`);
  },

  // ================================
  // COMMUNICATION & CUSTOMER SERVICE
  // ================================

  async getCommunicationHistory(id: string): Promise<ApiResponse<{
    emails: any[];
    calls: any[];
    meetings: any[];
    documents: any[];
    timeline: any[];
  }>> {
    return api.get(`/investments/${id}/communication-history`);
  },

  async logCommunication(
    id: string,
    communication: {
      type: 'email' | 'call' | 'meeting' | 'message';
      subject?: string;
      content: string;
      participants?: string[];
      followUpRequired?: boolean;
      followUpDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/communications`, communication);
  }
};