// src/pages/DashboardPage.tsx - Fixed with Better Error Handling and Fresh User Support
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Activity,
  UserPlus,
  Plus,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard';
import { DashboardStats, InvestorStats, PaymentStats, PlanStats } from '../types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface DashboardData {
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
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
    actionRequired: boolean;
    actionUrl?: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [trendingMetrics, setTrendingMetrics] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreshUser, setIsFreshUser] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'finance_manager';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if backend is available
        const isConnected = await dashboardService.testConnection();
        if (!isConnected) {
          console.warn('Backend not available, using offline mode');
          setDashboardData(getOfflineData());
          setTrendingMetrics(getOfflineTrendingData());
          setQuickActions(getOfflineQuickActions());
          setIsFreshUser(true);
          return;
        }

        if (isManager) {
          // Fetch comprehensive dashboard for admin/finance managers
          const [overviewResponse, trendingResponse, quickActionsResponse] = await Promise.allSettled([
            dashboardService.getDashboardOverview(),
            dashboardService.getTrendingMetrics({ period: 'month' }),
            dashboardService.getQuickActionsData()
          ]);

          // Handle overview response
          if (overviewResponse.status === 'fulfilled') {
            setDashboardData(overviewResponse.value.data);
            setIsFreshUser(overviewResponse.value.data.stats.totalInvestments === 0);
          } else {
            console.warn('Overview failed:', overviewResponse.reason);
            setDashboardData(getOfflineData());
            setIsFreshUser(true);
          }

          // Handle trending response
          if (trendingResponse.status === 'fulfilled') {
            setTrendingMetrics(trendingResponse.value.data);
          } else {
            console.warn('Trending failed:', trendingResponse.reason);
            setTrendingMetrics(getOfflineTrendingData());
          }

          // Handle quick actions response
          if (quickActionsResponse.status === 'fulfilled') {
            setQuickActions(quickActionsResponse.value.data);
          } else {
            console.warn('Quick actions failed:', quickActionsResponse.reason);
            setQuickActions(getOfflineQuickActions());
          }
        } else {
          // Simplified dashboard for investors
          try {
            const response = await dashboardService.getDashboardOverview();
            setDashboardData(response.data);
            setIsFreshUser(response.data.stats.totalInvestments === 0);
          } catch (investorError) {
            console.warn('Investor dashboard failed:', investorError);
            setDashboardData(getOfflineData());
            setIsFreshUser(true);
          }
        }

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to load dashboard data. Working in offline mode.');
        
        // Set default data for fresh users
        setDashboardData(getOfflineData());
        setTrendingMetrics(getOfflineTrendingData());
        setQuickActions(getOfflineQuickActions());
        setIsFreshUser(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManager]);

  // Generate offline/default data for fresh users
  const getOfflineData = (): DashboardData => ({
    stats: {
      totalInvestments: 0,
      activeInvestments: 0,
      completedInvestments: 0,
      totalValue: 0,
      totalPaid: 0,
      remainingValue: 0,
      overduePayments: 0,
      averageInvestmentSize: 0
    },
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
    },
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
    },
    planStats: {
      totalPlans: 0,
      activePlans: 0,
      inactivePlans: 0,
      plansByType: [],
      plansByPaymentType: [],
      mostPopularPlan: null
    },
    recentActivity: [],
    alerts: []
  });

  const getOfflineTrendingData = () => ({
    investments: {
      trend: 'stable' as const,
      percentage: 0,
      current: 0,
      previous: 0,
      chartData: generateEmptyChartData()
    },
    payments: {
      trend: 'stable' as const,
      percentage: 0,
      current: 0,
      previous: 0,
      chartData: generateEmptyChartData()
    },
    investors: {
      trend: 'stable' as const,
      percentage: 0,
      current: 0,
      previous: 0,
      chartData: generateEmptyChartData()
    },
    revenue: {
      trend: 'stable' as const,
      percentage: 0,
      current: 0,
      previous: 0,
      chartData: generateEmptyChartData()
    }
  });

  const getOfflineQuickActions = () => ({
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
        url: '/investors/new',
        color: 'blue'
      },
      {
        id: 'create_investment',
        title: 'Create Investment',
        description: 'Set up a new investment for an existing investor',
        icon: 'TrendingUp',
        url: '/investments/new',
        color: 'green'
      },
      {
        id: 'create_plan',
        title: 'Create Plan',
        description: 'Set up a new investment plan',
        icon: 'FileText',
        url: '/plans/new',
        color: 'purple'
      },
      {
        id: 'record_payment',
        title: 'Record Payment',
        description: 'Record a new payment received',
        icon: 'CreditCard',
        url: '/payments/new',
        color: 'yellow'
      }
    ],
    recentlyViewed: []
  });

  const generateEmptyChartData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: 0
      });
    }
    
    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      investment_created: <FileText className="h-4 w-4" />,
      payment_received: <CreditCard className="h-4 w-4" />,
      investor_added: <Users className="h-4 w-4" />,
      plan_created: <TrendingUp className="h-4 w-4" />,
      document_uploaded: <FileText className="h-4 w-4" />,
      user_login: <Activity className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (status: string) => {
    const colors = {
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-blue-600 bg-blue-100';
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      info: <FileText className="h-4 w-4 text-blue-600" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      error: <AlertTriangle className="h-4 w-4 text-red-600" />,
      success: <TrendingUp className="h-4 w-4 text-green-600" />
    };
    return icons[type as keyof typeof icons] || <FileText className="h-4 w-4 text-blue-600" />;
  };

  const EmptyStateCard = ({ title, description, icon: Icon, actionText, actionUrl }: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    actionText: string;
    actionUrl: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center"
    >
      <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      <a
        href={actionUrl}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        {actionText}
      </a>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Unable to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-2 opacity-90">
          {isFreshUser 
            ? "Let's get started by adding your first investor or creating an investment plan."
            : `Here's an overview of your ${user?.role === 'investor' ? 'investment portfolio' : 'finance management dashboard'}`
          }
        </p>
        {error && (
          <div className="mt-2 bg-blue-800 bg-opacity-50 rounded p-2 text-sm">
            <span className="opacity-75">⚠️ {error}</span>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Investments"
          value={dashboardData.stats.totalInvestments || 0}
          icon={FileText}
          color="blue"
          change={trendingMetrics?.investments?.percentage ? `${trendingMetrics.investments.percentage > 0 ? '+' : ''}${trendingMetrics.investments.percentage}% from last month` : undefined}
          changeType={trendingMetrics?.investments?.trend || 'neutral'}
        />
        <StatCard
          title="Active Investments"
          value={dashboardData.stats.activeInvestments || 0}
          icon={TrendingUp}
          color="green"
          change={`${dashboardData.stats.activeInvestments || 0} currently active`}
          changeType="neutral"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(dashboardData.stats.totalValue || 0)}
          icon={DollarSign}
          color="purple"
          change={trendingMetrics?.revenue?.percentage ? `${trendingMetrics.revenue.percentage > 0 ? '+' : ''}${trendingMetrics.revenue.percentage}% from last month` : undefined}
          changeType={trendingMetrics?.revenue?.trend || 'neutral'}
        />
        <StatCard
          title="Returns Paid"
          value={formatCurrency(dashboardData.stats.totalPaid || 0)}
          icon={CreditCard}
          color="yellow"
          change={`${formatCurrency(dashboardData.stats.remainingValue || 0)} remaining`}
          changeType="neutral"
        />
      </motion.div>

      {/* Fresh User Onboarding */}
      {isFreshUser && isManager && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold text-blue-900 mb-4">🚀 Getting Started</h2>
          <p className="text-blue-700 mb-4">
            Welcome to your finance management system! Here are the next steps to get you up and running:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EmptyStateCard
              title="Create Your First Plan"
              description="Set up investment plans with different interest rates and terms"
              icon={FileText}
              actionText="Create Plan"
              actionUrl="/plans"
            />
            <EmptyStateCard
              title="Add Investors"
              description="Register investors who will invest in your plans"
              icon={Users}
              actionText="Add Investor"
              actionUrl="/investors"
            />
            <EmptyStateCard
              title="Create Investments"
              description="Set up investments for your registered investors"
              icon={TrendingUp}
              actionText="Create Investment"
              actionUrl="/investments"
            />
            <EmptyStateCard
              title="Record Payments"
              description="Track payment receipts from your investors"
              icon={CreditCard}
              actionText="Record Payment"
              actionUrl="/payments"
            />
          </div>
        </motion.div>
      )}

      {/* Charts Section for Managers with Data */}
      {isManager && trendingMetrics && !isFreshUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendingMetrics.investments.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Payment Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendingMetrics.payments.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Alerts and Recent Activity */}
      {!isFreshUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Alerts */}
          {dashboardData.alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {dashboardData.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(alert.timestamp)}</p>
                      </div>
                      {alert.actionRequired && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Action Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity */}
          {dashboardData.recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {dashboardData.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-1 rounded-full ${getActivityColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                          <span className="text-xs font-medium text-gray-600">by {activity.user.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Actions for Managers */}
      {isManager && quickActions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.shortcuts?.map((shortcut: any) => (
                <a
                  key={shortcut.id}
                  href={shortcut.url}
                  className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${shortcut.color}-100`}>
                      <TrendingUp className={`h-5 w-5 text-${shortcut.color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shortcut.title}</p>
                      <p className="text-xs text-gray-500">{shortcut.description}</p>
                    </div>
                  </div>
                  {shortcut.badge && shortcut.badge > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {shortcut.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Additional Stats for Admin/Finance Manager */}
      {isManager && !isFreshUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Investor Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Investors</span>
                <span className="font-semibold">{dashboardData.investorStats.totalInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Investors</span>
                <span className="font-semibold text-green-600">{dashboardData.investorStats.activeInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Month</span>
                <span className="font-semibold text-blue-600">{dashboardData.investorStats.newThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">With User Accounts</span>
                <span className="font-semibold text-purple-600">{dashboardData.investorStats.withUserAccounts}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Payments</span>
                <span className="font-semibold">{dashboardData.paymentStats.totalPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{dashboardData.paymentStats.completedPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{dashboardData.paymentStats.pendingPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-blue-600">{dashboardData.paymentStats.thisMonthPayments}</span>
              </div>
            </div>
          </motion.div>

          {/* Plan Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Plans</span>
                <span className="font-semibold">{dashboardData.planStats.totalPlans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Plans</span>
                <span className="font-semibold text-green-600">{dashboardData.planStats.activePlans}</span>
              </div>
              {dashboardData.planStats.mostPopularPlan && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Most Popular</div>
                  <div className="font-semibold text-purple-600 text-sm">
                    {dashboardData.planStats.mostPopularPlan.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dashboardData.planStats.mostPopularPlan.investmentCount} investments
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;