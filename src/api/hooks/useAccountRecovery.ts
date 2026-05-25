import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AccountRecoveryService } from '../services/accountRecoveryService';
import type { DeletedAccountsListParams, DeletedAccountsPagination, DeletedAccountItem } from '../types';

export const accountRecoveryKeys = {
  all: ['account-recovery'] as const,
  lists: () => [...accountRecoveryKeys.all, 'list'] as const,
  list: (params?: DeletedAccountsListParams) => [...accountRecoveryKeys.lists(), params] as const,
};

const toBool = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const normalizeDeletedAccountItem = (raw: Record<string, unknown>): DeletedAccountItem => {
  const user = (raw.user ?? {}) as Record<string, unknown>;

  return {
    id: Number(raw.id ?? 0),
    uuid: String(raw.uuid ?? ""),
    user_id: String(raw.user_id ?? ""),
    user: {
      email: String(user.email ?? ""),
      full_name: String(user.full_name ?? user.fullName ?? ""),
      username: String(user.username ?? ""),
      is_deleted: toBool(user.is_deleted ?? user.isDeleted),
      is_active: toBool(user.is_active ?? user.isActive),
    },
    deletion_reason: (raw.deletion_reason ?? raw.deletionReason ?? null) as string | null,
    deletion_type: String(raw.deletion_type ?? raw.deletionType ?? ""),
    deleted_by_user_id: (raw.deleted_by_user_id ?? raw.deletedByUserId ?? null) as string | null,
    deleted_by_admin_id: (raw.deleted_by_admin_id ?? raw.deletedByAdminId ?? null) as string | null,
    is_permanent_delete: toBool(raw.is_permanent_delete ?? raw.isPermanentDelete),
    retention_until: (raw.retention_until ?? raw.retentionUntil ?? null) as string | null,
    is_recoverable: toBool(raw.is_recoverable ?? raw.isRecoverable),
    can_recover: toBool(raw.can_recover ?? raw.canRecover),
    recovered_by_admin: toBool(raw.recovered_by_admin ?? raw.recoveredByAdmin),
    created_at: String(raw.created_at ?? raw.createdAt ?? ""),
    updated_at: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
};

const normalizePagination = (raw: Record<string, unknown> | undefined): DeletedAccountsPagination | undefined => {
  if (!raw) return undefined;

  const page = Number(raw.page ?? 1);
  const limit = Number(raw.limit ?? 20);
  const total = Number(raw.total ?? 0);
  const totalPages =
    Number(raw.totalPages ?? raw.total_pages ?? 0) || Math.ceil(total / Math.max(limit, 1));

  return {
    page,
    limit,
    offset: Number(raw.offset ?? (page - 1) * limit),
    total,
    totalPages,
    hasNextPage: Boolean(raw.hasNextPage ?? page < totalPages),
    hasPrevPage: Boolean(raw.hasPrevPage ?? page > 1),
  };
};

export const useDeletedAccounts = (
  params?: DeletedAccountsListParams,
  options?: { enabled?: boolean },
) => {
  const query = useQuery({
    queryKey: accountRecoveryKeys.list(params ?? {}),
    queryFn: () => AccountRecoveryService.getDeletedAccounts(params),
    enabled: options?.enabled !== false,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  const rawData = query.data?.data as { items?: Record<string, unknown>[]; pagination?: Record<string, unknown> } | undefined;
  const items = Array.isArray(rawData?.items)
    ? rawData.items.map((item) => normalizeDeletedAccountItem(item))
    : [];
  const pagination = normalizePagination(rawData?.pagination);

  return {
    items,
    pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useRecoverDeletedAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountRecoveryService.recoverAccount(id),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Account recovered",
          description: response.message || "The account has been restored successfully.",
        });
        queryClient.invalidateQueries({ queryKey: accountRecoveryKeys.lists() });
      }
    },
    onError: (error: { message?: string }) => {
      toast({
        title: "Recovery failed",
        description: error?.message || "Failed to recover account. Please try again.",
        variant: "destructive",
      });
    },
  });
};
