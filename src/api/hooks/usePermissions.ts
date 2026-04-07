import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionService } from '../services/permissionService';
import { 
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignPermissionsRequest
} from '../types';
import { useToast } from '@/hooks/use-toast';

// Query keys for permissions
export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  list: () => [...permissionKeys.lists()] as const,
  details: () => [...permissionKeys.all, 'detail'] as const,
  detail: (adminId: string) => [...permissionKeys.details(), adminId] as const,
};

export const usePermissions = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all permissions
  const { data: permissions, isLoading: isLoadingPermissions, error: permissionsError } = useQuery({
    queryKey: permissionKeys.list(),
    queryFn: () => PermissionService.getAllPermissions(),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: (data: CreatePermissionRequest) => {
      return PermissionService.createPermission(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate permissions list to refetch
        queryClient.invalidateQueries({ queryKey: permissionKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Permission created successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to create permission';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Assign permissions mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: (data: AssignPermissionsRequest) => {
      return PermissionService.assignPermissions(data);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate admin permissions to refetch
        queryClient.invalidateQueries({ queryKey: permissionKeys.detail(variables.adminId) });
        toast({
          title: "Success",
          description: response.message || "Permissions assigned successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to assign permissions';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ permissionId, data }: { permissionId: number; data: UpdatePermissionRequest }) => {
      return PermissionService.updatePermission(permissionId, data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate permissions list to refetch
        queryClient.invalidateQueries({ queryKey: permissionKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Permission updated successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to update permission';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: number) => {
      return PermissionService.deletePermission(permissionId);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate permissions list to refetch
        queryClient.invalidateQueries({ queryKey: permissionKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Permission deleted successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to delete permission';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    // State
    permissions: permissions?.data?.permissions || [],
    isLoadingPermissions,
    permissionsError,
    
    // Actions
    createPermission: createPermissionMutation.mutate,
    updatePermission: (permissionId: number, data: UpdatePermissionRequest, options?: any) => {
      updatePermissionMutation.mutate({ permissionId, data }, options);
    },
    assignPermissions: assignPermissionsMutation.mutate,
    deletePermission: deletePermissionMutation.mutate,
    
    // Mutation states
    isCreatingPermission: createPermissionMutation.isPending,
    isUpdatingPermission: updatePermissionMutation.isPending,
    isAssigningPermissions: assignPermissionsMutation.isPending,
    isDeletingPermission: deletePermissionMutation.isPending,
    
    // Errors
    createPermissionError: createPermissionMutation.error,
    updatePermissionError: updatePermissionMutation.error,
    assignPermissionsError: assignPermissionsMutation.error,
    deletePermissionError: deletePermissionMutation.error,
  };
};

// Hook to get permissions for a specific admin
export const useAdminPermissions = (adminId: string) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: permissionKeys.detail(adminId),
    queryFn: () => PermissionService.getAdminPermissions(adminId),
    enabled: !!adminId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    adminPermissions: data?.data,
    isLoading,
    error,
  };
};

