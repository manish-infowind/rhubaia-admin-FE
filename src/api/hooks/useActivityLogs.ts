import { useQuery } from "@tanstack/react-query";
import type { ActivityLogQueryParams } from "../types";
import { ActivityLogsService } from "../services/activityLogsService";

export const activityLogKeys = {
  all: ["activityLogs"] as const,
  lists: () => [...activityLogKeys.all, "list"] as const,
  list: (params?: ActivityLogQueryParams) => [...activityLogKeys.lists(), params] as const,
  users: () => [...activityLogKeys.all, "users"] as const,
  graph: (params?: Record<string, unknown>) => [...activityLogKeys.all, "graph", params] as const,
};

export const useActivityLogs = (params?: ActivityLogQueryParams) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityLogKeys.list(params || {}),
    queryFn: () => ActivityLogsService.getActivityLogs(params),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const logs = data?.data?.data || [];
  const pagination = data?.data
    ? {
        total: data.data.total,
        page: data.data.page,
        limit: data.data.limit,
        totalPages: data.data.totalPages,
      }
    : undefined;

  return { logs, pagination, isLoading, error, refetch };
};

export const useAdminUsers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityLogKeys.users(),
    queryFn: () => ActivityLogsService.getAdminUsers(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const users = data?.data?.users || [];
  return { users, isLoading, error, refetch };
};

export const useActivityLogsGraph = (params?: {
  adminId?: string;
  httpMethod?: string;
  search?: string;
  timeRange?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  days?: number;
}, options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: activityLogKeys.graph(params || {}),
    queryFn: () => ActivityLogsService.getActivityLogsGraph(params),
    enabled: options?.enabled ?? true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  return {
    graph: data?.data || null,
    isLoading,
    error,
    refetch,
  };
};

