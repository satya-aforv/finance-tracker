// src/services/settings.ts - Enhanced Settings Service
import api from './api';
import { Settings, ApiResponse } from '../types';

export const settingsService = {
  // ================================
  // BASIC SETTINGS OPERATIONS
  // ================================

  // Get all system settings
  async getSettings(): Promise<ApiResponse<Settings>> {
    return api.get('/settings');
  },

  // Update system settings
  async updateSettings(data: Partial<Settings>): Promise<ApiResponse<Settings>> {
    return api.put('/settings', data);
  },

  // ================================
  // COMPANY SETTINGS
  // ================================

  // Upload company logo
  async uploadLogo(file: File): Promise<ApiResponse<{
    logo: string;
  }>> {
    const formData = new FormData();
    formData.append('logo', file);

    return api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Remove company logo
  async removeLogo(): Promise<ApiResponse<void>> {
    return api.delete('/settings/logo');
  },

  // Update company information
  async updateCompanyInfo(data: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    taxId?: string;
    registrationNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  }): Promise<ApiResponse<Settings>> {
    return api.put('/settings', { company: data });
  },

  // ================================
  // FINANCIAL SETTINGS
  // ================================

  // Update financial settings
  async updateFinancialSettings(data: {
    defaultCurrency?: string;
    currencySymbol?: string;
    financialYearStart?: 'January' | 'April' | 'July' | 'October';
    interestCalculationMethod?: 'daily' | 'monthly' | 'yearly';
    defaultLateFee?: number;
    gracePeriodDays?: number;
  }): Promise<ApiResponse<Settings>> {
    return api.put('/settings', { financial: data });
  },

  // Get supported currencies
  async getSupportedCurrencies(): Promise<ApiResponse<Array<{
    code: string;
    name: string;
    symbol: string;
    country: string;
  }>>> {
    return api.get('/settings/currencies');
  },

  // Get financial year periods
  async getFinancialYearPeriods(): Promise<ApiResponse<Array<{
    period: string;
    startMonth: string;
    endMonth: string;
    description: string;
  }>>> {
    return api.get('/settings/financial-year-periods');
  },

  // ================================
  // NOTIFICATION SETTINGS
  // ================================

  // Update notification settings
  async updateNotificationSettings(data: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    paymentReminders?: {
      enabled?: boolean;
      daysBefore?: number;
    };
    overdueAlerts?: {
      enabled?: boolean;
      frequency?: 'daily' | 'weekly' | 'monthly';
    };
    investmentMaturity?: {
      enabled?: boolean;
      daysBefore?: number;
    };
  }): Promise<ApiResponse<Settings>> {
    return api.put('/settings', { notifications: data });
  },

  // Test notification settings
  async testNotifications(config: {
    type: 'email' | 'sms';
    recipient: string;
    testMessage?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    deliveryTime?: number;
  }>> {
    return api.post('/settings/test-notifications', config);
  },

  // Get notification templates
  async getNotificationTemplates(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    type: 'email' | 'sms' | 'push';
    subject?: string;
    content: string;
    variables: string[];
    isActive: boolean;
  }>>> {
    return api.get('/settings/notification-templates');
  },

  // Update notification template
  async updateNotificationTemplate(
    templateId: string,
    data: {
      subject?: string;
      content?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/settings/notification-templates/${templateId}`, data);
  },

  // ================================
  // SECURITY SETTINGS
  // ================================

  // Update security settings
  async updateSecuritySettings(data: {
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    };
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    twoFactorAuth?: boolean;
  }): Promise<ApiResponse<Settings>> {
    return api.put('/settings', { security: data });
  },

  // Get security audit log
  async getSecurityAuditLog(params?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    userId?: string;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    timestamp: string;
    eventType: string;
    userId?: string;
    userName?: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    riskLevel: 'low' | 'medium' | 'high';
  }>>> {
    return api.get('/settings/security-audit', { params });
  },

  // Test password policy
  async testPasswordPolicy(password: string): Promise<ApiResponse<{
    isValid: boolean;
    score: number;
    feedback: Array<{
      type: 'requirement' | 'suggestion' | 'warning';
      message: string;
    }>;
  }>> {
    return api.post('/settings/test-password-policy', { password });
  },

  // ================================
  // BACKUP SETTINGS
  // ================================

  // Update backup settings
  async updateBackupSettings(data: {
    enabled?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    retentionDays?: number;
    destination?: 'local' | 'cloud' | 'both';
    encryptionEnabled?: boolean;
  }): Promise<ApiResponse<Settings>> {
    return api.put('/settings', { backup: data });
  },

  // Get backup status
  async getBackupStatus(): Promise<ApiResponse<{
    lastBackup?: string;
    nextBackup?: string;
    backupSize?: number;
    backupCount: number;
    isHealthy: boolean;
    errors?: string[];
    retention: {
      totalBackups: number;
      oldestBackup: string;
      storageUsed: number;
    };
  }>> {
    return api.get('/settings/backup-status');
  },

  // Trigger manual backup
  async triggerBackup(options?: {
    includeFiles?: boolean;
    compressionLevel?: 'none' | 'low' | 'medium' | 'high';
    encryptionKey?: string;
  }): Promise<ApiResponse<{
    backupId: string;
    status: 'started' | 'completed' | 'failed';
    estimatedSize?: number;
    estimatedTime?: number;
  }>> {
    return api.post('/settings/backup/trigger', options);
  },

  // Get backup history
  async getBackupHistory(params?: {
    limit?: number;
    status?: 'completed' | 'failed' | 'in_progress';
  }): Promise<ApiResponse<Array<{
    id: string;
    timestamp: string;
    status: 'completed' | 'failed' | 'in_progress';
    size: number;
    duration: number;
    type: 'manual' | 'scheduled';
    fileCount: number;
    errorMessage?: string;
  }>>> {
    return api.get('/settings/backup-history', { params });
  },

  // Restore from backup
  async restoreFromBackup(
    backupId: string,
    options?: {
      restoreData?: boolean;
      restoreFiles?: boolean;
      restoreSettings?: boolean;
    }
  ): Promise<ApiResponse<{
    restoreId: string;
    status: 'started' | 'completed' | 'failed';
    estimatedTime?: number;
  }>> {
    return api.post(`/settings/backup/${backupId}/restore`, options);
  },

  // ================================
  // SYSTEM CONFIGURATION
  // ================================

  // Get system information
  async getSystemInfo(): Promise<ApiResponse<{
    version: string;
    environment: string;
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    diskUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    database: {
      status: 'connected' | 'disconnected';
      size: number;
      collections: number;
      indexes: number;
    };
    services: {
      email: 'ready' | 'not_configured' | 'error';
      storage: 'ready' | 'error';
      backup: 'ready' | 'disabled' | 'error';
    };
  }>> {
    return api.get('/settings/system-info');
  },

  // Update system configuration
  async updateSystemConfig(data: {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
    maintenanceMode?: boolean;
    debugMode?: boolean;
  }): Promise<ApiResponse<any>> {
    return api.put('/settings/system-config', data);
  },

  // Get system health check
  async getSystemHealthCheck(): Promise<ApiResponse<{
    overall: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
      lastChecked: string;
      metrics?: any;
    }>;
    recommendations: string[];
  }>> {
    return api.get('/settings/health-check');
  },

  // ================================
  // EMAIL CONFIGURATION
  // ================================

  // Update email configuration
  async updateEmailConfig(data: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
  }): Promise<ApiResponse<any>> {
    return api.put('/settings/email-config', data);
  },

  // Test email configuration
  async testEmailConfig(testEmail?: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    messageId?: string;
    deliveryTime?: number;
  }>> {
    return api.post('/settings/test-email', { testEmail });
  },

  // Get email statistics
  async getEmailStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    summary: {
      totalSent: number;
      delivered: number;
      failed: number;
      deliveryRate: number;
    };
    byType: Array<{
      type: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
    trends: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  }>> {
    return api.get('/settings/email-statistics', { params });
  },

  // ================================
  // API CONFIGURATION
  // ================================

  // Get API settings
  async getApiSettings(): Promise<ApiResponse<{
    rateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
      burstLimit: number;
    };
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
      allowedMethods: string[];
    };
    authentication: {
      jwtExpiry: string;
      refreshTokens: boolean;
      maxSessions: number;
    };
    versioning: {
      currentVersion: string;
      supportedVersions: string[];
      deprecationWarnings: boolean;
    };
  }>> {
    return api.get('/settings/api');
  },

  // Update API settings
  async updateApiSettings(data: any): Promise<ApiResponse<any>> {
    return api.put('/settings/api', data);
  },

  // Generate API key
  async generateApiKey(config: {
    name: string;
    permissions: string[];
    expiresAt?: string;
    ipWhitelist?: string[];
  }): Promise<ApiResponse<{
    apiKey: string;
    keyId: string;
    expiresAt?: string;
  }>> {
    return api.post('/settings/api-keys', config);
  },

  // Get API keys
  async getApiKeys(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    permissions: string[];
    createdAt: string;
    expiresAt?: string;
    lastUsed?: string;
    isActive: boolean;
  }>>> {
    return api.get('/settings/api-keys');
  },

  // Revoke API key
  async revokeApiKey(keyId: string): Promise<ApiResponse<void>> {
    return api.delete(`/settings/api-keys/${keyId}`);
  },

  // ================================
  // MAINTENANCE & UTILITIES
  // ================================

  // Enable maintenance mode
  async enableMaintenanceMode(config?: {
    message?: string;
    estimatedDuration?: number;
    allowedIPs?: string[];
  }): Promise<ApiResponse<any>> {
    return api.post('/settings/maintenance/enable', config);
  },

  // Disable maintenance mode
  async disableMaintenanceMode(): Promise<ApiResponse<any>> {
    return api.post('/settings/maintenance/disable');
  },

  // Clear system cache
  async clearCache(type?: 'all' | 'user_sessions' | 'api_cache' | 'file_cache'): Promise<ApiResponse<{
    cleared: boolean;
    itemsCleared: number;
    spaceFreed: number;
  }>> {
    return api.post('/settings/cache/clear', { type });
  },

  // Optimize database
  async optimizeDatabase(): Promise<ApiResponse<{
    optimized: boolean;
    collectionsOptimized: number;
    indexesRebuilt: number;
    spaceReclaimed: number;
    duration: number;
  }>> {
    return api.post('/settings/database/optimize');
  },

  // Export settings
  async exportSettings(format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    const response = await api.get('/settings/export', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Import settings
  async importSettings(
    file: File,
    options?: {
      overwrite?: boolean;
      validateOnly?: boolean;
    }
  ): Promise<ApiResponse<{
    imported: boolean;
    validated: boolean;
    errors?: string[];
    warnings?: string[];
    changes: Array<{
      section: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }>> {
    const formData = new FormData();
    formData.append('settings', file);
    
    if (options) {
      Object.keys(options).forEach(key => {
        formData.append(key, String(options[key as keyof typeof options]));
      });
    }

    return api.post('/settings/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Reset settings to defaults
  async resetToDefaults(sections?: string[]): Promise<ApiResponse<{
    reset: boolean;
    sectionsReset: string[];
    changes: Array<{
      section: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }>> {
    return api.post('/settings/reset', { sections });
  }
};