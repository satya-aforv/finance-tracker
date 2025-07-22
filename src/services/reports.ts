// src/services/reports.ts - Enhanced Reports Service
import api from './api';
import { ApiResponse } from '../types';

export const reportsService = {
  // ================================
  // DASHBOARD REPORTS
  // ================================

  // Get comprehensive dashboard report
  async getDashboardReport(): Promise<ApiResponse<{
    summary: {
      totalInvestments: number;
      totalInvestors: number;
      totalPlans: number;
      totalPayments: number;
    };
    monthlyInvestments: Array<{
      _id: { year: number; month: number };
      count: number;
      totalAmount: number;
    }>;
    monthlyPayments: Array<{
      _id: { year: number; month: number };
      count: number;
      totalAmount: number;
    }>;
    planWiseData: Array<{
      _id: string;
      planName: string;
      count: number;
      totalAmount: number;
    }>;
    statusWiseData: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
  }>> {
    return api.get('/reports/dashboard');
  },

  // ================================
  // INVESTOR REPORTS
  // ================================

  // Get investor summary report
  async getInvestorSummary(params?: {
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'inactive' | 'blocked';
  }): Promise<ApiResponse<Array<{
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    totalInvestments: number;
    totalInvestedAmount: number;
    totalExpectedReturns: number;
    totalPaymentsReceived: number;
    remainingAmount: number;
    activeInvestments: number;
    completedInvestments: number;
  }>>> {
    return api.get('/reports/investor-summary', { params });
  },

  // Get investor performance analysis
  async getInvestorPerformanceAnalysis(params?: {
    investorId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<{
    summary: {
      totalInvestors: number;
      averageInvestment: number;
      averageReturns: number;
      retentionRate: number;
    };
    topPerformers: Array<{
      investorId: string;
      name: string;
      totalReturns: number;
      roi: number;
      investmentCount: number;
    }>;
    investmentTrends: Array<{
      period: string;
      newInvestors: number;
      totalInvestment: number;
      averageTicketSize: number;
    }>;
    riskAnalysis: Array<{
      riskLevel: string;
      investorCount: number;
      averageInvestment: number;
      defaultRate: number;
    }>;
  }>> {
    return api.get('/reports/investor-performance', { params });
  },

  // ================================
  // PLAN PERFORMANCE REPORTS
  // ================================

  // Get plan performance report
  async getPlanPerformance(): Promise<ApiResponse<Array<{
    _id: string;
    planId: string;
    name: string;
    interestType: string;
    interestRate: number;
    tenure: number;
    isActive: boolean;
    totalInvestors: number;
    totalInvestment: number;
    totalExpectedReturns: number;
    activeInvestments: number;
    completedInvestments: number;
    averageInvestmentSize: number;
  }>>> {
    return api.get('/reports/plan-performance');
  },

  // Get plan comparison analysis
  async getPlanComparisonAnalysis(params?: {
    planIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    comparisons: Array<{
      plan: {
        id: string;
        name: string;
        interestRate: number;
        paymentType: string;
      };
      metrics: {
        totalInvestments: number;
        totalAmount: number;
        averageInvestment: number;
        completionRate: number;
        defaultRate: number;
        roi: number;
      };
      ranking: number;
      trends: Array<{
        month: string;
        investments: number;
        amount: number;
      }>;
    }>;
    summary: {
      bestPerformingPlan: string;
      mostPopularPlan: string;
      highestROIPlan: string;
      totalPlansAnalyzed: number;
    };
  }>> {
    return api.get('/reports/plan-comparison', { params });
  },

  // ================================
  // PAYMENT ANALYSIS REPORTS
  // ================================

  // Get payment analysis report
  async getPaymentAnalysis(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'method' | 'status' | 'month' | 'investor';
  }): Promise<ApiResponse<{
    paymentsByMethod: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    paymentsByStatus: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    monthlyPayments: Array<{
      _id: { year: number; month: number };
      count: number;
      totalAmount: number;
      interestAmount: number;
      principalAmount: number;
    }>;
    overdueAnalysis: Array<{
      investmentId: string;
      investor: {
        _id: string;
        investorId: string;
        name: string;
        email: string;
        phone: string;
      };
      month: number;
      dueDate: string;
      totalAmount: number;
      paidAmount: number;
      overdueAmount: number;
      daysPastDue: number;
    }>;
  }>> {
    return api.get('/reports/payment-analysis', { params });
  },

  // Get payment collection efficiency
  async getPaymentCollectionEfficiency(params?: {
    startDate?: string;
    endDate?: string;
    planId?: string;
    investorId?: string;
  }): Promise<ApiResponse<{
    summary: {
      totalDue: number;
      totalCollected: number;
      collectionRate: number;
      averageDelayDays: number;
      overdueAmount: number;
    };
    trends: Array<{
      month: string;
      due: number;
      collected: number;
      collectionRate: number;
      overdueAmount: number;
    }>;
    methodWiseEfficiency: Array<{
      method: string;
      collectionRate: number;
      averageDelayDays: number;
      totalAmount: number;
    }>;
    investorWiseEfficiency: Array<{
      investorId: string;
      name: string;
      collectionRate: number;
      totalDue: number;
      totalCollected: number;
      overdueAmount: number;
    }>;
  }>> {
    return api.get('/reports/payment-collection-efficiency', { params });
  },

  // ================================
  // OVERDUE & DELINQUENCY REPORTS
  // ================================

  // Get overdue payments report
  async getOverduePayments(): Promise<ApiResponse<Array<{
    investmentId: string;
    investor: {
      _id: string;
      investorId: string;
      name: string;
      email: string;
      phone: string;
    };
    plan: {
      name: string;
    };
    month: number;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    overdueAmount: number;
    daysPastDue: number;
  }>>> {
    return api.get('/reports/overdue-payments');
  },

  // Get delinquency analysis
  async getDelinquencyAnalysis(params?: {
    startDate?: string;
    endDate?: string;
    riskThreshold?: number;
  }): Promise<ApiResponse<{
    summary: {
      totalOverdueAmount: number;
      overdueInvestments: number;
      worstDelinquents: number;
      averageDelayDays: number;
    };
    delinquencyBuckets: Array<{
      bucket: string; // 0-30, 31-60, 61-90, 90+
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
    riskCategories: Array<{
      category: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      totalAmount: number;
      averageDays: number;
    }>;
    trends: Array<{
      month: string;
      overdueAmount: number;
      overdueCount: number;
      newDelinquents: number;
      resolved: number;
    }>;
    topDelinquents: Array<{
      investorId: string;
      name: string;
      totalOverdue: number;
      oldestOverdue: number;
      riskScore: number;
    }>;
  }>> {
    return api.get('/reports/delinquency-analysis', { params });
  },

  // ================================
  // FINANCIAL REPORTS
  // ================================

  // Get financial overview report
  async getFinancialOverview(params?: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  }): Promise<ApiResponse<{
    summary: {
      totalAssets: number;
      totalLiabilities: number;
      netWorth: number;
      liquidAssets: number;
      portfolioValue: number;
    };
    cashFlow: {
      inflows: Array<{
        month: string;
        amount: number;
        source: 'investments' | 'interest' | 'fees';
      }>;
      outflows: Array<{
        month: string;
        amount: number;
        purpose: 'principal_return' | 'interest_payment' | 'expenses';
      }>;
      netCashFlow: Array<{
        month: string;
        amount: number;
      }>;
    };
    profitability: {
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
      returnOnAssets: number;
      returnOnEquity: number;
    };
    riskMetrics: {
      portfolioRisk: number;
      concentrationRisk: number;
      liquidityRisk: number;
      creditRisk: number;
    };
  }>> {
    return api.get('/reports/financial-overview', { params });
  },

  // Get portfolio analysis
  async getPortfolioAnalysis(params?: {
    asOfDate?: string;
    includeProjections?: boolean;
  }): Promise<ApiResponse<{
    overview: {
      totalPortfolioValue: number;
      totalInvested: number;
      totalReturns: number;
      portfolioYield: number;
      weightedAverageMaturity: number;
    };
    diversification: {
      byPlan: Array<{
        planName: string;
        allocation: number;
        value: number;
        yield: number;
      }>;
      byRisk: Array<{
        riskLevel: string;
        allocation: number;
        value: number;
        yield: number;
      }>;
      byMaturity: Array<{
        maturityBucket: string;
        allocation: number;
        value: number;
        yield: number;
      }>;
    };
    performance: {
      monthlyReturns: Array<{
        month: string;
        returns: number;
        yield: number;
      }>;
      comparison: {
        vsMarket: number;
        vsBenchmark: number;
        volatility: number;
        sharpeRatio: number;
      };
    };
    projections?: {
      nextMonthReturns: number;
      nextQuarterReturns: number;
      yearEndProjection: number;
      maturitySchedule: Array<{
        month: string;
        maturingAmount: number;
        expectedReturns: number;
      }>;
    };
  }>> {
    return api.get('/reports/portfolio-analysis', { params });
  },

  // ================================
  // REGULATORY & COMPLIANCE REPORTS
  // ================================

  // Get compliance report
  async getComplianceReport(params?: {
    reportType?: 'regulatory' | 'internal' | 'audit';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    overview: {
      complianceScore: number;
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
      warningCount: number;
    };
    kycCompliance: {
      totalInvestors: number;
      verifiedInvestors: number;
      pendingVerification: number;
      rejectedApplications: number;
      expiringDocuments: number;
    };
    amlCompliance: {
      screenedTransactions: number;
      flaggedTransactions: number;
      investigatedCases: number;
      resolvedCases: number;
    };
    riskAssessment: {
      lowRiskInvestors: number;
      mediumRiskInvestors: number;
      highRiskInvestors: number;
      riskReviewsDue: number;
    };
    documentCompliance: {
      completeDocuments: number;
      incompleteDocuments: number;
      missingDocuments: number;
      expiredDocuments: number;
    };
    violations: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      count: number;
      description: string;
      recommendedAction: string;
    }>;
  }>> {
    return api.get('/reports/compliance', { params });
  },

  // ================================
  // CUSTOM & ADVANCED REPORTS
  // ================================

  // Generate custom report
  async generateCustomReport(config: {
    reportName: string;
    dataSource: 'investments' | 'investors' | 'payments' | 'plans';
    filters?: {
      dateRange?: { start: string; end: string };
      status?: string[];
      categories?: string[];
      amountRange?: { min: number; max: number };
    };
    groupBy?: string[];
    aggregations?: Array<{
      field: string;
      operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    }>;
    sortBy?: {
      field: string;
      order: 'asc' | 'desc';
    };
    format?: 'table' | 'chart' | 'summary';
  }): Promise<ApiResponse<any>> {
    return api.post('/reports/custom', config);
  },

  // Get saved reports
  async getSavedReports(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    createdBy: string;
    createdAt: string;
    lastRun?: string;
    parameters: any;
    isScheduled: boolean;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
    };
  }>>> {
    return api.get('/reports/saved');
  },

  // Save report configuration
  async saveReport(config: {
    name: string;
    description?: string;
    type: string;
    parameters: any;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
    };
  }): Promise<ApiResponse<any>> {
    return api.post('/reports/save', config);
  },

  // Run saved report
  async runSavedReport(reportId: string, parameters?: any): Promise<ApiResponse<any>> {
    return api.post(`/reports/saved/${reportId}/run`, { parameters });
  },

  // ================================
  // EXPORT FUNCTIONS
  // ================================

  // Export data in various formats
  async exportData(
    type: 'investors' | 'investments' | 'payments' | 'plans',
    options?: {
      format?: 'csv' | 'excel' | 'pdf';
      filters?: any;
      columns?: string[];
    }
  ): Promise<Blob> {
    const response = await api.get(`/reports/export/${type}`, {
      params: options,
      responseType: 'blob'
    });
    return response.data;
  },

  // Export specific report
  async exportReport(
    reportType: string,
    format: 'csv' | 'excel' | 'pdf' = 'excel',
    params?: any
  ): Promise<Blob> {
    const response = await api.get(`/reports/${reportType}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // ================================
  // SCHEDULED REPORTS
  // ================================

  // Get scheduled reports
  async getScheduledReports(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    reportType: string;
    schedule: {
      frequency: string;
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    };
    recipients: string[];
    isActive: boolean;
    lastRun?: string;
    nextRun: string;
  }>>> {
    return api.get('/reports/scheduled');
  },

  // Create scheduled report
  async createScheduledReport(config: {
    name: string;
    reportType: string;
    parameters: any;
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    };
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  }): Promise<ApiResponse<any>> {
    return api.post('/reports/scheduled', config);
  },

  // Update scheduled report
  async updateScheduledReport(id: string, config: any): Promise<ApiResponse<any>> {
    return api.put(`/reports/scheduled/${id}`, config);
  },

  // Delete scheduled report
  async deleteScheduledReport(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/reports/scheduled/${id}`);
  },

  // ================================
  // REPORT ANALYTICS
  // ================================

  // Get report usage analytics
  async getReportAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    mostUsedReports: Array<{
      reportType: string;
      usageCount: number;
      lastUsed: string;
    }>;
    userActivity: Array<{
      userId: string;
      userName: string;
      reportsGenerated: number;
      lastActivity: string;
    }>;
    systemUsage: {
      totalReportsGenerated: number;
      averageGenerationTime: number;
      peakUsageHours: Array<{
        hour: number;
        count: number;
      }>;
    };
  }>> {
    return api.get('/reports/analytics', { params });
  }
};