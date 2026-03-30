import { useState, useEffect, useCallback } from 'react';
import { 
  profileService, 
  UserProfile, 
  UpdateProfileRequest, 
  ChangePasswordRequest as ProfileChangePasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
  UpdatePreferencesRequest,
  UserActivity
} from '../services/profileService';
import { PasswordService } from '../services/passwordService';
import { ChangePasswordRequest } from '../types';
import { useToast } from '@/hooks/use-toast';

export interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  uploadingAvatar: boolean;
  changingPassword: boolean;
  verifyingOtp: boolean;
  requestingReset: boolean;
  resettingPassword: boolean;
  updatingPreferences: boolean;
  loadingActivity: boolean;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<boolean>;
  requestPasswordReset: (data: ResetPasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordConfirmRequest) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<void>;
  getUserActivity: (page?: number, limit?: number) => Promise<UserActivity[]>;
  resetError: () => void;
}

export function useProfile(): UseProfileReturn {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start with true so component shows loading state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await profileService.getProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.message || 'Failed to load profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await profileService.updateProfile(data);
      
      if (response.success && response.data) {
        // Merge the updated data with existing profile to preserve fields like role, joinDate, etc.
        setProfile(prevProfile => {
          if (prevProfile) {
            return {
              ...prevProfile,
              ...response.data,
            };
          }
          return response.data;
        });
        toast({
          title: "Success",
          description: response.message || "Profile updated successfully",
        });
      } else {
        setError(response.message || 'Failed to update profile');
        toast({
          title: "Error",
          description: response.message || 'Failed to update profile',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const uploadAvatar = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    setUploadingAvatar(true);
    setError(null);
    
    try {
      // Simulate upload progress if no progress callback provided
      if (!onProgress) {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 20 + 10; // Random increment between 10-30
          if (progress >= 90) {
            clearInterval(progressInterval);
            onProgress?.(90);
          } else {
            onProgress?.(progress);
          }
        }, 300);
        
        setTimeout(() => {
          clearInterval(progressInterval);
        }, 3000);
      }
      
      const response = await profileService.uploadAvatar(file);
      
      if (response.success && response.data) {
        // Update the profile with new avatar immediately
        setProfile(prev => prev ? {
          ...prev,
          avatar: response.data!.avatar
        } : null);
        
        // Don't refresh the full profile immediately to prevent glitches
        // The avatar URL will be updated through the profile state change
        
        toast({
          title: "Success",
          description: response.message || "Avatar uploaded successfully",
        });
      } else {
        setError(response.message || 'Failed to upload avatar');
        toast({
          title: "Error",
          description: response.message || 'Failed to upload avatar',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  }, [toast]);

  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<boolean> => {
    setChangingPassword(true);
    setError(null);
    
    try {
      // Use the new PasswordService for change password
      const response = await PasswordService.changePassword(data);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || response.message || "Password changed successfully",
        });
        return true;
      } else {
        setError(response.message || 'Failed to change password');
        // Don't show toast error - let the modal handle it
        return false;
      }
    } catch (err) {
      // Handle ApiError objects from ApiClient
      let errorMessage = 'Failed to change password';
      if (err && typeof err === 'object') {
        if ('message' in err) {
          errorMessage = (err as any).message;
        } else if ('data' in err && (err as any).data?.message) {
          errorMessage = (err as any).data.message;
        }
      }
      setError(errorMessage);
      // Don't show toast error - let the modal handle it
      return false;
    } finally {
      setChangingPassword(false);
    }
  }, [toast]);

  const verifyOtp = useCallback(async (data: VerifyOtpRequest): Promise<boolean> => {
    setVerifyingOtp(true);
    setError(null);
    
    try {
      const response = await profileService.verifyOtp(data);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Password changed successfully",
        });
        
        // Refresh profile data to get updated lastPasswordChange info
        await loadProfile();
        
        return true;
      } else {
        setError(response.message || 'Failed to verify OTP');
        // Don't show toast error - let the modal handle it
        return false;
      }
    } catch (err) {
      // Handle ApiError objects from ApiClient
      let errorMessage = 'Failed to verify OTP';
      if (err && typeof err === 'object') {
        if ('message' in err) {
          errorMessage = (err as any).message;
        } else if ('data' in err && (err as any).data?.message) {
          errorMessage = (err as any).data.message;
        }
      }
      setError(errorMessage);
      // Don't show toast error - let the modal handle it
      return false;
    } finally {
      setVerifyingOtp(false);
    }
  }, [toast, loadProfile]);

  const requestPasswordReset = useCallback(async (data: ResetPasswordRequest) => {
    setRequestingReset(true);
    setError(null);
    
    try {
      const response = await profileService.requestPasswordReset(data);
      
      if (response.success) {
        toast({
          title: "Reset Link Sent",
          description: response.message || "Password reset link sent to your email",
        });
      } else {
        setError(response.message || 'Failed to send reset link');
        toast({
          title: "Error",
          description: response.message || 'Failed to send reset link',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRequestingReset(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (data: ResetPasswordConfirmRequest) => {
    setResettingPassword(true);
    setError(null);
    
    try {
      const response = await profileService.resetPassword(data);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Password reset successfully",
        });
      } else {
        setError(response.message || 'Failed to reset password');
        toast({
          title: "Error",
          description: response.message || 'Failed to reset password',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  }, [toast]);

  const updatePreferences = useCallback(async (data: UpdatePreferencesRequest) => {
    setUpdatingPreferences(true);
    setError(null);
    
    try {
      const response = await profileService.updatePreferences(data);
      
      if (response.success && response.data) {
        setProfile(response.data);
        toast({
          title: "Success",
          description: response.message || "Preferences updated successfully",
        });
      } else {
        setError(response.message || 'Failed to update preferences');
        toast({
          title: "Error",
          description: response.message || 'Failed to update preferences',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingPreferences(false);
    }
  }, [toast]);

  const getUserActivity = useCallback(async (page: number = 1, limit: number = 10): Promise<UserActivity[]> => {
    setLoadingActivity(true);
    setError(null);
    
    try {
      const response = await profileService.getUserActivity(page, limit);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to get user activity');
        toast({
          title: "Error",
          description: response.message || 'Failed to get user activity',
          variant: "destructive",
        });
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user activity';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoadingActivity(false);
    }
  }, [toast]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    saving,
    uploadingAvatar,
    changingPassword,
    verifyingOtp,
    requestingReset,
    resettingPassword,
    updatingPreferences,
    loadingActivity,
    loadProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    verifyOtp,
    requestPasswordReset,
    resetPassword,
    updatePreferences,
    getUserActivity,
    resetError,
  };
} 
