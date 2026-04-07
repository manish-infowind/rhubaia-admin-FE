import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleService } from '../services/roleService';
import { 
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  AssignPermissionsToRoleRequest
} from '../types';
import { useToast } from '@/hooks/use-toast';

// Query keys for roles
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: () => [...roleKeys.lists()] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (adminId: string) => [...roleKeys.details(), adminId] as const,
  rolePermissions: (roleId: string | number) => [...roleKeys.all, 'permissions', roleId] as const,
};

export const useRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all roles
  const { data: roles, isLoading: isLoadingRoles, error: rolesError } = useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => RoleService.getAllRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => {
      return RoleService.createRole(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate roles list to refetch
        queryClient.invalidateQueries({ queryKey: roleKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Role created successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to create role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: (data: AssignRoleRequest) => {
      return RoleService.assignRole(data);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate admin roles to refetch
        queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.adminId) });
        toast({
          title: "Success",
          description: response.message || "Role assigned successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to assign role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Assign permissions to role mutation
  const assignPermissionsToRoleMutation = useMutation({
    mutationFn: (data: AssignPermissionsToRoleRequest) => {
      return RoleService.assignPermissionsToRole(data);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate role permissions to refetch
        queryClient.invalidateQueries({ queryKey: roleKeys.rolePermissions(variables.roleId) });
        toast({
          title: "Success",
          description: response.message || "Permissions assigned to role successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to assign permissions to role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string | number; data: UpdateRoleRequest }) => {
      return RoleService.updateRole(roleId, data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate roles list to refetch
        queryClient.invalidateQueries({ queryKey: roleKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Role updated successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to update role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string | number) => {
      return RoleService.deleteRole(roleId);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate roles list to refetch
        queryClient.invalidateQueries({ queryKey: roleKeys.list() });
        toast({
          title: "Success",
          description: response.message || "Role deleted successfully",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.data?.message || 'Failed to delete role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    // State
    roles: roles?.data?.roles || [],
    isLoadingRoles,
    rolesError,
    
    // Actions
    createRole: createRoleMutation.mutate,
    updateRole: (roleId: string | number, data: UpdateRoleRequest, options?: any) => {
      updateRoleMutation.mutate({ roleId, data }, options);
    },
    assignRole: assignRoleMutation.mutate,
    assignPermissionsToRole: assignPermissionsToRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,
    
    // Mutation states
    isCreatingRole: createRoleMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isAssigningRole: assignRoleMutation.isPending,
    isAssigningPermissionsToRole: assignPermissionsToRoleMutation.isPending,
    isDeletingRole: deleteRoleMutation.isPending,
    
    // Errors
    createRoleError: createRoleMutation.error,
    updateRoleError: updateRoleMutation.error,
    assignRoleError: assignRoleMutation.error,
    assignPermissionsToRoleError: assignPermissionsToRoleMutation.error,
    deleteRoleError: deleteRoleMutation.error,
  };
};

// Hook to get roles for a specific admin
export const useAdminRoles = (adminId: string) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: roleKeys.detail(adminId),
    queryFn: () => RoleService.getAdminRoles(adminId),
    enabled: !!adminId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    adminRoles: data?.data,
    isLoading,
    error,
  };
};

// Hook to get permissions for a specific role
export const useRolePermissions = (roleId: string | number | null | undefined) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: roleKeys.rolePermissions(String(roleId ?? "")),
    queryFn: () => RoleService.getRolePermissions(String(roleId)),
    enabled: Boolean(roleId && String(roleId).trim().length > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    rolePermissions: data?.data,
    isLoading,
    error,
  };
};

