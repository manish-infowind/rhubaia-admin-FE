import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import type {
  AiUsageFilterState,
  AiUsageGraphResponse,
  AiUsageHistoryResponse,
  AiUsageOperationsResponse,
  ApiResponse,
} from '../types';

const appendCommonFilters = (
  params: URLSearchParams,
  filters: Partial<AiUsageFilterState>,
  options?: { includePagination?: boolean; includeDays?: boolean },
) => {
  if (filters.operation && filters.operation !== 'all') {
    params.set('operation', filters.operation);
  }

  if (typeof filters.success === 'boolean') {
    params.set('success', String(filters.success));
  }

  if (filters.userId) {
    params.set('user_id', filters.userId);
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  if (options?.includeDays && !filters.from && !filters.to && filters.days) {
    params.set('days', String(filters.days));
  }

  if (options?.includePagination) {
    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 20));
  }
};

export class AiUsageService {
  static async getAiUsageOperations(): Promise<ApiResponse<AiUsageOperationsResponse>> {
    return apiClient.get<AiUsageOperationsResponse>(API_CONFIG.ENDPOINTS.AI_USAGE.OPERATIONS);
  }

  static async getAiUsageHistory(
    filters: Partial<AiUsageFilterState>,
  ): Promise<ApiResponse<AiUsageHistoryResponse>> {
    const params = new URLSearchParams();
    appendCommonFilters(params, filters, { includePagination: true });

    const endpoint = params.toString()
      ? `${API_CONFIG.ENDPOINTS.AI_USAGE.HISTORY}?${params.toString()}`
      : API_CONFIG.ENDPOINTS.AI_USAGE.HISTORY;

    return apiClient.get<AiUsageHistoryResponse>(endpoint);
  }

  static async getAiUsageGraph(
    filters: Partial<AiUsageFilterState>,
  ): Promise<ApiResponse<AiUsageGraphResponse>> {
    const params = new URLSearchParams();
    appendCommonFilters(params, filters, { includeDays: true });

    const endpoint = params.toString()
      ? `${API_CONFIG.ENDPOINTS.AI_USAGE.GRAPH}?${params.toString()}`
      : API_CONFIG.ENDPOINTS.AI_USAGE.GRAPH;

    return apiClient.get<AiUsageGraphResponse>(endpoint);
  }
}
