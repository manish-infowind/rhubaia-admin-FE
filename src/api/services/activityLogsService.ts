import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import type {
  ApiResponse,
  ActivityLogQueryParams,
  ActivityLogsResponse,
  AdminUsersResponse,
  ActivityLogsGraphResponse,
} from "../types";

export class ActivityLogsService {
  static async getActivityLogs(
    params?: ActivityLogQueryParams,
  ): Promise<ApiResponse<ActivityLogsResponse>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${API_CONFIG.ENDPOINTS.ACTIVITY_LOGS.LIST}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    return apiClient.get<ActivityLogsResponse>(url);
  }

  static async getAdminUsers(): Promise<ApiResponse<AdminUsersResponse>> {
    return apiClient.get<AdminUsersResponse>(API_CONFIG.ENDPOINTS.ACTIVITY_LOGS.USERS);
  }

  static async getActivityLogsGraph(params?: {
    adminId?: string;
    httpMethod?: string;
    search?: string;
    timeRange?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
    days?: number;
  }): Promise<ApiResponse<ActivityLogsGraphResponse>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${API_CONFIG.ENDPOINTS.ACTIVITY_LOGS.GRAPH}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    return apiClient.get<ActivityLogsGraphResponse>(url);
  }
}

