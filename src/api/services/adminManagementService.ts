import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import {
  ApiResponse,
  AdminUser,
  CreateAdminRequest,
  UpdateAdminRequest,
  ChangePasswordRequest,
  AdminListResponse,
  AdminStats,
  QueryParams,
} from "../types";

type AdminApiRole = {
  id: number;
  roleName?: string;
  role_name?: string;
  description?: string;
};

type AdminApiItem = {
  id?: string;
  uuid?: string;
  username?: string;
  email: string;
  firstName?: string;
  first_name?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  lastName?: string;
  last_name?: string;
  role?: "admin" | "super_admin";
  phone?: string;
  countryCode?: string;
  country_code?: string;
  location?: string | null;
  bio?: string | null;
  profilePic?: string | null;
  avatar_url?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  twoFactorEnabled?: boolean;
  permissions?: string[];
  roles?: AdminApiRole[];
  isSuperAdmin?: boolean;
  is_super_admin?: boolean;
  lastLogin?: string | null;
  last_login_at?: string | null;
  is_online?: boolean;
  otp_expired_on?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

type AdminListApiResponse = {
  items?: AdminApiItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    total_pages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  data?: AdminUser[];
};

type AdminStatsApiResponse = {
  total?: number;
  active?: number;
  inactive?: number;
  online?: number;
  admins?: number;
  admin?: number;
  superAdmins?: number;
  super_admin?: number;
};

type CreateAdminApiRequest = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_super_admin?: boolean;
};

const normalizeAdminUser = (admin: AdminApiItem): AdminUser => {
  const normalizedRoles = (admin.roles || []).map((role) => ({
    id: role.id,
    roleName: role.roleName ?? role.role_name ?? "",
    description: role.description,
  }));

  const inferredRoleFromRoles = normalizedRoles[0]?.roleName?.toLowerCase();
  const derivedRole =
    admin.role ??
    ((admin.isSuperAdmin ?? admin.is_super_admin)
      ? "super_admin"
      : inferredRoleFromRoles === "super_admin"
        ? "super_admin"
        : "admin");

  const rawFullName = admin.fullName ?? admin.full_name ?? admin.name ?? "";
  const parsedNameParts = String(rawFullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const parsedFirstName = parsedNameParts[0] ?? "";
  const parsedLastName = parsedNameParts.slice(1).join(" ");
  const finalFirstName = admin.firstName ?? admin.first_name ?? parsedFirstName;
  const finalLastName = admin.lastName ?? admin.last_name ?? parsedLastName;
  const fullName =
    `${finalFirstName || ""} ${finalLastName || ""}`.trim() ||
    String(admin.email || "");

  return {
    id: admin.id ?? admin.uuid ?? "",
    username: admin.username,
    email: admin.email,
    firstName: finalFirstName,
    lastName: finalLastName,
    fullName,
    role: derivedRole,
    phone: admin.phone ?? "",
    countryCode: admin.countryCode ?? admin.country_code,
    location: admin.location ?? null,
    bio: admin.bio ?? null,
    profilePic: admin.profilePic ?? admin.avatar_url ?? null,
    isActive: admin.isActive ?? admin.is_active ?? true,
    twoFactorEnabled: admin.twoFactorEnabled ?? false,
    permissions: admin.permissions ?? [],
    roles: normalizedRoles,
    lastLogin: admin.lastLogin ?? admin.last_login_at ?? admin.otp_expired_on ?? null,
    createdAt: admin.createdAt ?? admin.created_at ?? "",
    updatedAt: admin.updatedAt ?? admin.updated_at ?? "",
  };
};

const normalizeAdminListResponse = (
  response: ApiResponse<AdminListApiResponse>,
): ApiResponse<AdminListResponse> => {
  if (!response.success || !response.data) {
    return response as ApiResponse<AdminListResponse>;
  }

  const rawItems = response.data.items ?? response.data.data ?? [];
  const rawPagination = response.data.pagination;
  const totalPages =
    rawPagination?.totalPages ?? rawPagination?.total_pages ?? 1;

  return {
    ...response,
    data: {
      data: rawItems.map(normalizeAdminUser),
      pagination: {
        page: rawPagination?.page ?? 1,
        limit: rawPagination?.limit ?? 10,
        total: rawPagination?.total ?? rawItems.length,
        totalPages,
        hasNextPage:
          rawPagination?.hasNextPage ?? (rawPagination?.page ?? 1) < totalPages,
        hasPrevPage:
          rawPagination?.hasPrevPage ?? (rawPagination?.page ?? 1) > 1,
      },
    },
  };
};

const normalizeAdminStatsResponse = (
  response: ApiResponse<AdminStatsApiResponse>,
): ApiResponse<AdminStats> => {
  if (!response.success || !response.data) {
    return response as ApiResponse<AdminStats>;
  }

  return {
    ...response,
    data: {
      total: response.data.total ?? 0,
      superAdmins: response.data.superAdmins ?? response.data.super_admin ?? 0,
      admins: response.data.admins ?? response.data.admin ?? 0,
      active: response.data.active ?? 0,
      inactive: response.data.inactive ?? 0,
      online: response.data.online ?? 0,
    },
  };
};

export class AdminManagementService {
  // Get all admins with pagination and filters
  static async getAdmins(
    params?: QueryParams,
  ): Promise<ApiResponse<AdminListResponse>> {
    try {
      const searchParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = `${API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.LIST}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const response = await apiClient.get<AdminListApiResponse>(url);
      return normalizeAdminListResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get admin statistics
  static async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    try {
      const response = await apiClient.get<AdminStatsApiResponse>(
        API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.STATS,
      );
      return normalizeAdminStatsResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get single admin details
  static async getAdmin(id: string): Promise<ApiResponse<AdminUser>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.DETAILS.replace(
        ":id",
        id,
      );
      const response = await apiClient.get<AdminUser>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Create new admin
  static async createAdmin(
    data: CreateAdminRequest,
  ): Promise<ApiResponse<AdminUser>> {
    try {
      const payload: CreateAdminApiRequest = {
        email: data.email,
        password: data.password,
        first_name: data.firstName || undefined,
        last_name: data.lastName || undefined,
        is_super_admin: data.role === "super_admin",
      };

      const response = await apiClient.post<AdminUser>(
        API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.CREATE,
        payload,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update admin
  static async updateAdmin(
    id: string,
    data: UpdateAdminRequest,
  ): Promise<ApiResponse<AdminUser>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.UPDATE.replace(
        ":id",
        id,
      );
      const response = await apiClient.put<AdminUser>(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete admin
  static async deleteAdmin(id: string): Promise<ApiResponse<void>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.DELETE.replace(
        ":id",
        id,
      );
      const response = await apiClient.delete<void>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Toggle admin status (activate/deactivate)
  static async toggleAdminStatus(id: string): Promise<ApiResponse<AdminUser>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.TOGGLE_STATUS.replace(
        ":id",
        id,
      );
      const response = await apiClient.put<AdminUser>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Change admin password
  static async changeAdminPassword(
    id: string,
    data: ChangePasswordRequest,
  ): Promise<ApiResponse<void>> {
    try {
      const url = API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.CHANGE_PASSWORD.replace(
        ":id",
        id,
      );
      const response = await apiClient.put<void>(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
