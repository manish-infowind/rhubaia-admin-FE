import { useQuery } from "@tanstack/react-query";
import {
  DashboardService,
  type FinanceSummaryResponse,
  type MonetizationFinanceAnalyticsResponse,
} from "@/api/services/dashboardService";

interface FinanceAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

const buildKey = (params: FinanceAnalyticsParams) => [
  "finance-analytics",
  params.startDate ?? null,
  params.endDate ?? null,
];

export const useFinanceAnalytics = (params: FinanceAnalyticsParams) => {
  const summaryQuery = useQuery<FinanceSummaryResponse>({
    queryKey: [...buildKey(params), "summary"],
    queryFn: async () => {
      const response = await DashboardService.getFinanceSummary(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch finance summary");
    },
    staleTime: 60_000,
  });

  const analyticsQuery = useQuery<MonetizationFinanceAnalyticsResponse>({
    queryKey: [...buildKey(params), "series"],
    queryFn: async () => {
      const response = await DashboardService.getMonetizationFinanceAnalytics(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch finance analytics");
    },
    staleTime: 60_000,
  });

  return {
    summary: summaryQuery.data ?? null,
    analytics: analyticsQuery.data ?? null,
    isLoadingSummary: summaryQuery.isLoading,
    isLoadingAnalytics: analyticsQuery.isLoading,
    summaryError: summaryQuery.error instanceof Error ? summaryQuery.error.message : null,
    analyticsError: analyticsQuery.error instanceof Error ? analyticsQuery.error.message : null,
  };
};
