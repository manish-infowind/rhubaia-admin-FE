import { API_CONFIG } from '../config';
import { apiClient } from '../client';
import { authStorage } from '@/lib/authStorage';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  bio?: string;
  avatar: string;
  role: string;
  joinDate: string;
  lastLogin: string;
  lastPasswordChange?: {
    changedAt: string;
    changedAtFormatted: string;
    changedBy: string;
    reason: string;
    timeAgo: string;
  };
  isActive: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
  preferences?: {
    theme?: string;
    language?: string;
    notifications: {
      email: boolean;
      push?: boolean;
    };
  };
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyOtpRequest {
  otp: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface TwoFactorSetupRequest {
  // No additional data needed for setup
}

export interface TwoFactorEnableRequest {
  otp: string;
}

export interface TwoFactorDisableRequest {
  otp: string;
}

export interface Verify2FARequest {
  otp: string;
  tempToken: string;
}

export interface UserActivity {
  id: string;
  action: string;
  entity: string;
  entityName: string;
  timestamp: string;
  type: string;
  details: string;
}

export interface UpdatePreferencesRequest {
  theme?: string;
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

class ProfileService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Get user ID from localStorage
   */
  private getUserId(): string | null {
    const userData = authStorage.getCurrentUser<{ id?: string; userId?: string }>();
    return userData?.id || userData?.userId || null;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE}`;
      
      const response = await apiClient.get(url);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          // Wrapped format: { success: true, data: {...} }
          return response as ApiResponse<UserProfile>;
        } else if ('data' in response && response.data) {
          // Direct format: { data: {...} }
          return {
            success: true,
            data: response.data as UserProfile,
            message: 'Profile retrieved successfully'
          };
        } else {
          // Direct format: { id: "...", firstName: "...", ... }
          return {
            success: true,
            data: response as unknown as UserProfile,
            message: 'Profile retrieved successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE}`;
      
      const response = await apiClient.put(url, profileData);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          // Wrapped format: { success: true, data: {...} }
          return response as ApiResponse<UserProfile>;
        } else if ('data' in response && response.data) {
          // Direct format: { data: {...} }
          return {
            success: true,
            data: response.data as UserProfile,
            message: 'Profile updated successfully'
          };
        } else {
          // Direct format: { id: "...", firstName: "...", ... }
          return {
            success: true,
            data: response as unknown as UserProfile,
            message: 'Profile updated successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File, userId?: string): Promise<ApiResponse<{ avatar: string; avatarUrl: string }>> {
    try {
      const targetUserId = userId || this.getUserId();
      const formData = new FormData();
      formData.append('file', file);
      
      const url = targetUserId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_AVATAR}?userId=${targetUserId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_AVATAR}`;

      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          // Wrapped format: { success: true, data: {...} }
          return response as ApiResponse<{ avatar: string; avatarUrl: string }>;
        } else if ('data' in response && response.data) {
          // Direct format: { data: {...} }
          return {
            success: true,
            data: response.data as { avatar: string; avatarUrl: string },
            message: 'Avatar uploaded successfully'
          };
        } else {
          // Direct format: { avatar: "...", avatarUrl: "..." }
          return {
            success: true,
            data: response as unknown as { avatar: string; avatarUrl: string },
            message: 'Avatar uploaded successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password (sends OTP)
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD}`;
      
      const response = await apiClient.put(url, passwordData);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          // Wrapped format: { success: true, data: {...} }
          return response as ApiResponse<void>;
        } else if ('data' in response && response.data) {
          // Direct format: { data: {...} }
          return {
            success: true,
            data: response.data,
            message: 'OTP sent successfully'
          };
        } else {
          // Direct format: { success: true, message: "..." }
          return {
            success: true,
            data: undefined,
            message: response.message || 'OTP sent successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      // Let the ApiClient's error handling work - don't override it
      throw error;
    }
  }

  /**
   * Verify OTP for password change
   */
  async verifyOtp(otpData: VerifyOtpRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_VERIFY_OTP}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_VERIFY_OTP}`;
      
      const response = await apiClient.post(url, otpData);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          // Wrapped format: { success: true, data: {...} }
          return response as ApiResponse<void>;
        } else if ('data' in response && response.data) {
          // Direct format: { data: {...} }
          return {
            success: true,
            data: response.data,
            message: 'OTP verified successfully'
          };
        } else {
          // Direct format: { success: true, message: "..." }
          return {
            success: true,
            data: undefined,
            message: response.message || 'OTP verified successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      // Let the ApiClient's error handling work - don't override it
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(resetData: ResetPasswordRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_RESET_REQUEST}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_RESET_REQUEST}`;
      
      const response = await apiClient.post(url, resetData);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          return response as ApiResponse<void>;
        } else if ('data' in response && response.data) {
          return {
            success: true,
            data: response.data,
            message: 'Password reset link sent successfully'
          };
        } else {
          return {
            success: true,
            data: undefined,
            message: response.message || 'Password reset link sent successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: ResetPasswordConfirmRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_RESET}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PASSWORD_RESET}`;
      
      const response = await apiClient.post(url, resetData);
      
      // Handle both wrapped and direct response formats
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          return response as ApiResponse<void>;
        } else if ('data' in response && response.data) {
          return {
            success: true,
            data: response.data,
            message: 'Password reset successfully'
          };
        } else {
          return {
            success: true,
            data: undefined,
            message: response.message || 'Password reset successfully'
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid response format'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Setup 2FA (send OTP)
   */
  async setup2FA(): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_SETUP}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_SETUP}`;
      
      const response = await apiClient.post<void>(url);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Enable 2FA
   */
  async enable2FA(otpData: TwoFactorEnableRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_ENABLE}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_ENABLE}`;
      
      const response = await apiClient.post<void>(url, otpData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(otpData: TwoFactorDisableRequest): Promise<ApiResponse<void>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_DISABLE}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_2FA_DISABLE}`;
      
      const response = await apiClient.post<void>(url, otpData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(page: number = 1, limit: number = 10): Promise<ApiResponse<UserActivity[]>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_ACTIVITY}?userId=${userId}&page=${page}&limit=${limit}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_ACTIVITY}?page=${page}&limit=${limit}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: UpdatePreferencesRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const userId = this.getUserId();
      const url = userId 
        ? `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PREFERENCES}?userId=${userId}`
        : `${this.baseUrl}${API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE_PREFERENCES}`;
      
      const response = await apiClient.put(url, preferences);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const { data, status } = error.response;
      
      // Check for specific error message in the response
      if (data?.message) {
        return new Error(data.message);
      }
      
      if (data?.error) {
        return new Error(data.error.message || 'An error occurred');
      }
      
      switch (status) {
        case 401:
          // For 401 errors, return the specific message from the response
          return new Error(data?.message || 'Unauthorized. Please login again.');
        case 403:
          return new Error('Access denied. You do not have permission to perform this action.');
        case 404:
          return new Error('Profile not found.');
        case 422:
          return new Error('Validation failed. Please check your input.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error('An unexpected error occurred.');
      }
    }
    
    if (error.request) {
      return new Error('Network error. Please check your connection.');
    }
    
    return new Error('An error occurred while processing your request.');
  }
}

export const profileService = new ProfileService(); 
