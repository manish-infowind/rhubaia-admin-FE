import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, HTTP_STATUS, API_ERROR_TYPES } from './config';
import { ApiResponse, ApiError, ApiRequestOptions } from './types';
import { getMockResponse } from './mockService';
import { AUTH_LOGOUT_EVENT, authStorage } from '@/lib/authStorage';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
    this.timeout = API_CONFIG.TIMEOUT;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: this.defaultHeaders,
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Only handle token refresh for authenticated requests (not login, refresh, or password operations)
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          const isRefreshRequest = error.config?.url?.includes('/auth/refresh');
          const isPasswordRequest = error.config?.url?.includes('/password');
          
          if (!isLoginRequest && !isRefreshRequest && !isPasswordRequest && this.getAuthToken()) {
            try {
              // Try to refresh the token
              const success = await this.refreshToken();
              
              if (success) {
                // Retry the original request with new token
                const originalRequest = error.config;
                originalRequest.headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
                return this.axiosInstance.request(originalRequest);
              } else {
                // Refresh failed, clear tokens
                // Don't redirect here - let ProtectedRoute handle client-side navigation
                this.clearAuthTokens();
                // Dispatch custom event for components that need to handle logout
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
                }
                return Promise.reject(error);
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens
              // Don't redirect here - let ProtectedRoute handle client-side navigation
              this.clearAuthTokens();
              // Dispatch custom event for components that need to handle logout
              if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
                }
                return Promise.reject(error);
              }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Get authentication token from localStorage
  private getAuthToken(): string | null {
    return authStorage.getAccessToken();
  }

  // Get refresh token from localStorage
  private getRefreshToken(): string | null {
    return authStorage.getRefreshToken();
  }

  // Set authentication tokens
  private setAuthTokens(accessToken: string, refreshToken: string): void {
    authStorage.setTokens(accessToken, refreshToken);
  }

  // Clear authentication tokens
  private clearAuthTokens(): void {
    authStorage.clearAuth();
  }

  // Handle token expired
  private async handleTokenExpired(): Promise<void> {
    try {
      const success = await this.refreshToken();
      if (!success) {
        this.clearAuthTokens();
        // Don't redirect automatically - let the component handle it
      }
    } catch (error) {
      this.clearAuthTokens();
      // Don't redirect automatically - let the component handle it
    }
  }

  // Handle API errors
  private handleError(error: any): ApiError {
    let apiError: ApiError = {
      type: API_ERROR_TYPES.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };

    if (error.code === 'ECONNABORTED') {
      apiError = {
        type: API_ERROR_TYPES.TIMEOUT_ERROR,
        message: 'Request timeout',
        timestamp: new Date().toISOString(),
      };
    } else if (error.message === 'Network Error') {
      apiError = {
        type: API_ERROR_TYPES.NETWORK_ERROR,
        message: 'Network error - please check your connection',
        timestamp: new Date().toISOString(),
      };
    } else if (error.response) {
      const { status, data } = error.response;
      apiError = {
        type: this.getErrorType(status),
        message: data?.message || data?.error || `HTTP ${status} error`,
        status,
        errors: data?.errors,
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      apiError = {
        type: API_ERROR_TYPES.NETWORK_ERROR,
        message: 'No response received from server',
        timestamp: new Date().toISOString(),
      };
    }

    return apiError;
  }

  // Get error type based on HTTP status
  private getErrorType(status: number): string {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return API_ERROR_TYPES.VALIDATION_ERROR;
      case HTTP_STATUS.UNAUTHORIZED:
        return API_ERROR_TYPES.AUTHENTICATION_ERROR;
      case HTTP_STATUS.FORBIDDEN:
        return API_ERROR_TYPES.AUTHORIZATION_ERROR;
      case HTTP_STATUS.NOT_FOUND:
        return API_ERROR_TYPES.NOT_FOUND_ERROR;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return API_ERROR_TYPES.SERVER_ERROR;
      default:
        return API_ERROR_TYPES.UNKNOWN_ERROR;
    }
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      signal,
    } = options;

    // Skip mock responses for roles, permissions, admin management, and auth - use real APIs
    // Keep mock service for user/profile endpoints for testing
    const skipMockEndpoints = [
      '/login',
      '/forgot-password',
      '/reset-password',
      '/change-password',
      '/users',
      '/permissions',
      '/roles',
      '/admins',
      '/admin-management',
      '/roles/assign',
      '/permissions/assign',
      '/roles/create',
      '/permissions/create',
      '/roles/permissions',
      '/admins/',
    ];
    
    // Normalize endpoint for comparison (remove base URL and query params)
    const normalizedEndpoint = endpoint.replace(this.baseURL, '').split('?')[0];
    
    // Don't skip if it's an admin-profile endpoint - keep mock for testing
    // Check if it's a profile endpoint (with or without query params)
    const isAdminProfileEndpoint = normalizedEndpoint.includes('/admin-profile') || 
                                  normalizedEndpoint === '/admin-profile' ||
                                  normalizedEndpoint.startsWith('/admin-profile');
    
    const shouldSkipMock = !isAdminProfileEndpoint && skipMockEndpoints.some(skipEndpoint => 
      normalizedEndpoint.includes(skipEndpoint) || endpoint.includes(skipEndpoint)
    );
    
    if (!shouldSkipMock) {
      // Try to get mock response first for other endpoints
      // Extract params from URL if present
      const urlParams = endpoint.includes('?') ? new URLSearchParams(endpoint.split('?')[1]) : undefined;
      const mockResponse = await getMockResponse<T>(endpoint, method, body, urlParams);
      if (mockResponse !== null) {
        return mockResponse;
      }
    }

    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      headers,
      timeout,
      signal,
    };

    if (body && method !== 'GET') {
      config.data = body;
    }

    try {
      const response: AxiosResponse<any> = await this.axiosInstance.request(config);
      
      // Transform API response format to match our ApiResponse type
      // API returns: { statusCode, message, data }
      // We expect: { success, message, data }
      if (response.data) {
        const apiData = response.data;
        
        // Check if it's the new API format (has statusCode)
        if ('statusCode' in apiData) {
          const isSuccess = apiData.statusCode >= 200 && apiData.statusCode < 300;
          
          // If error status code, throw error with message
          if (!isSuccess) {
            const errorMessage = apiData.message || `Request failed with status ${apiData.statusCode}`;
            const apiError: ApiError = {
              type: this.getErrorType(apiData.statusCode),
              message: errorMessage,
              status: apiData.statusCode,
              timestamp: new Date().toISOString(),
            };
            throw apiError;
          }
          
          return {
            success: isSuccess,
            data: apiData.data,
            message: apiData.message,
          } as ApiResponse<T>;
        }
        
        // Otherwise, assume it's already in the expected format
        return apiData as ApiResponse<T>;
      }
      
      return response.data as ApiResponse<T>;
    } catch (error) {
      // If it's already an ApiError, re-throw it
      if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
        throw error;
      }
      
      // Otherwise, handle it
      const apiError = this.handleError(error);
      throw apiError;
    }
  }

  // Convenience methods for different HTTP methods
  async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload method
  async upload<T = any>(endpoint: string, formData: FormData, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: endpoint,
      data: formData,
      headers: {
        ...options?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.request(config);
      return response.data;
    } catch (error) {
      const apiError = this.handleError(error);
      throw apiError;
    }
  }

  // Refresh token method
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await this.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      if (response.success && response.data) {
        const { accessToken, user } = response.data;
        
        // Update access token
        authStorage.setTokens(accessToken);
        
        // Update user data if provided
        if (user) {
          authStorage.setCurrentUser(user);
        }
        
        return true;
      }

      return false;
    } catch (error) {
      this.clearAuthTokens();
      return false;
    }
  }

  // Logout method
  logout(): void {
    this.clearAuthTokens();
    // You can also call the logout endpoint here if needed
    // this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient; 
