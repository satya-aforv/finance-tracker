// src/services/api.ts - Enhanced API Service with Better Error Handling
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ApiResponse } from "../types";

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    // Use proxy in development, direct URL in production
    const baseURL = import.meta.env.DEV
      ? "/api" // This will use Vite's proxy
      : import.meta.env.VITE_API_URL ||
        "https://finance-tracker-backend-69gq.onrender.com/api";

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and clean params
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Clean empty query parameters
        if (config.params) {
          const cleanParams: any = {};
          Object.keys(config.params).forEach((key) => {
            const value = config.params[key];
            // Only include non-empty values
            if (value !== "" && value !== null && value !== undefined) {
              cleanParams[key] = value;
            }
          });
          config.params = cleanParams;
        }

        // Add request ID for tracking
        config.headers["X-Request-ID"] = this.generateRequestId();

        // Add debug logging in development
        if (import.meta.env.DEV) {
          console.log("🚀 API Request:", {
            method: config.method?.toUpperCase(),
            url: config.baseURL + config.url,
            params: config.params,
            headers: this.sanitizeHeaders(config.headers),
          });
        }

        return config;
      },
      (error) => {
        console.error("❌ Request interceptor error:", error);
        return Promise.reject(this.normalizeError(error));
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (import.meta.env.DEV) {
          console.log("✅ API Response:", {
            status: response.status,
            url: response.config.url,
            data: response.data?.success !== false ? "✓" : response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Log error details
        if (import.meta.env.DEV) {
          console.error("❌ API Error Details:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data,
          });
        }

        // Handle specific error cases
        this.handleSpecificErrors(error);

        // Handle 401 errors with token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers!.Authorization = `Bearer ${token}`;
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh token (if refresh token logic is implemented)
            // For now, just clear auth and redirect to login
            this.clearAuthAndRedirect();
            return Promise.reject(this.normalizeError(error));
          } catch (refreshError) {
            this.clearAuthAndRedirect();
            return Promise.reject(this.normalizeError(error));
          } finally {
            this.isRefreshing = false;
            this.processQueue(null, error);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private handleSpecificErrors(error: AxiosError) {
    if (
      error.code === "ERR_NETWORK" ||
      error.message.includes("Network Error")
    ) {
      console.error("🌐 Network error - Backend server may not be running");
      console.error(
        '💡 Solution: Make sure to run "cd backend && npm run dev"'
      );
    }

    if (error.code === "ECONNREFUSED") {
      console.error("🔌 Connection refused - Backend server is not accessible");
    }

    if (error.response?.status === 404) {
      console.warn("🔍 API endpoint not found:", error.config?.url);
    }

    if (error.response?.status >= 500) {
      console.error("🔥 Server error - Backend may have crashed");
    }
  }

  private clearAuthAndRedirect() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    // Only redirect if not already on login page
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  private processQueue(token: string | null, error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private generateRequestId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = "Bearer ***";
    }
    return sanitized;
  }

  private normalizeError(error: AxiosError): any {
    // Create standardized error object
    const normalizedError = {
      message: "An error occurred",
      code: "UNKNOWN_ERROR",
      statusCode: 0,
      details: null,
      originalError: error,
    };

    if (error.response) {
      // Server responded with error status
      normalizedError.statusCode = error.response.status;
      normalizedError.message = error.response.data?.message || error.message;
      normalizedError.code =
        error.response.data?.code || `HTTP_${error.response.status}`;
      normalizedError.details = error.response.data;
    } else if (error.request) {
      // Network error
      normalizedError.message = "Network error - unable to reach server";
      normalizedError.code = "NETWORK_ERROR";
      normalizedError.statusCode = 0;
    } else {
      // Request setup error
      normalizedError.message = error.message;
      normalizedError.code = "REQUEST_ERROR";
    }

    return normalizedError;
  }

  // Helper method to clean parameters
  private cleanParams(params: any): any {
    if (!params) return undefined;

    const cleaned: any = {};
    Object.keys(params).forEach((key) => {
      const value = params[key];
      // Only include non-empty values
      if (value !== "" && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });

    // Return undefined if no valid params
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  // ================================
  // BASIC HTTP METHODS
  // ================================

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    // Clean params before making request
    if (config?.params) {
      config.params = this.cleanParams(config.params);
    }

    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // ================================
  // FILE UPLOAD METHODS
  // ================================

  async upload<T = any>(
    url: string,
    file: File,
    data?: any,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (data) {
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
    }

    const response = await this.api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    return response.data;
  }

  async uploadMultiple<T = any>(
    url: string,
    files: File[],
    data?: any,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    // Append files
    files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Append additional data
    if (data) {
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
    }

    const response = await this.api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    return response.data;
  }

  // ================================
  // DOWNLOAD METHODS
  // ================================

  async download(
    url: string,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<Blob> {
    const response = await this.api.get(url, {
      ...config,
      responseType: "blob",
    });

    // If filename is provided, trigger download
    if (filename) {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }

    return response.data;
  }

  async downloadWithProgress(
    url: string,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const response = await this.api.get(url, {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    // Trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return response.data;
  }

  // ================================
  // TOKEN MANAGEMENT
  // ================================

  setToken(token: string) {
    localStorage.setItem("auth_token", token);
    this.api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeToken() {
    localStorage.removeItem("auth_token");
    delete this.api.defaults.headers.Authorization;
  }

  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  // ================================
  // UTILITY METHODS
  // ================================

  // Test backend connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get("/test", { timeout: 5000 });
      console.log("✅ Backend connection test successful:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
      return false;
    }
  }

  // Get API health status
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    services: any;
    version: string;
  }> {
    const response = await this.api.get("/health");
    return response.data;
  }

  // Retry failed request
  async retry<T = any>(
    method: "get" | "post" | "put" | "patch" | "delete",
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    maxRetries: number = 3
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let response: AxiosResponse;

        switch (method) {
          case "get":
            response = await this.api.get(url, config);
            break;
          case "post":
            response = await this.api.post(url, data, config);
            break;
          case "put":
            response = await this.api.put(url, data, config);
            break;
          case "patch":
            response = await this.api.patch(url, data, config);
            break;
          case "delete":
            response = await this.api.delete(url, config);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        return response.data;
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.warn(
            `🔄 Retrying request (attempt ${
              attempt + 1
            }/${maxRetries}) after ${delay}ms`
          );
        }
      }
    }

    throw lastError;
  }

  // Cancel all pending requests
  cancelAllRequests() {
    // This would require implementing request cancellation with AbortController
    console.warn("Request cancellation not implemented yet");
  }

  // Set request timeout
  setTimeout(timeout: number) {
    this.api.defaults.timeout = timeout;
  }

  // Set base URL
  setBaseURL(baseURL: string) {
    this.api.defaults.baseURL = baseURL;
  }

  // Add request interceptor
  addRequestInterceptor(
    onFulfilled?: (
      config: AxiosRequestConfig
    ) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: any) => any
  ) {
    return this.api.interceptors.request.use(onFulfilled, onRejected);
  }

  // Add response interceptor
  addResponseInterceptor(
    onFulfilled?: (
      response: AxiosResponse
    ) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ) {
    return this.api.interceptors.response.use(onFulfilled, onRejected);
  }

  // Remove interceptor
  removeInterceptor(type: "request" | "response", interceptorId: number) {
    if (type === "request") {
      this.api.interceptors.request.eject(interceptorId);
    } else {
      this.api.interceptors.response.eject(interceptorId);
    }
  }

  // Get axios instance (for advanced usage)
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  // ================================
  // BATCH REQUESTS
  // ================================

  // Execute multiple requests in parallel
  async batch<T = any>(
    requests: Array<{
      method: "get" | "post" | "put" | "patch" | "delete";
      url: string;
      data?: any;
      config?: AxiosRequestConfig;
    }>
  ): Promise<Array<ApiResponse<T> | Error>> {
    const promises = requests.map(async (request) => {
      try {
        switch (request.method) {
          case "get":
            return await this.get<T>(request.url, request.config);
          case "post":
            return await this.post<T>(
              request.url,
              request.data,
              request.config
            );
          case "put":
            return await this.put<T>(request.url, request.data, request.config);
          case "patch":
            return await this.patch<T>(
              request.url,
              request.data,
              request.config
            );
          case "delete":
            return await this.delete<T>(request.url, request.config);
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
      } catch (error) {
        return error as Error;
      }
    });

    return Promise.all(promises);
  }

  // ================================
  // ERROR HANDLING UTILITIES
  // ================================

  // Check if error is network error
  isNetworkError(error: any): boolean {
    return (
      error.code === "NETWORK_ERROR" ||
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    );
  }

  // Check if error is authentication error
  isAuthError(error: any): boolean {
    return error.statusCode === 401;
  }

  // Check if error is authorization error
  isAuthorizationError(error: any): boolean {
    return error.statusCode === 403;
  }

  // Check if error is validation error
  isValidationError(error: any): boolean {
    return error.statusCode === 400 && error.code === "VALIDATION_ERROR";
  }

  // Check if error is server error
  isServerError(error: any): boolean {
    return error.statusCode >= 500;
  }

  // Get user-friendly error message
  getErrorMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    if (this.isAuthError(error)) {
      return "Your session has expired. Please log in again.";
    }

    if (this.isAuthorizationError(error)) {
      return "You do not have permission to perform this action.";
    }

    if (this.isServerError(error)) {
      return "Server error occurred. Please try again later.";
    }

    return error.message || "An unexpected error occurred.";
  }
}

// Create and export singleton instance
export default new ApiService();
