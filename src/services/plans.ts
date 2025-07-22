// src/services/plans.ts - Updated Plans Service
import api from './api';
import { Plan, ApiResponse, PaginationParams, CalculationResult, ScheduleGeneration } from '../types';

export const plansService = {
  // ================================
  // BASIC CRUD OPERATIONS
  // ================================

  async getPlans(params?: PaginationParams & {
    interestType?: 'flat' | 'reducing';
    paymentType?: 'interest' | 'interestWithPrincipal';
    isActive?: string;
  }): Promise<ApiResponse<Plan[]>> {
    return api.get('/plans', { params });
  },

  async getActivePlans(): Promise<ApiResponse<Plan[]>> {
    return api.get('/plans/active');
  },

  async getPlan(id: string): Promise<ApiResponse<Plan>> {
    return api.get(`/plans/${id}`);
  },

  async createPlan(data: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return api.post('/plans', data);
  },

  async updatePlan(id: string, data: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return api.put(`/plans/${id}`, data);
  },

  async deletePlan(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/plans/${id}`);
  },

  // ================================
  // CALCULATION METHODS
  // ================================

  async calculateReturns(id: string, principalAmount: number): Promise<ApiResponse<CalculationResult>> {
    return api.post(`/plans/${id}/calculate`, { principalAmount });
  },

  async generateSchedule(
    id: string, 
    data: { 
      principalAmount: number; 
      investmentDate?: string; 
    }
  ): Promise<ApiResponse<ScheduleGeneration>> {
    return api.post(`/plans/${id}/generate-schedule`, data);
  },

  // ================================
  // STATISTICS & REPORTING
  // ================================

  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/plans/stats/overview');
  },

  async getPlanPerformance(): Promise<ApiResponse<any[]>> {
    return api.get('/plans/performance');
  },

  // ================================
  // PLAN CONFIGURATION HELPERS
  // ================================

  // Validate plan configuration based on payment type
  async validatePlanConfig(planData: {
    paymentType: 'interest' | 'interestWithPrincipal';
    interestPayment?: any;
    interestWithPrincipalPayment?: any;
    [key: string]: any;
  }): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }>> {
    return api.post('/plans/validate-config', planData);
  },

  // Get plan templates for quick setup
  async getPlanTemplates(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    paymentType: string;
    category: 'conservative' | 'moderate' | 'aggressive';
    template: Partial<Plan>;
  }>>> {
    return api.get('/plans/templates');
  },

  async createPlanFromTemplate(templateId: string, customizations?: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return api.post(`/plans/templates/${templateId}/create`, customizations);
  },

  // ================================
  // INTEREST PAYMENT SPECIFIC METHODS
  // ================================

  // Calculate interest-only returns with different configurations
  async calculateInterestReturns(
    planId: string,
    config: {
      principalAmount: number;
      interestFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
      principalRepaymentOption: 'fixed' | 'flexible';
      withdrawalAfterPercentage?: number;
      principalSettlementTerm?: number;
    }
  ): Promise<ApiResponse<CalculationResult>> {
    return api.post(`/plans/${planId}/calculate-interest`, config);
  },

  // ================================
  // INTEREST WITH PRINCIPAL SPECIFIC METHODS
  // ================================

  // Calculate interest with principal returns
  async calculateInterestWithPrincipalReturns(
    planId: string,
    config: {
      principalAmount: number;
      principalRepaymentPercentage: number;
      paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
    }
  ): Promise<ApiResponse<CalculationResult>> {
    return api.post(`/plans/${planId}/calculate-interest-principal`, config);
  },

  // ================================
  // PLAN COMPARISON & ANALYSIS
  // ================================

  // Compare multiple plans for a given investment amount
  async comparePlans(
    planIds: string[],
    principalAmount: number
  ): Promise<ApiResponse<{
    principalAmount: number;
    comparisons: Array<{
      plan: Plan;
      calculations: CalculationResult['calculations'];
      ranking: number;
      advantages: string[];
      disadvantages: string[];
    }>;
    bestForScenarios: {
      maxReturns: string;
      maxFlexibility: string;
      maxSecurity: string;
    };
  }>> {
    return api.post('/plans/compare', { planIds, principalAmount });
  },

  // Get plan recommendations based on investor profile
  async getRecommendedPlans(criteria: {
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    investmentAmount: number;
    investmentPeriod: number;
    liquidity: 'high' | 'medium' | 'low';
    experience: 'beginner' | 'intermediate' | 'expert';
  }): Promise<ApiResponse<{
    recommended: Plan[];
    reasons: { [planId: string]: string[] };
    alternatives: Plan[];
  }>> {
    return api.post('/plans/recommendations', criteria);
  },

  // ================================
  // PLAN VERSIONING & HISTORY
  // ================================

  // Get plan version history
  async getPlanHistory(id: string): Promise<ApiResponse<Array<{
    version: number;
    changes: any;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>>> {
    return api.get(`/plans/${id}/history`);
  },

  // Create new version of plan
  async createPlanVersion(
    id: string,
    changes: Partial<Plan>,
    reason?: string
  ): Promise<ApiResponse<Plan>> {
    return api.post(`/plans/${id}/versions`, { changes, reason });
  },

  // Revert to previous version
  async revertPlanVersion(id: string, version: number): Promise<ApiResponse<Plan>> {
    return api.post(`/plans/${id}/revert/${version}`);
  },

  // ================================
  // PLAN USAGE & ANALYTICS
  // ================================

  // Get plan usage analytics
  async getPlanAnalytics(id: string, dateRange?: {
    start: string;
    end: string;
  }): Promise<ApiResponse<{
    totalInvestments: number;
    totalAmount: number;
    averageInvestment: number;
    investmentTrends: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
    investorDemographics: {
      byRiskProfile: any[];
      byExperience: any[];
      byLocation: any[];
    };
    performance: {
      averageROI: number;
      completionRate: number;
      paymentTimeliness: number;
    };
  }>> {
    return api.get(`/plans/${id}/analytics`, { params: dateRange });
  },

  // Get popular plan features
  async getPopularFeatures(): Promise<ApiResponse<{
    paymentTypes: Array<{ type: string; percentage: number }>;
    interestTypes: Array<{ type: string; percentage: number }>;
    tenureRanges: Array<{ range: string; percentage: number }>;
    riskLevels: Array<{ level: string; percentage: number }>;
  }>> {
    return api.get('/plans/popular-features');
  },

  // ================================
  // PLAN COPY & DUPLICATION
  // ================================

  // Copy plan with modifications
  async copyPlan(
    id: string,
    modifications: {
      name: string;
      description?: string;
      adjustments?: {
        interestRate?: number;
        tenure?: number;
        minInvestment?: number;
        maxInvestment?: number;
      };
    }
  ): Promise<ApiResponse<Plan>> {
    return api.post(`/plans/${id}/copy`, modifications);
  },

  // Bulk copy plans
  async bulkCopyPlans(
    planIds: string[],
    modifications: {
      namePrefix?: string;
      nameSuffix?: string;
      adjustments?: any;
    }
  ): Promise<ApiResponse<{
    successful: Plan[];
    failed: Array<{ planId: string; error: string }>;
  }>> {
    return api.post('/plans/bulk-copy', { planIds, modifications });
  },

  // ================================
  // PLAN SEARCH & FILTERING
  // ================================

  // Advanced plan search
  async searchPlans(searchParams: {
    query?: string;
    filters?: {
      paymentType?: string[];
      interestType?: string[];
      riskLevel?: string[];
      tenureRange?: { min: number; max: number };
      rateRange?: { min: number; max: number };
      investmentRange?: { min: number; max: number };
      isActive?: boolean;
      hasActiveInvestments?: boolean;
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Plan[]>> {
    return api.post('/plans/search', searchParams);
  },

  // ================================
  // PLAN EXPORT & IMPORT
  // ================================

  // Export plans
  async exportPlans(options: {
    format: 'csv' | 'excel' | 'pdf';
    includeInactive?: boolean;
    includeStatistics?: boolean;
    planIds?: string[];
  }): Promise<Blob> {
    const response = await api.get('/plans/export', { 
      params: options,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Import plans from file
  async importPlans(
    file: File,
    options: {
      skipValidation?: boolean;
      activateAfterImport?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ApiResponse<{
    successful: Plan[];
    failed: Array<{
      row: number;
      data: any;
      error: string;
    }>;
    summary: {
      totalRows: number;
      successfulRows: number;
      failedRows: number;
      plansCreated: number;
    };
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, String(options[key as keyof typeof options]));
    });

    return api.post('/plans/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // ================================
  // PLAN VALIDATION & COMPLIANCE
  // ================================

  // Validate plan compliance with regulations
  async validatePlanCompliance(id: string): Promise<ApiResponse<{
    isCompliant: boolean;
    violations: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
    score: number;
    lastChecked: string;
  }>> {
    return api.get(`/plans/${id}/compliance`);
  },

  // Bulk compliance check
  async bulkComplianceCheck(planIds?: string[]): Promise<ApiResponse<{
    compliant: string[];
    nonCompliant: Array<{
      planId: string;
      violations: any[];
    }>;
    summary: {
      total: number;
      compliant: number;
      nonCompliant: number;
      averageScore: number;
    };
  }>> {
    return api.post('/plans/bulk-compliance', { planIds });
  },

  // ================================
  // PLAN AUTOMATION
  // ================================

  // Setup automated plan adjustments
  async setupPlanAutomation(
    id: string,
    rules: Array<{
      trigger: 'market_change' | 'performance_threshold' | 'date_based' | 'competition';
      condition: any;
      action: 'adjust_rate' | 'modify_terms' | 'activate' | 'deactivate' | 'notify';
      parameters: any;
      isActive: boolean;
    }>
  ): Promise<ApiResponse<any>> {
    return api.put(`/plans/${id}/automation`, { rules });
  },

  async getPlanAutomation(id: string): Promise<ApiResponse<any>> {
    return api.get(`/plans/${id}/automation`);
  },

  // ================================
  // PLAN INTEGRATION
  // ================================

  // Sync with external systems
  async syncWithExternalSystem(
    id: string,
    system: 'regulatory' | 'market_data' | 'competitor_analysis',
    action: 'sync' | 'validate' | 'update'
  ): Promise<ApiResponse<any>> {
    return api.post(`/plans/${id}/sync/${system}`, { action });
  }
};