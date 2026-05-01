import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ManualSubscriptionAssignRequest,
  ManualSubscriptionAssignResponse,
  ManualSubscriptionLookupQuery,
  ManualSubscriptionLookupResponse,
  ManualTransactionDetailsResponse,
  SubscriptionPlansResponse,
} from "../types";
import type { ApiResponse } from "../types";
import { ManualSubscriptionService } from "../services/manualSubscriptionService";

export const manualSubscriptionKeys = {
  all: ["manualSubscription"] as const,
  lookup: (query: ManualSubscriptionLookupQuery) => [...manualSubscriptionKeys.all, "lookup", query] as const,
  plans: () => [...manualSubscriptionKeys.all, "plans"] as const,
  transaction: (transactionId: string, userId: string) =>
    [...manualSubscriptionKeys.all, "transaction", transactionId, userId] as const,
};

export function useManualSubscriptionLookup(
  query: ManualSubscriptionLookupQuery | null,
  options?: { enabled?: boolean },
) {
  return useQuery<ApiResponse<ManualSubscriptionLookupResponse>>({
    queryKey: query ? manualSubscriptionKeys.lookup(query) : [...manualSubscriptionKeys.all, "lookup", "disabled"],
    queryFn: () => {
      if (!query) throw new Error("Lookup query is missing");
      return ManualSubscriptionService.lookup(query);
    },
    enabled: Boolean(query) && (options?.enabled ?? true),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useManualSubscriptionAssign() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<ManualSubscriptionAssignResponse>, unknown, ManualSubscriptionAssignRequest>({
    mutationFn: (payload) => ManualSubscriptionService.assign(payload),
    onSuccess: (_, variables) => {
      // Refresh user details after assignment
      queryClient.invalidateQueries({ queryKey: ["users", "detail", variables.userId] });
    },
  });
}

export function useSubscriptionPlans(options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<SubscriptionPlansResponse>>({
    queryKey: manualSubscriptionKeys.plans(),
    queryFn: () => ManualSubscriptionService.getPlans(),
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useManualTransactionDetails(
  params: { transactionId: string; userId: string } | null,
  options?: { enabled?: boolean },
) {
  return useQuery<ApiResponse<ManualTransactionDetailsResponse>>({
    queryKey: params
      ? manualSubscriptionKeys.transaction(params.transactionId, params.userId)
      : [...manualSubscriptionKeys.all, "transaction", "disabled"],
    queryFn: () => {
      if (!params) throw new Error("Transaction params are missing");
      return ManualSubscriptionService.getTransactionDetails(params.transactionId, params.userId);
    },
    enabled: Boolean(params?.transactionId) && Boolean(params?.userId) && (options?.enabled ?? true),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

