import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminManagementService } from '../services/adminManagementService';
import { CreateAdminRequest, UpdateAdminRequest, ChangePasswordRequest, QueryParams } from '../types';
import { useToast } from '@/hooks/use-toast';

// Query keys for admin management
export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (params: QueryParams) => [...adminKeys.lists(), params] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

export const useAdminManagement = (params?: QueryParams) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get admins list
  const {
    data: adminsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: adminKeys.list(params || {}),
    queryFn: () => AdminManagementService.getAdmins(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get admin statistics
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => AdminManagementService.getAdminStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: CreateAdminRequest) => AdminManagementService.createAdmin(data),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Admin Created",
          description: "New admin has been created successfully.",
        });
        // Invalidate and refetch admins list
        queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create admin. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update admin mutation
  const updateAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminRequest }) =>
      AdminManagementService.updateAdmin(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Admin Updated",
          description: "Admin details have been updated successfully.",
        });
        // Invalidate and refetch admins list
        queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update admin. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => AdminManagementService.deleteAdmin(id),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Admin Deleted",
          description: "Admin has been deleted successfully.",
        });
        // Invalidate and refetch admins list
        queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete admin. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle admin status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => AdminManagementService.toggleAdminStatus(id),
    onSuccess: (response) => {
      if (response.success) {
        const isActive = response.data?.isActive;
        toast({
          title: isActive ? "Admin Activated" : "Admin Deactivated",
          description: `Admin has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
        });
        // Invalidate and refetch admins list
        queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to toggle admin status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordRequest }) =>
      AdminManagementService.changeAdminPassword(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Password Changed",
          description: "Admin password has been changed successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    admins: adminsData?.data?.data || [],
    stats: statsData?.data,
    pagination: adminsData?.data?.pagination || { 
      page: 1, 
      limit: 10, 
      total: 0, 
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    },

    // Loading states
    isLoading,
    isLoadingStats,
    isCreating: createAdminMutation.isPending,
    isUpdating: updateAdminMutation.isPending,
    isDeleting: deleteAdminMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,

    // Error states
    error: error?.message || null,

    // Actions
    createAdmin: createAdminMutation.mutate,
    updateAdmin: updateAdminMutation.mutate,
    deleteAdmin: deleteAdminMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    refetch,
  };
}; 
