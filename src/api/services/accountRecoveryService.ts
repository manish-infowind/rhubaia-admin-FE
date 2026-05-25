import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import type {
  ApiResponse,
  DeletedAccountsListParams,
  DeletedAccountsListResponse,
} from '../types';

export class AccountRecoveryService {
  static async getDeletedAccounts(
    params?: DeletedAccountsListParams,
  ): Promise<ApiResponse<DeletedAccountsListResponse>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    const url = `${API_CONFIG.ENDPOINTS.ACCOUNT_RECOVERY.LIST}${query ? `?${query}` : ''}`;
    return apiClient.get<DeletedAccountsListResponse>(url);
  }

  static async recoverAccount(id: string): Promise<ApiResponse<unknown>> {
    const url = API_CONFIG.ENDPOINTS.ACCOUNT_RECOVERY.RECOVER.replace(':id', id);
    return apiClient.post<unknown>(url);
  }
}
