import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import type {
  ApiResponse,
  ManualSubscriptionAssignRequest,
  ManualSubscriptionAssignResponse,
  ManualSubscriptionLookupQuery,
  ManualSubscriptionLookupResponse,
  ManualTransactionDetailsResponse,
  SubscriptionPlansResponse,
} from "../types";

export class ManualSubscriptionService {
  static async getPlans(): Promise<ApiResponse<SubscriptionPlansResponse>> {
    return apiClient.get<SubscriptionPlansResponse>(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.PLANS);
  }

  static async getTransactionDetails(
    transactionId: string,
    userId: string,
  ): Promise<ApiResponse<ManualTransactionDetailsResponse>> {
    const params = new URLSearchParams();
    params.set("transactionId", transactionId);
    params.set("userId", userId);
    return apiClient.get<ManualTransactionDetailsResponse>(
      `${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.MANUAL_TRANSACTION_QUERY}?${params.toString()}`,
    );
  }

  static async lookup(
    query: ManualSubscriptionLookupQuery,
  ): Promise<ApiResponse<ManualSubscriptionLookupResponse>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    const endpoint = params.toString()
      ? `${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.MANUAL_LOOKUP}?${params.toString()}`
      : API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.MANUAL_LOOKUP;

    return apiClient.get<ManualSubscriptionLookupResponse>(endpoint);
  }

  static async assign(
    payload: ManualSubscriptionAssignRequest,
  ): Promise<ApiResponse<ManualSubscriptionAssignResponse>> {
    return apiClient.post<ManualSubscriptionAssignResponse>(
      API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.MANUAL_ASSIGN,
      payload,
    );
  }
}

