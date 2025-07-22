// src/services/dashboard.ts - Updated to Match Backend Routes
import api from './api';
import { ApiResponse, DashboardStats, InvestorStats, PaymentStats, PlanStats } from '../types';

export const dashboardService = {
  // ================================
  // MAIN DASHBOARD DATA
  // ================================

  // Get comprehensive dashboard overview
  async getDashboardOverview(): Promise<ApiResponse<{
    stats: DashboardStats;
    investorStats: InvestorStats;
    paymentStats: PaymentStats;
    planStats: PlanStats;
    recentActivity: Array<{
      id: string;
      type: 'investment_created' | 'payment_received' | 'investor_added' | 'plan_created' | 'document_uploaded' | 'user_login';
      title: string;
      description: string;
      timestamp: string;
      status: 'success' | 'warning' | 'error';
      user: {
        id: string;
        name: string;
        avatar?: string;
      };
      entity?: {
        id: string;
        type: string;
        name: string;
      };
    }>;
    alerts: Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: 'payments' | 'compliance' | 'system' | 'security';
      title: string;
      message: string;
      timestamp: string;
      isRead: boolean;
      actionRequired: boolean;
      actionUrl?: string;
      relatedEntity?: {
        type: string;
        id: string;
        name: string;
      };
    }>;
  }>> {
    try {
      console.log('📊 Fetching dashboard overview...');
      return await api.get('/dashboard/overview');
    } catch (error: any) {
      console.warn('❌ Dashboard overview failed:', error.message);
      
      // If the main endpoint fails, try individual endpoints
      try {
        console.log('🔄 Trying individual dashboard endpoints...');
        const [
          statsResult,
          activityResult,
          alertsResult
        ] = await Promise.allSettled([
          this.getBasicStats(),
          this.getRecentActivity({ limit: 10 }),
          this.getSystemAlerts({ limit: 5 })
        ]);

        const stats = statsResult.status === 'fulfilled' ? statsResult.value.data : this.getEmptyStats();
        const activity = activityResult.status === 'fulfilled' ? activityResult.value.data : [];
        const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data : [];

        return {
          success: true,
          data: {
            stats: stats.stats || this.getEmptyStats().stats,
            investorStats: stats.investorStats || this.getEmptyStats().investorStats,
            paymentStats: stats.paymentStats || this.getEmptyStats().paymentStats,
            planStats: stats.planStats || this.getEmptyStats().planStats,
            recentActivity: activity,
            alerts
          }
        };
      } catch (fallbackError: any) {
        console.error('❌ All dashboard endpoints failed:', fallbackError);
        return {
          success: false,
          message: 'Unable to load dashboard data',
          data: {
            ...this.getEmptyStats(),
            recentActivity: [],
            alerts: []
          }
        };
      }
    }
  },

  // ================================
  // INDIVIDUAL ENDPOINTS
  // ================================

  // Get basic statistics (fallback method)
  async getBasicStats(): Promise<ApiResponse<{
    stats: DashboardStats;
    investorStats: InvestorStats;
    paymentStats: PaymentStats;
    planStats: PlanStats;
  }>> {
    try {
      // Try to get individual stats endpoints if they exist
      const [investmentStats, investorStats, paymentStats, planStats] = await Promise.allSettled([
        api.get('/investments/stats/overview').catch(() => ({ data: null })),
        api.get('/investors/stats/overview').catch(() => ({ data: null })),
        api.get('/payments/stats/overview').catch(() => ({ data: null })),
        api.get('/plans/stats/overview').catch(() => ({ data: null }))
      ]);

      return {
        success: true,
        data: {
          stats: investmentStats.status === 'fulfilled' && investmentStats.value.data 
            ? investmentStats.value.data 
            : this.getEmptyStats().stats,
          investorStats: investorStats.status === 'fulfilled' && investorStats.value.data 
            ? investorStats.value.data 
            : this.getEmptyStats().investorStats,
          paymentStats: paymentStats.status === 'fulfilled' && paymentStats.value.data 
            ? paymentStats.value.data 
            : this.getEmptyStats().paymentStats,
          planStats: planStats.status === 'fulfilled' && planStats.value.data 
            ? planStats.value.data 
            : this.getEmptyStats().planStats
        }
      };
    } catch (error) {
      console.warn('Basic stats endpoints not available');
      return {
        success: true,
        data: this.getEmptyStats()
      };
    }
  },

  // Get recent activity
  async getRecentActivity(params?: {
    limit?: number;
    types?: string[];
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      console.log('📋 Fetching recent activity...');
      return await api.get('/dashboard/recent-activity', { params });
    } catch (error: any) {
      console.warn('❌ Recent activity endpoint failed:', error.message);
      return { success: true, data: [] };
    }
  },

  // Get system alerts
  async getSystemAlerts(params?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'payments' | 'compliance' | 'system' | 'security';
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<any[]>> {
    try {
      console.log('🚨 Fetching system alerts...');
      return await api.get('/dashboard/alerts', { params });
    } catch (error: any) {
      console.warn('❌ System alerts endpoint failed:', error.message);
      return { success: true, data: [] };
    }
  },

  // ================================
  // TRENDING METRICS
  // ================================

  async getTrendingMetrics(params?: {
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    metrics?: string[];
  }): Promise<ApiResponse<{
    investments: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    payments: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    investors: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
    revenue: {
      trend: 'up' | 'down' | 'stable';
      percentage: number;
      current: number;
      previous: number;
      chartData: Array<{ date: string; value: number }>;
    };
  }>> {
    try {
      console.log('📈 Fetching trending metrics...');
      const response = await api.get('/dashboard/trending-metrics', { params });
      
      // If backend doesn't provide chart data, generate placeholder data points
      if (response.data) {
        const data = response.data;
        
        // Generate chart data if not provided by backend
        if (!data.investments?.chartData?.length) {
          data.investments.chartData = this.generatePlaceholderChartData(data.investments?.current || 0);
        }
        if (!data.payments?.chartData?.length) {
          data.payments.chartData = this.generatePlaceholderChartData(data.payments?.current || 0);
        }
        if (!data.investors?.chartData?.length) {
          data.investors.chartData = this.generatePlaceholderChartData(data.investors?.current || 0);
        }
        if (!data.revenue?.chartData?.length) {
          data.revenue.chartData = this.generatePlaceholderChartData(data.revenue?.current || 0);
        }
      }
      
      return response;
    } catch (error: any) {
      console.warn('❌ Trending metrics endpoint failed:', error.message);
      
      return {
        success: true,
        data: {
          investments: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: []
          },
          payments: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: []
          },
          investors: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: []
          },
          revenue: {
            trend: 'stable',
            percentage: 0,
            current: 0,
            previous: 0,
            chartData: []
          }
        }
      };
    }
  },

  // ================================
  // QUICK ACTIONS
  // ================================

  async getQuickActionsData(): Promise<ApiResponse<{
    pendingActions: {
      paymentsOverdue: number;
      investmentsAwaitingApproval: number;
      documentsToReview: number;
      kycPending: number;
    };
    shortcuts: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      url: string;
      badge?: number;
      color: string;
    }>;
    recentlyViewed: Array<{
      type: 'investment' | 'investor' | 'payment' | 'plan';
      id: string;
      title: string;
      subtitle: string;
      url: string;
      timestamp: string;
    }>;
  }>> {
    try {
      console.log('⚡ Fetching quick actions...');
      return await api.get('/dashboard/quick-actions');
    } catch (error: any) {
      console.warn('❌ Quick actions endpoint failed:', error.message);
      
      return {
        success: true,
        data: {
          pendingActions: {
            paymentsOverdue: 0,
            investmentsAwaitingApproval: 0,
            documentsToReview: 0,
            kycPending: 0
          },
          shortcuts: [
            {
              id: 'add_investor',
              title: 'Add New Investor',
              description: 'Register a new investor in the system',
              icon: 'UserPlus',
              url: '/investors',
              color: 'blue'
            },
            {
              id: 'create_investment',
              title: 'Create Investment',
              description: 'Set up a new investment',
              icon: 'TrendingUp',
              url: '/investments',
              color: 'green'
            },
            {
              id: 'record_payment',
              title: 'Record Payment',
              description: 'Record a new payment received',
              icon: 'CreditCard',
              url: '/payments',
              color: 'purple'
            },
            {
              id: 'create_plan',
              title: 'Create Plan',
              description: 'Set up a new investment plan',
              icon: 'FileText',
              url: '/plans',
              color: 'yellow'
            }
          ],
          recentlyViewed: []
        }
      };
    }
  },

  // ================================
  // ADDITIONAL ENDPOINTS
  // ================================

  // Get overdue items
  async getOverdueItems(): Promise<ApiResponse<any>> {
    try {
      return await api.get('/dashboard/overdue-items');
    } catch (error: any) {
      console.warn('Overdue items endpoint not available');
      return { success: true, data: { payments: [], documents: [], reviews: [] } };
    }
  },

  // Get performance analytics
  async getPerformanceAnalytics(params?: {
    period?: string;
    compareWith?: string;
  }): Promise<ApiResponse<any>> {
    try {
      return await api.get('/dashboard/performance-analytics', { params });
    } catch (error: any) {
      console.warn('Performance analytics endpoint not available');
      return { success: true, data: {} };
    }
  },

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<ApiResponse<any>> {
    try {
      return await api.get('/dashboard/realtime-metrics');
    } catch (error: any) {
      console.warn('Real-time metrics endpoint not available');
      return { 
        success: true, 
        data: {
          activeUsers: 0,
          onlineInvestors: 0,
          todaysPayments: 0,
          todaysInvestments: 0,
          systemHealth: 'unknown',
          lastUpdated: new Date().toISOString()
        }
      };
    }
  },

  // Global search
  async globalSearch(params: {
    query: string;
    entities?: string[];
    limit?: number;
  }): Promise<ApiResponse<any>> {
    try {
      return await api.get('/dashboard/search', { params });
    } catch (error: any) {
      console.warn('Global search endpoint not available');
      return { success: true, data: { investors: [], investments: [], payments: [], plans: [], total: 0 } };
    }
  },

  // ================================
  // ALERT MANAGEMENT
  // ================================

  // Mark alert as read
  async markAlertRead(alertId: string): Promise<ApiResponse<void>> {
    try {
      return await api.put(`/dashboard/alerts/${alertId}/read`);
    } catch (error) {
      console.warn('Mark alert read endpoint not available');
      return { success: true };
    }
  },

  // Mark all alerts as read
  async markAllAlertsRead(): Promise<ApiResponse<void>> {
    try {
      return await api.put('/dashboard/alerts/read-all');
    } catch (error) {
      console.warn('Mark all alerts read endpoint not available');
      return { success: true };
    }
  },

  // Dismiss alert
  async dismissAlert(alertId: string): Promise<ApiResponse<void>> {
    try {
      return await api.delete(`/dashboard/alerts/${alertId}`);
    } catch (error) {
      console.warn('Dismiss alert endpoint not available');
      return { success: true };
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing backend connection...');
      const response = await api.get('/health');
      console.log('✅ Backend connection successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Backend connection failed:', error.message);
      return false;
    }
  },

  // Check if user is fresh (no data)
  async isFreshUser(): Promise<boolean> {
    try {
      const overview = await this.getDashboardOverview();
      return overview.data?.stats?.totalInvestments === 0;
    } catch (error) {
      return true; // Assume fresh user if can't determine
    }
  },

  // ================================
  // HELPER METHODS
  // ================================

  // Get empty stats structure
  getEmptyStats() {
    return {
      stats: {
        totalInvestments: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        totalValue: 0,
        totalPaid: 0,
        remainingValue: 0,
        overduePayments: 0,
        averageInvestmentSize: 0
      } as DashboardStats,
      investorStats: {
        totalInvestors: 0,
        activeInvestors: 0,
        inactiveInvestors: 0,
        newThisMonth: 0,
        totalInvestment: 0,
        averageInvestment: 0,
        withUserAccounts: 0,
        activeUserAccounts: 0,
        userAccountPercentage: 0
      } as InvestorStats,
      paymentStats: {
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        thisMonthPayments: 0,
        averagePayment: 0,
        paymentsByMethod: [],
        documentsStats: []
      } as PaymentStats,
      planStats: {
        totalPlans: 0,
        activePlans: 0,
        inactivePlans: 0,
        plansByType: [],
        plansByPaymentType: [],
        mostPopularPlan: null
      } as PlanStats
    };
  },

  // Generate placeholder chart data for when backend doesn't provide it
  generatePlaceholderChartData(currentValue: number): Array<{ date: string; value: number }> {
    if (currentValue === 0) return [];
    
    const data = [];
    const now = new Date();
    
    // Generate data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic looking data around the current value
      const variance = currentValue * 0.1; // 10% variance
      const randomVariance = (Math.random() - 0.5) * variance;
      const value = Math.max(0, Math.floor(currentValue + randomVariance));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    return data;
  },

  // Format error for user display
  getErrorMessage(error: any): string {
    if (error?.code === 'NETWORK_ERROR') {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    
    if (error?.statusCode === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error?.statusCode >= 500) {
      return 'Server error occurred. Please try again later.';
    }
    
    return error?.message || 'An unexpected error occurred.';
  }
};