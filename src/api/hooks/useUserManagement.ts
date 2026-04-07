import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { UserManagementService } from '../services/userManagementService';
import { UserListParams, UpdateUserRequest, UserListItem, UserDetails } from '../types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...userKeys.details(), id] as const,
};

export const useUserManagement = (params?: UserListParams) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getStableUserId = (raw: any): number => {
    if (typeof raw?.id === 'number' && Number.isFinite(raw.id)) {
      return raw.id;
    }

    const source = String(raw?.uuid ?? raw?.email ?? raw?.username ?? '');
    if (!source) {
      return 0;
    }

    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }

    return hash;
  };

  const getProfileCompletionLabel = (statusCode: number, fallback?: string | null) => {
    if (fallback) {
      return fallback;
    }

    switch (statusCode) {
      case 0:
        return 'email_not_verified';
      case 1:
        return 'email_verified';
      case 2:
        return 'profile_completed';
      default:
        return 'unknown';
    }
  };

  // Get users list
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: userKeys.list(params || {}),
    queryFn: () => UserManagementService.getUsers(params),
    // Keep list filters/network in sync; always refetch for current query key.
    staleTime: 0,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Normalize varying API shapes for users list endpoint.
  const normalizeUser = (raw: any): UserListItem => {
    const fullName = String(raw?.full_name ?? raw?.fullName ?? '').trim();
    const [first, ...rest] = fullName.split(/\s+/).filter(Boolean);
    const firstName = raw?.firstName ?? first ?? raw?.username ?? '';
    const lastName = raw?.lastName ?? rest.join(' ') ?? '';
    const profileCompletion = Number(
      raw?.profile_completion_status_code ??
      raw?.accountCurrentStatus ??
      0
    );
    const profile = raw?.profile || {};
    const mappedGender = String(profile?.gender ?? raw?.gender ?? 'o').toLowerCase();
    const gender = (mappedGender === 'm' || mappedGender === 'f' || mappedGender === 'o')
      ? mappedGender as 'm' | 'f' | 'o'
      : 'o';
    const avatarUrl = profile?.avatar_url ?? profile?.profile_image_url ?? raw?.profilePic ?? null;
    const isActive = Boolean(raw?.is_active ?? raw?.isActive);
    const isDeleted = Boolean(raw?.is_deleted ?? raw?.isDeleted);
    const accountStatus = String(raw?.account_status ?? '').toLowerCase();
    const profileCompletionStatus = getProfileCompletionLabel(
      profileCompletion,
      raw?.profile_completion_status ?? raw?.accountStatusDescription
    );

    return {
      id: getStableUserId(raw),
      uuid: String(raw?.uuid ?? ''),
      firstName,
      lastName,
      username: raw?.username ?? null,
      email: raw?.email ?? null,
      phone: String(raw?.contact ?? raw?.phone ?? ''),
      countryCode: String(raw?.country_code ?? raw?.countryCode ?? ''),
      gender,
      dob: raw?.dob ?? null,
      profilePic: avatarUrl,
      profileImages: Array.isArray(raw?.profileImages)
        ? raw.profileImages
        : [profile?.avatar_url, profile?.profile_image_url].filter(Boolean),
      isEmailVerified: Boolean(raw?.isEmailVerified ?? raw?.is_email_verified),
      isPhoneVerified: Boolean(raw?.isPhoneVerified ?? false),
      isFaceVerified: Boolean(raw?.isFaceVerified ?? false),
      isAccountPaused: Boolean(raw?.isAccountPaused ?? (!isActive && !isDeleted)),
      isBanned: Boolean(raw?.isBanned ?? false),
      accountCurrentStatus: profileCompletion,
      accountStatusName: raw?.accountStatusName ?? accountStatus ?? 'active',
      accountStatusDescription: raw?.accountStatusDescription ?? profileCompletionStatus,
      isDeleted,
      createdAt: String(raw?.sign_up_date ?? raw?.createdAt ?? raw?.created_at ?? ''),
      updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? ''),
    };
  };
  const parseDobToIso = (dob?: string | null): string | null => {
    if (!dob) return null;
    // Handles dd/MM/yyyy from profile-details API.
    const parts = String(dob).split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      const date = new Date(iso);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    const parsed = new Date(dob);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };
  const normalizeUserDetails = (raw: any): UserDetails => {
    const base = normalizeUser(raw);
    const profile = raw?.profile || {};
    const subscriptionCurrent = raw?.subscription?.current || {};
    const currentPlan = subscriptionCurrent?.plan;
    const currentSubscription = subscriptionCurrent?.subscription;
    const invoiceHistory = Array.isArray(subscriptionCurrent?.invoiceHistory)
      ? subscriptionCurrent.invoiceHistory
      : [];
    const subscriptionHistory = Array.isArray(raw?.subscription?.history)
      ? raw.subscription.history
      : [];
    const hasAnySubscription = Boolean(raw?.subscription?.has_any_subscription ?? raw?.subscription?.hasAnySubscription);
    const metadata = Array.isArray(currentPlan?.metadata) ? currentPlan.metadata : [];

    const profileImages = Array.from(
      new Set(
        [
          profile?.avatar_url,
          profile?.full_body_image_url,
          profile?.selfie_url,
        ].filter(Boolean)
      )
    );

    const mappedGender = String(profile?.gender || '').toLowerCase();
    const gender = (mappedGender === 'm' || mappedGender === 'f' || mappedGender === 'o')
      ? mappedGender as 'm' | 'f' | 'o'
      : base.gender;

    const firstPlan = currentPlan && currentSubscription ? {
      id: 1,
      subscriptionId: String(currentSubscription?.id || ''),
      planId: 0,
      planName: String(currentPlan?.name || 'Plan'),
      planPrice: Number(currentPlan?.price || 0),
      planDuration: `${currentPlan?.durationInterval || 1} ${currentPlan?.duration || ''}`.trim(),
      planFeatures: metadata,
      periodType: (currentPlan?.duration === 'week' ? 'week' : 'month') as 'week' | 'month',
      startDate: String(currentSubscription?.currentPeriodStart || ''),
      endDate: String(currentSubscription?.currentPeriodEnd || ''),
      autoRenew: true,
      status: String(currentSubscription?.status || 'active') as 'active' | 'paused' | 'cancelled' | 'expired',
      createdAt: String(invoiceHistory?.[0]?.createdAt || raw?.created_at || new Date().toISOString()),
      updatedAt: String(raw?.updated_at || new Date().toISOString()),
    } : null;

    const mapConnectedUser = (u: any) => ({
      uuid: String(u?.uuid || ''),
      email: u?.email ?? null,
      username: u?.username ?? null,
      fullName: u?.full_name ?? null,
      signUpDate: u?.sign_up_date ?? null,
      avatarUrl: u?.profile?.avatar_url ?? u?.profile?.profile_image_url ?? u?.profile_image_url ?? null,
      gender: u?.profile?.gender ?? null,
      currentCity: u?.profile?.current_city ?? null,
    });

    const mapConnectionItem = (item: any) => ({
      connectionUuid: String(item?.connection_uuid || ''),
      closetId: item?.closet_id ?? null,
      shareScope: item?.share_scope ?? null,
      accessType: item?.access_type ?? null,
      invitationStatus: item?.invitation_status ?? null,
      isRevoked: item?.is_revoked ?? undefined,
      status: item?.status ?? null,
      isBlurred: item?.is_blurred ?? undefined,
      revokedAt: item?.revoked_at ?? null,
      createdAt: item?.created_at ?? null,
      connectedUser: mapConnectedUser(
        item?.connected_user ??
        item?.user ??
        item?.granted_by ??
        item?.owner ??
        item?.delegate ??
        item?.shared_with ??
        null
      ),
    });

    const connectionHistoryRaw = raw?.connection_history ?? {};
    const connectionHistory = {
      sharedClosetWithUserByOthers: Array.isArray(connectionHistoryRaw?.shared_closet_with_user_by_others)
        ? connectionHistoryRaw.shared_closet_with_user_by_others.map(mapConnectionItem)
        : Array.isArray(connectionHistoryRaw?.closet_shared_with_me)
          ? connectionHistoryRaw.closet_shared_with_me.map(mapConnectionItem)
        : [],
      sharedClosetByUserWithOthers: Array.isArray(connectionHistoryRaw?.shared_closet_by_user_with_others)
        ? connectionHistoryRaw.shared_closet_by_user_with_others.map(mapConnectionItem)
        : Array.isArray(connectionHistoryRaw?.closet_shared_by_me)
          ? connectionHistoryRaw.closet_shared_by_me.map(mapConnectionItem)
        : [],
      delegatedToUserByOthers: Array.isArray(connectionHistoryRaw?.delegated_to_user_by_others)
        ? connectionHistoryRaw.delegated_to_user_by_others.map(mapConnectionItem)
        : Array.isArray(connectionHistoryRaw?.delegated_to_me)
          ? connectionHistoryRaw.delegated_to_me.map(mapConnectionItem)
        : [],
      delegatedByUserToOthers: Array.isArray(connectionHistoryRaw?.delegated_by_user_to_others)
        ? connectionHistoryRaw.delegated_by_user_to_others.map(mapConnectionItem)
        : Array.isArray(connectionHistoryRaw?.delegated_by_me)
          ? connectionHistoryRaw.delegated_by_me.map(mapConnectionItem)
        : [],
      summary: {
        sharedClosetWithUserByOthers: Number(connectionHistoryRaw?.summary?.shared_closet_with_user_by_others ?? 0),
        sharedClosetByUserWithOthers: Number(connectionHistoryRaw?.summary?.shared_closet_by_user_with_others ?? 0),
        delegatedToUserByOthers: Number(connectionHistoryRaw?.summary?.delegated_to_user_by_others ?? 0),
        delegatedByUserToOthers: Number(connectionHistoryRaw?.summary?.delegated_by_user_to_others ?? 0),
      },
    };
    // Support alternate summary keys from API.
    connectionHistory.summary.sharedClosetWithUserByOthers = connectionHistory.summary.sharedClosetWithUserByOthers || Number(connectionHistoryRaw?.summary?.closet_shared_with_me ?? 0);
    connectionHistory.summary.sharedClosetByUserWithOthers = connectionHistory.summary.sharedClosetByUserWithOthers || Number(connectionHistoryRaw?.summary?.closet_shared_by_me ?? 0);
    connectionHistory.summary.delegatedToUserByOthers = connectionHistory.summary.delegatedToUserByOthers || Number(connectionHistoryRaw?.summary?.delegated_to_me ?? 0);
    connectionHistory.summary.delegatedByUserToOthers = connectionHistory.summary.delegatedByUserToOthers || Number(connectionHistoryRaw?.summary?.delegated_by_me ?? 0);

    return {
      ...base,
      firstName: base.firstName || String(raw?.full_name || '').split(' ')[0] || '',
      lastName: base.lastName || String(raw?.full_name || '').split(' ').slice(1).join(' ') || '',
      phone: String(raw?.contact || base.phone || ''),
      countryCode: String(raw?.country_code || base.countryCode || ''),
      gender,
      dob: parseDobToIso(profile?.date_of_birth) || base.dob,
      profilePic: profile?.avatar_url || base.profilePic,
      profileImages,
      isAccountPaused: !Boolean(raw?.is_active),
      accountCurrentStatus: Number(raw?.profile_completion_status_code ?? base.accountCurrentStatus ?? 0),
      accountStatusName: String(raw?.profile_completion_status || raw?.account_status || base.accountStatusName || 'Unknown'),
      accountStatusDescription: String(raw?.account_status || base.accountStatusDescription || ''),
      createdAt: String(raw?.created_at || raw?.sign_up_date || base.createdAt || ''),
      updatedAt: String(raw?.updated_at || base.updatedAt || ''),
      isPausedByUser: false,
      profile: {
        height: profile?.height ?? null,
        education: null,
        relationshipGoal: null,
        voiceUrl: null,
        bio: null,
      },
      address: {
        cityId: null,
        cityName: profile?.current_city || null,
        countryId: null,
        lat: null,
        long: null,
        location: profile?.current_city || null,
        isVerified: true,
      },
      interactions: {
        receivedLikes: 0,
        givenLikes: 0,
        receivedSuperLikes: 0,
        givenSuperLikes: 0,
        passes: 0,
        blocks: 0,
      },
      subscriptions: firstPlan ? [firstPlan] : [],
      firstPlan,
      connectionHistory,
      subscriptionDetails: {
        hasAnySubscription,
        currentSubscription: currentSubscription ? {
          id: String(currentSubscription?.id || ''),
          platform: String(currentSubscription?.platform || ''),
          status: String(currentSubscription?.status || ''),
          currentPeriodStart: String(currentSubscription?.currentPeriodStart || ''),
          currentPeriodEnd: String(currentSubscription?.currentPeriodEnd || ''),
        } : null,
        currentPlan: currentPlan ? {
          id: String(currentPlan?.id || ''),
          name: String(currentPlan?.name || ''),
          price: Number(currentPlan?.price || 0),
          duration: String(currentPlan?.duration || ''),
          durationInterval: Number(currentPlan?.durationInterval || 1),
          isActive: Boolean(currentPlan?.isActive ?? true),
          metadata,
        } : null,
        invoiceHistory: invoiceHistory.map((inv: any) => ({
          id: String(inv?.id || ''),
          createdAt: String(inv?.createdAt || ''),
          amount: Number(inv?.amount || 0),
          currency: String(inv?.currency || ''),
          status: String(inv?.status || ''),
          platform: String(inv?.platform || ''),
          planId: String(inv?.planId || ''),
          planName: String(inv?.planName || ''),
        })),
        history: subscriptionHistory.map((inv: any) => ({
          id: String(inv?.id || ''),
          createdAt: String(inv?.createdAt || ''),
          amount: Number(inv?.amount || 0),
          currency: String(inv?.currency || ''),
          status: String(inv?.status || ''),
          platform: String(inv?.platform || ''),
          planId: String(inv?.planId || ''),
          planName: String(inv?.planName || ''),
        })),
      },
    };
  };

  const normalizePagination = (raw: any) => {
    if (!raw) return undefined;
    const page = Number(raw.page ?? 1);
    const limit = Number(raw.limit ?? 10);
    const total = Number(raw.total ?? 0);
    const totalPages = Number(raw.totalPages ?? raw.total_pages ?? 0) || Math.ceil(total / Math.max(limit, 1));
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: raw.hasNextPage ?? page < totalPages,
      hasPrevPage: raw.hasPrevPage ?? page > 1,
    };
  };

  // Extract users and pagination from response
  const rawData = usersData?.data as any;
  const rawItems = rawData?.items ?? rawData?.data ?? [];
  const users: UserListItem[] = Array.isArray(rawItems) ? rawItems.map(normalizeUser) : [];
  const pagination = normalizePagination(rawData?.pagination);

  // Get user details
  const useUserDetails = (id: number | string) => {
    return useQuery({
      queryKey: userKeys.detail(id),
      queryFn: async () => {
        const response = await UserManagementService.getUserById(id);
        const rawData = (response as any)?.data?.data ?? response?.data;
        if (response?.success && rawData) {
          return {
            ...response,
            data: normalizeUserDetails(rawData),
          };
        }
        return response;
      },
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateUserRequest }) =>
      UserManagementService.updateUser(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        toast({
          title: "User Updated",
          description: "User information has been updated successfully.",
        });
        // Invalidate and refetch users list and details
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle user pause mutation
  const togglePauseMutation = useMutation({
    mutationFn: (id: number | string) => UserManagementService.toggleUserPause(id),
    onSuccess: (response, id) => {
      if (response.success) {
        const isPaused = response.data?.isAccountPaused;
        toast({
          title: isPaused ? "User Paused" : "User Unpaused",
          description: `User has been ${isPaused ? 'paused' : 'unpaused'} successfully.`,
        });
        // Invalidate and refetch users list and details
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to toggle user pause status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: ({ id, deletionReason }: { id: number | string; deletionReason?: string }) =>
      UserManagementService.deleteUser(id, deletionReason),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "User Deleted",
          description: "User has been deleted successfully.",
          variant: "destructive",
        });
        // Invalidate and refetch users list
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    pagination,
    isLoading,
    error,
    refetch,
    useUserDetails,
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isPending,
    togglePause: togglePauseMutation.mutate,
    isTogglingPause: togglePauseMutation.isPending,
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
  };
};

