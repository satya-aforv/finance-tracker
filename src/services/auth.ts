// src/services/auth.ts - Updated to match backend authentication
import api from './api';
import { LoginData, RegisterData, AuthResponse, User } from '../types';

export const authService = {
  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    return api.post('/auth/login', data);
  },

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    return api.post('/auth/register', data);
  },

  // Get current user profile
  async getProfile(): Promise<{ success: boolean; user: User }> {
    return api.get('/auth/me');
  },

  // Update user profile
  async updateProfile(data: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; user: User; message: string }> {
    return api.put('/auth/profile', data);
  },

  // Logout user (client-side mainly, as JWT is stateless)
  async logout(): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/logout');
  },

  // Token management
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    api.setToken(token);
  },

  removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    api.removeToken();
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  storeUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Password reset (if implemented in backend)
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  // Email verification (if implemented)
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/verify-email', { token });
  },

  async resendVerification(): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/resend-verification');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  },

  // Check user role
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUser();
    return user ? roles.includes(user.role) : false;
  },

  // Get user permissions based on role
  getUserPermissions(): string[] {
    const user = this.getStoredUser();
    if (!user) return [];

    const rolePermissions = {
      admin: [
        'users:read', 'users:write', 'users:delete',
        'investors:read', 'investors:write', 'investors:delete',
        'investments:read', 'investments:write', 'investments:delete',
        'payments:read', 'payments:write', 'payments:delete',
        'plans:read', 'plans:write', 'plans:delete',
        'reports:read', 'reports:write',
        'settings:read', 'settings:write'
      ],
      finance_manager: [
        'investors:read', 'investors:write',
        'investments:read', 'investments:write',
        'payments:read', 'payments:write',
        'plans:read', 'plans:write',
        'reports:read'
      ],
      investor: [
        'investments:read:own',
        'payments:read:own',
        'profile:read:own',
        'profile:write:own'
      ]
    };

    return rolePermissions[user.role as keyof typeof rolePermissions] || [];
  },

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes('*') || permissions.includes(permission);
  }
};