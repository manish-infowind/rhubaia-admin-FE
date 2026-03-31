import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import { ApiResponse, UserListItem, UserDetails, UpdateUserRequest, UserListResponse, UserListParams, DeleteUserRequest } from '../types';

export class UserManagementService {
  /**
   * Get all users with pagination and filters
   */
  static async getUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = `${API_CONFIG.ENDPOINTS.USERS.LIST}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await apiClient.get<UserListResponse>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user details by ID
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserDetails>> {
    try {
      const url = API_CONFIG.ENDPOINTS.USERS.DETAILS.replace(':id', String(id));
      const response = await apiClient.get<UserDetails>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(id: number | string, data: UpdateUserRequest): Promise<ApiResponse<UserDetails>> {
    try {
      const url = API_CONFIG.ENDPOINTS.USERS.UPDATE.replace(':id', String(id));
      const response = await apiClient.put<UserDetails>(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle user pause status
   */
  static async toggleUserPause(id: number | string): Promise<ApiResponse<{ id: number | string; isAccountPaused: boolean; updatedAt: string }>> {
    try {
      const url = API_CONFIG.ENDPOINTS.USERS.PAUSE.replace(':id', String(id));
      const response = await apiClient.put<{ id: number; isAccountPaused: boolean; updatedAt: string }>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(id: number | string, deletionReason?: string): Promise<ApiResponse<null>> {
    try {
      const url = API_CONFIG.ENDPOINTS.USERS.DELETE.replace(':id', String(id));
      const requestData: DeleteUserRequest = deletionReason ? { deletionReason } : {};
      const response = await apiClient.delete<null>(url, deletionReason ? { body: requestData } : {});
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * (Ban/Unban removed from web admin UI)
   */
}

