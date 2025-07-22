// src/services/payments.ts - Complete Payment Services with Document Support
import api from './api';
import { Payment, ApiResponse, PaginationParams } from '../types';

export const paymentsService = {
  // Get all payments
  async getPayments(params?: PaginationParams): Promise<ApiResponse<Payment[]>> {
    return api.get('/payments', { params });
  },

  // Get single payment with documents
  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    return api.get(`/payments/${id}`);
  },

  // Create payment with documents (using FormData)
  async createPayment(data: FormData | any): Promise<ApiResponse<Payment>> {
    if (data instanceof FormData) {
      return api.post('/payments', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/payments', data);
  },

  // Update payment
  async updatePayment(id: string, data: Partial<Payment>): Promise<ApiResponse<Payment>> {
    return api.put(`/payments/${id}`, data);
  },

  // Verify payment
  async verifyPayment(id: string, data: { notes?: string }): Promise<ApiResponse<Payment>> {
    return api.put(`/payments/${id}`, { 
      verifiedBy: 'current_user', // Will be set by backend from token
      ...data 
    });
  },

  // Document Management Methods
  async getPaymentDocuments(id: string, params?: { category?: string }): Promise<ApiResponse<any>> {
    return api.get(`/payments/${id}/documents`, { params });
  },

  async uploadDocuments(
    id: string, 
    files: File[], 
    data: { category: string; description?: string }
  ): Promise<ApiResponse<any>> {
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

    return api.post(`/payments/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async deleteDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return api.delete(`/payments/${id}/documents/${documentId}`);
  },

  // Download document
  async downloadDocument(id: string, documentId: string): Promise<Blob> {
    const response = await api.get(`/payments/${id}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Legacy receipt upload (for backward compatibility)
  async uploadReceipt(id: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('type', 'receipt');

    return api.post(`/payments/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Bulk payment operations
  async createBulkPayments(payments: any[], options?: { batchId?: string }): Promise<ApiResponse<any>> {
    return api.post('/payments/bulk', { 
      payments, 
      batchId: options?.batchId || Date.now().toString()
    });
  },

  async bulkUpdatePayments(paymentIds: string[], updates: Partial<Payment>): Promise<ApiResponse<any>> {
    return api.put('/payments/bulk', { paymentIds, updates });
  },

  // Payment validation
  async validatePayment(data: {
    investment: string;
    scheduleMonth: number;
    amount: number;
  }): Promise<ApiResponse<any>> {
    return api.post('/payments/validate', data);
  },

  // Payment statistics
  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/payments/stats/overview');
  },

  async getPaymentAnalytics(params?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: 'method' | 'status' | 'month';
  }): Promise<ApiResponse<any>> {
    return api.get('/payments/analytics', { params });
  },

  // Payment alerts and reminders
  async getDueAlerts(days?: number): Promise<ApiResponse<any[]>> {
    return api.get('/payments/due/alerts', { params: { days } });
  },

  async sendPaymentReminder(investmentId: string, scheduleMonth: number): Promise<ApiResponse<any>> {
    return api.post('/payments/reminders', { investmentId, scheduleMonth });
  },

  // Payment reconciliation
  async reconcilePayments(data: {
    bankStatementFile?: File;
    reconciliationDate: string;
    paymentIds?: string[];
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    if (data.bankStatementFile) {
      formData.append('bankStatement', data.bankStatementFile);
    }
    
    formData.append('reconciliationDate', data.reconciliationDate);
    
    if (data.paymentIds) {
      data.paymentIds.forEach(id => formData.append('paymentIds[]', id));
    }

    return api.post('/payments/reconciliation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Payment reports
  async generatePaymentReport(params: {
    type: 'summary' | 'detailed' | 'reconciliation';
    dateFrom?: string;
    dateTo?: string;
    investmentId?: string;
    format?: 'pdf' | 'excel' | 'csv';
  }): Promise<Blob> {
    const response = await api.get('/payments/reports', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Payment search and filters
  async searchPayments(searchParams: {
    query?: string;
    filters?: {
      status?: string[];
      methods?: string[];
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
      investments?: string[];
      hasDocuments?: boolean;
      isVerified?: boolean;
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Payment[]>> {
    return api.post('/payments/search', searchParams);
  },

  // Payment workflow
  async updatePaymentWorkflow(
    id: string, 
    workflow: {
      stage: 'recorded' | 'verified' | 'reconciled' | 'completed';
      notes?: string;
      nextAction?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/payments/${id}/workflow`, workflow);
  },

  // Payment audit
  async getPaymentAuditTrail(id: string): Promise<ApiResponse<any>> {
    return api.get(`/payments/${id}/audit-trail`);
  },

  // Payment notifications
  async getPaymentNotifications(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/payments/${id}/notifications`);
  },

  async sendPaymentNotification(
    id: string,
    notification: {
      type: 'confirmation' | 'verification_required' | 'document_request';
      message: string;
      channel: 'email' | 'sms' | 'both';
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/payments/${id}/notifications`, notification);
  },

  // Payment templates
  async getPaymentTemplates(): Promise<ApiResponse<any[]>> {
    return api.get('/payments/templates');
  },

  async createPaymentFromTemplate(
    templateId: string,
    data: {
      investment: string;
      scheduleMonth: number;
      paymentDate?: string;
    }
  ): Promise<ApiResponse<Payment>> {
    return api.post(`/payments/templates/${templateId}/create`, data);
  },

  // Payment integration
  async syncWithBankSystem(
    systemType: 'bank_api' | 'payment_gateway',
    config: any
  ): Promise<ApiResponse<any>> {
    return api.post('/payments/sync', { systemType, config });
  },

  // Payment schedule management
  async getPaymentSchedule(investmentId: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${investmentId}/payment-schedule`);
  },

  async updatePaymentSchedule(
    investmentId: string,
    scheduleUpdates: Array<{
      month: number;
      dueDate?: string;
      amount?: number;
      notes?: string;
    }>
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${investmentId}/payment-schedule`, { scheduleUpdates });
  },

  // Payment preferences
  async getPaymentPreferences(investorId: string): Promise<ApiResponse<any>> {
    return api.get(`/investors/${investorId}/payment-preferences`);
  },

  async updatePaymentPreferences(
    investorId: string,
    preferences: {
      preferredMethod?: string;
      reminderSettings?: {
        enabled: boolean;
        daysBefore: number;
        channels: string[];
      };
      autoReconciliation?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investors/${investorId}/payment-preferences`, preferences);
  },

  // Payment export
  async exportPayments(params?: {
    format?: 'csv' | 'excel' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
    investmentIds?: string[];
    includeDocuments?: boolean;
  }): Promise<Blob> {
    const response = await api.get('/payments/export', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Payment import
  async importPayments(
    file: File,
    options?: {
      format: 'csv' | 'excel';
      skipValidation?: boolean;
      dryRun?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      Object.keys(options).forEach(key => {
        formData.append(key, String(options[key as keyof typeof options]));
      });
    }

    return api.post('/payments/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Payment dashboard
  async getPaymentDashboard(params?: {
    dateRange?: { start: string; end: string };
    investmentIds?: string[];
  }): Promise<ApiResponse<any>> {
    return api.get('/payments/dashboard', { params });
  },

  // Payment compliance
  async getComplianceReport(params: {
    type: 'regulatory' | 'internal' | 'audit';
    dateFrom: string;
    dateTo: string;
  }): Promise<ApiResponse<any>> {
    return api.get('/payments/compliance', { params });
  },

  // Payment reversal
  async reversePayment(
    id: string,
    reason: string,
    approvalCode?: string
  ): Promise<ApiResponse<any>> {
    return api.post(`/payments/${id}/reverse`, { reason, approvalCode });
  },

  // Payment disputes
  async createPaymentDispute(
    id: string,
    dispute: {
      type: 'amount_mismatch' | 'duplicate_payment' | 'unauthorized' | 'other';
      description: string;
      evidenceFiles?: File[];
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('type', dispute.type);
    formData.append('description', dispute.description);
    
    if (dispute.evidenceFiles) {
      dispute.evidenceFiles.forEach(file => {
        formData.append('evidenceFiles', file);
      });
    }

    return api.post(`/payments/${id}/disputes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async getPaymentDisputes(id: string): Promise<ApiResponse<any[]>> {
    return api.get(`/payments/${id}/disputes`);
  },

  // Payment automation
  async setupAutomaticPayments(
    investmentId: string,
    config: {
      enabled: boolean;
      paymentMethod: string;
      bankAccountId?: string;
      autoApprove?: boolean;
      reminderDays?: number;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${investmentId}/auto-payments`, config);
  },

  // Payment webhooks
  async getPaymentWebhooks(): Promise<ApiResponse<any[]>> {
    return api.get('/payments/webhooks');
  },

  async createPaymentWebhook(webhook: {
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
  }): Promise<ApiResponse<any>> {
    return api.post('/payments/webhooks', webhook);
  }
};