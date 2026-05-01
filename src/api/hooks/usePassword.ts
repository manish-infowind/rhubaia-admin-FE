import { useMutation } from '@tanstack/react-query';
import { PasswordService } from '../services/passwordService';
import { 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ChangePasswordRequest 
} from '../types';
import { useToast } from '@/hooks/use-toast';

export const usePassword = () => {
  const { toast } = useToast();

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => {
      return PasswordService.forgotPassword(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Reset link requested",
          description: "If the email exists, we sent a reset link",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to send password reset email';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => {
      return PasswordService.resetPassword(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || response.message || "Password reset successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to reset password';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => {
      return PasswordService.changePassword(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || response.message || "Password changed successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to change password';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    // Forgot password
    forgotPassword: forgotPasswordMutation.mutate,
    isForgottingPassword: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    
    // Reset password
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
    
    // Change password
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,
  };
};

