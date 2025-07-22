// src/services/users.ts - Complete User Management Service
import api from './api';
import { User, ApiResponse, PaginationParams } from '../types';

export const usersService = {
  // ================================
  // BASIC USER CRUD OPERATIONS
  // ================================

  // Get all users with pagination and search
  async getUsers(params?: PaginationParams & {
    role?: 'admin' | 'finance_manager' | 'investor';
    isActive?: boolean;
  }): Promise<ApiResponse<User[]>> {
    return api.get('/users', { params });
  },

  // Get single user
  async getUser(id: string): Promise<ApiResponse<User>> {
    return api.get(`/users/${id}`);
  },

  // Update user (admin only)
  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: 'admin' | 'finance_manager' | 'investor';
    isActive?: boolean;
    phone?: string;
  }): Promise<ApiResponse<User>> {
    return api.put(`/users/${id}`, data);
  },

  // Delete user (admin only)
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/users/${id}`);
  },

  // ================================
  // AVATAR MANAGEMENT
  // ================================

  // Upload user avatar
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{
    avatar: string;
  }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Remove user avatar
  async removeAvatar(userId: string): Promise<ApiResponse<void>> {
    return api.delete(`/users/${userId}/avatar`);
  },

  // ================================
  // USER STATISTICS & ANALYTICS
  // ================================

  // Get user statistics
  async getUserStats(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Array<{
      _id: string;
      count: number;
      active: number;
      verified: number;
    }>;
    newUsersThisMonth: number;
    loginActivity: Array<{
      date: string;
      count: number;
    }>;
  }>> {
    return api.get('/users/stats/overview');
  },

  // Get user activity log
  async getUserActivity(userId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    action: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }>>> {
    return api.get(`/users/${userId}/activity`, { params });
  },

  // ================================
  // USER SEARCH & FILTERING
  // ================================

  // Advanced user search
  async searchUsers(searchParams: {
    query?: string;
    filters?: {
      role?: string[];
      isActive?: boolean;
      emailVerified?: boolean;
      lastLoginRange?: { start: string; end: string };
      createdRange?: { start: string; end: string };
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<User[]>> {
    return api.post('/users/search', searchParams);
  },

  // Get users by role
  async getUsersByRole(role: 'admin' | 'finance_manager' | 'investor'): Promise<ApiResponse<User[]>> {
    return api.get('/users', { params: { role } });
  },

  // Get active users
  async getActiveUsers(): Promise<ApiResponse<User[]>> {
    return api.get('/users', { params: { isActive: true } });
  },

  // ================================
  // BULK OPERATIONS
  // ================================

  // Bulk update users
  async bulkUpdateUsers(
    userIds: string[],
    updates: {
      isActive?: boolean;
      role?: string;
    }
  ): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.put('/users/bulk', { userIds, updates });
  },

  // Bulk delete users
  async bulkDeleteUsers(userIds: string[]): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.delete('/users/bulk', { data: { userIds } });
  },

  // ================================
  // USER ACCOUNT MANAGEMENT
  // ================================

  // Reset user password (admin only)
  async resetUserPassword(
    userId: string,
    newPassword: string,
    sendEmail?: boolean
  ): Promise<ApiResponse<{
    message: string;
    emailSent?: boolean;
  }>> {
    return api.post(`/users/${userId}/reset-password`, {
      newPassword,
      sendEmail
    });
  },

  // Lock/unlock user account
  async lockUser(userId: string, reason?: string): Promise<ApiResponse<void>> {
    return api.post(`/users/${userId}/lock`, { reason });
  },

  async unlockUser(userId: string): Promise<ApiResponse<void>> {
    return api.post(`/users/${userId}/unlock`);
  },

  // Activate/deactivate user
  async activateUser(userId: string): Promise<ApiResponse<void>> {
    return api.post(`/users/${userId}/activate`);
  },

  async deactivateUser(userId: string, reason?: string): Promise<ApiResponse<void>> {
    return api.post(`/users/${userId}/deactivate`, { reason });
  },

  // ================================
  // USER SESSION MANAGEMENT
  // ================================

  // Get user sessions
  async getUserSessions(userId: string): Promise<ApiResponse<Array<{
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    loginTime: string;
    lastActivity: string;
    isActive: boolean;
  }>>> {
    return api.get(`/users/${userId}/sessions`);
  },

  // Terminate user session
  async terminateSession(userId: string, sessionId: string): Promise<ApiResponse<void>> {
    return api.delete(`/users/${userId}/sessions/${sessionId}`);
  },

  // Terminate all user sessions
  async terminateAllSessions(userId: string): Promise<ApiResponse<void>> {
    return api.delete(`/users/${userId}/sessions`);
  },

  // ================================
  // USER PREFERENCES
  // ================================

  // Get user preferences
  async getUserPreferences(userId: string): Promise<ApiResponse<{
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    dashboard: {
      widgets: string[];
      layout: 'grid' | 'list';
    };
  }>> {
    return api.get(`/users/${userId}/preferences`);
  },

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    preferences: any
  ): Promise<ApiResponse<any>> {
    return api.put(`/users/${userId}/preferences`, preferences);
  },

  // ================================
  // USER NOTIFICATIONS
  // ================================

  // Get user notifications
  async getUserNotifications(userId: string, params?: {
    unreadOnly?: boolean;
    type?: string;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: any;
  }>>> {
    return api.get(`/users/${userId}/notifications`, { params });
  },

  // Mark notification as read
  async markNotificationRead(userId: string, notificationId: string): Promise<ApiResponse<void>> {
    return api.put(`/users/${userId}/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  async markAllNotificationsRead(userId: string): Promise<ApiResponse<void>> {
    return api.put(`/users/${userId}/notifications/read-all`);
  },

  // Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<ApiResponse<void>> {
    return api.delete(`/users/${userId}/notifications/${notificationId}`);
  },

  // ================================
  // USER EXPORT & IMPORT
  // ================================

  // Export users data
  async exportUsers(options: {
    format: 'csv' | 'excel' | 'pdf';
    includeInactive?: boolean;
    includePasswords?: boolean;
    userIds?: string[];
    filters?: any;
  }): Promise<Blob> {
    const response = await api.get('/users/export', { 
      params: options,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Import users from file
  async importUsers(
    file: File,
    options: {
      skipValidation?: boolean;
      sendWelcomeEmails?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ApiResponse<{
    successful: User[];
    failed: Array<{
      row: number;
      data: any;
      error: string;
    }>;
    summary: {
      totalRows: number;
      successfulRows: number;
      failedRows: number;
      usersCreated: number;
      emailsSent: number;
    };
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, String(options[key as keyof typeof options]));
    });

    return api.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // ================================
  // USER VALIDATION
  // ================================

  // Check if email exists
  async checkEmailExists(email: string): Promise<ApiResponse<{
    exists: boolean;
    userId?: string;
  }>> {
    return api.get('/users/check-email', { params: { email } });
  },

  // Validate user data
  async validateUserData(userData: Partial<User>): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    return api.post('/users/validate', userData);
  },

  // ================================
  // USER AUDIT & COMPLIANCE
  // ================================

  // Get user audit trail
  async getUserAuditTrail(userId: string, params?: {
    startDate?: string;
    endDate?: string;
    actions?: string[];
    limit?: number;
  }): Promise<ApiResponse<Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }>>> {
    return api.get(`/users/${userId}/audit-trail`, { params });
  },

  // Get compliance report
  async getComplianceReport(params?: {
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }): Promise<ApiResponse<{
    totalUsers: number;
    compliantUsers: number;
    nonCompliantUsers: number;
    issues: Array<{
      userId: string;
      user: User;
      issues: string[];
      severity: 'low' | 'medium' | 'high';
    }>;
    summary: {
      passwordExpiry: number;
      inactiveAccounts: number;
      unverifiedEmails: number;
      suspiciousActivity: number;
    };
  }>> {
    return api.get('/users/compliance-report', { params });
  },

  // ================================
  // USER COMMUNICATION
  // ================================

  // Send message to user
  async sendMessageToUser(
    userId: string,
    message: {
      type: 'email' | 'sms' | 'notification';
      subject?: string;
      content: string;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<ApiResponse<{
    messageId: string;
    status: string;
  }>> {
    return api.post(`/users/${userId}/send-message`, message);
  },

  // Broadcast message to multiple users
  async broadcastMessage(
    userIds: string[],
    message: {
      type: 'email' | 'sms' | 'notification';
      subject?: string;
      content: string;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return api.post('/users/broadcast', { userIds, message });
  }
};