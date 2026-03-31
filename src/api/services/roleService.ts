import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import { 
  ApiResponse, 
  CreateRoleRequest,
  CreateRoleResponse,
  Role,
  UpdateRoleRequest,
  UpdateRoleResponse,
  RolesListResponse,
  AssignRoleRequest,
  AssignRoleResponse,
  AdminRolesResponse,
  AssignPermissionsToRoleRequest,
  AssignPermissionsToRoleResponse,
  RolePermissionsResponse
} from '../types';

type RoleApiItem = {
  id: number;
  roleName?: string;
  role_name?: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

const normalizeRole = (role: RoleApiItem): Role => ({
  id: role.id,
  roleName: role.roleName ?? role.role_name ?? '',
  description: role.description,
  isActive: role.isActive ?? role.is_active ?? true,
});

const normalizeRolesListResponse = (
  response: ApiResponse<RolesListResponse>,
): ApiResponse<RolesListResponse> => {
  if (!response.success || !response.data?.roles) {
    return response;
  }

  return {
    ...response,
    data: {
      ...response.data,
      roles: response.data.roles.map((role) => normalizeRole(role as RoleApiItem)),
    },
  };
};

export class RoleService {
  // Create a new role
  static async createRole(data: CreateRoleRequest): Promise<ApiResponse<CreateRoleResponse>> {
    try {
      const response = await apiClient.post<CreateRoleResponse>(
        API_CONFIG.ENDPOINTS.ROLES.CREATE,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all roles
  static async getAllRoles(): Promise<ApiResponse<RolesListResponse>> {
    try {
      const response = await apiClient.get<RolesListResponse>(
        API_CONFIG.ENDPOINTS.ROLES.LIST
      );
      return normalizeRolesListResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Assign role to an admin
  static async assignRole(data: AssignRoleRequest): Promise<ApiResponse<AssignRoleResponse>> {
    try {
      const response = await apiClient.post<AssignRoleResponse>(
        API_CONFIG.ENDPOINTS.ROLES.ASSIGN,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get roles for a specific admin
  static async getAdminRoles(adminId: string): Promise<ApiResponse<AdminRolesResponse>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ROLES.GET_BY_ADMIN.replace(':adminId', adminId);
      const response = await apiClient.get<AdminRolesResponse>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Assign permissions to a role
  static async assignPermissionsToRole(data: AssignPermissionsToRoleRequest): Promise<ApiResponse<AssignPermissionsToRoleResponse>> {
    try {
      const response = await apiClient.post<AssignPermissionsToRoleResponse>(
        API_CONFIG.ENDPOINTS.ROLES.ASSIGN_PERMISSIONS,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get permissions for a specific role
  static async getRolePermissions(roleId: number): Promise<ApiResponse<RolePermissionsResponse>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ROLES.GET_ROLE_PERMISSIONS.replace(':roleId', String(roleId));
      const response = await apiClient.get<RolePermissionsResponse>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update a role
  static async updateRole(roleId: number, data: UpdateRoleRequest): Promise<ApiResponse<UpdateRoleResponse>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ROLES.UPDATE.replace(':roleId', String(roleId));
      const response = await apiClient.put<UpdateRoleResponse>(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete a role
  static async deleteRole(roleId: number): Promise<ApiResponse<{ roleId: number }>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ROLES.DELETE.replace(':roleId', String(roleId));
      const response = await apiClient.delete<{ roleId: number }>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default RoleService;

