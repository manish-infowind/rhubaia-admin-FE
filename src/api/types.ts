// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  type: string;
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceData?: {
    deviceType: string;
    os: string;
    browser: string;
  };
  ipAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface LoginTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserPermission {
  permissionName: string;
  allowedActions: string[] | null; // null means all actions allowed
}

export interface LoginResponse {
  id: string;
  email: string;
  is_super_admin: boolean;
  permissions: UserPermission[]; // Updated: Array of permission objects
  roles?: Array<{
    id: number;
    roleName: string;
    description?: string;
  }>;
  tokens: LoginTokens;
  sessionId: string;
}

export interface LoginResponseLegacy {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePic: string;
    fullName: string;
    phone: string;
    address: string;
  };
}

export interface LoginResponse2FA extends LoginResponseLegacy {
  requiresOTP?: boolean;
  tempToken?: string;
}

// Password Management Types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// Permission Management Types
export interface Permission {
  id: number;
  permissionName: string;
  allowedActions: string[] | null; // null means all actions allowed
}

export interface CreatePermissionRequest {
  permissionName: string;
  allowedActions?: string[]; // Optional: ['create', 'read', 'update', 'delete']
}

export interface CreatePermissionResponse {
  id: number;
  permissionName: string;
  allowedActions: string[] | null;
}

export interface UpdatePermissionRequest {
  allowedActions?: string[]; // Optional: ['create', 'read', 'update', 'delete']
}

export interface UpdatePermissionResponse {
  id: number;
  permissionName: string;
  allowedActions: string[] | null;
}

export interface PermissionsListResponse {
  permissions: Permission[];
}

export interface AssignPermissionsRequest {
  adminId: string;
  permissionIds: number[];
}

export interface AssignPermissionsResponse {
  adminId: string;
  permissions: Array<{
    permissionName: string;
  }>;
}

export interface AdminPermissionsResponse {
  adminId: string;
  isSuperAdmin: boolean;
  permissions: Array<{
    permissionName: string;
  }>;
}

// Role Management Types
export interface Role {
  id: number;
  roleName: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateRoleRequest {
  roleName: string;
  description?: string;
}

export interface CreateRoleResponse {
  id: number;
  roleName: string;
  description?: string;
}

export interface UpdateRoleRequest {
  roleName: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoleResponse {
  id: number;
  roleName: string;
  description?: string;
  isActive: boolean;
}

export interface RolesListResponse {
  roles: Role[];
}

export interface AssignRoleRequest {
  adminId: string;
  roleIds: number[]; // Changed from roleId to roleIds (array) to match API expectation
}

export interface AssignRoleResponse {
  adminId: string;
  roles: Array<{
    id: number;
    roleName: string;
    description?: string;
  }>;
}

export interface AdminRolesResponse {
  adminId: string;
  isSuperAdmin: boolean;
  roles: Array<{
    id: number;
    roleName: string;
    description?: string;
  }>;
}

export interface AssignPermissionsToRoleRequest {
  roleId: number;
  permissions: Array<{
    permissionName: string;
    crud: string[]; // Array of: 'create' | 'read' | 'update' | 'delete'
  }>;
}

export interface AssignPermissionsToRoleResponse {
  roleId: number;
  roleName: string;
  permissions: Array<{
    id: number;
    permissionName: string;
    permissionAllowedActions: string[] | null;
    roleAllowedActions: string[] | null;
  }>;
}

export interface RolePermissionsResponse {
  roleId: number;
  roleName: string;
  permissions: Array<{
    id: number;
    permissionName: string;
    permissionAllowedActions: string[] | null;
    roleAllowedActions: string[] | null;
  }>;
}

export interface Verify2FARequest {
  otp: string;
  tempToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePic: string;
    fullName: string;
    phone: string;
    address: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  profilePic: string;
  deviceData?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  isActive: boolean;
  permissions?: UserPermission[]; // Updated: Array of permission objects with allowedActions
  roles?: Array<{
    id: number;
    roleName: string;
    description?: string;
  }>;
  isSuperAdmin?: boolean; // Added for convenience
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Admin Management Types
export interface AdminUser {
  id: string;
  username?: string; // Optional - may not be in API response
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
  phone: string;
  countryCode?: string; // Optional - may be in API response
  location: string | null;
  bio?: string | null;
  profilePic?: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
  roles?: Array<{
    id: number;
    roleName: string;
    description?: string;
  }>;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
  phone: string;
  countryCode: string; // Required: e.g., "+1", "+91"
  location: string;
  bio?: string;
  permissions?: string[];
  isActive?: boolean;
  // Note: roleId and permissionIds should be assigned separately after admin creation
  // via POST /admin/roles/assign and POST /admin/permissions/assign
}

export interface UpdateAdminRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string; // Optional: e.g., "+1", "+91"
  location?: string;
  bio?: string;
  permissions?: number[];
  isActive?: boolean;
  // Note: roleId and permissionIds should be assigned separately after admin update
  // via POST /admin/roles/assign and POST /admin/permissions/assign
}

export interface ChangePasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface AdminListResponse {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AdminStats {
  total: number;
  superAdmins: number;
  admins: number;
  active: number;
  inactive: number;
  online: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: File;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// Content Types
export interface PageContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  metaDescription?: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePageRequest {
  title?: string;
  content?: string;
  metaDescription?: string;
  status?: 'published' | 'draft';
}

// Privacy Policy Types
export interface PrivacyPolicy {
  _id: string;
  title: string;
  policyDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePrivacyPolicyRequest {
  title: string;
  policyDescription: string;
}

// About Us Types
export interface AboutUsSection {
  _id: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

export interface TeamMember {
  _id: string;
  name: string;
  position: string;
  image?: string;
  bio: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
}

export interface AboutUs {
  _id: string;
  mainTitle: string;
  mainDescription: string;
  mainImage?: string;
  sections: AboutUsSection[];
  teamMembers: TeamMember[];
}

export interface UpdateAboutUsRequest {
  mainTitle?: string;
  mainDescription?: string;
  sections?: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  teamMembers?: Array<{
    name: string;
    position: string;
    bio: string;
    email?: string;
    linkedin?: string;
    twitter?: string;
    order: number;
  }>;
}

export interface UpdateSectionRequest {
  title: string;
  content: string;
  order: number;
}

export interface UpdateTeamMemberRequest {
  name: string;
  position: string;
  bio: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
}

// Enquiry Types
export interface Reply {
  adminName: string;
  adminEmail: string;
  replyMessage: string;
  repliedAt: string;
}

export interface Enquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  inquiryCategory: string;
  message: string;
  status: 'new' | 'replied' | 'in-progress' | 'closed';
  isStarred: boolean;
  ipAddress: string;
  userAgent: string;
  adminNotes?: string;
  repliedAt?: string;
  replies?: Reply[];
  createdAt: string;
  updatedAt: string;
}

export interface EnquiriesResponse {
  enquiries: Enquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEnquiryRequest {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  inquiryCategory: string;
  message: string;
}

export interface UpdateEnquiryRequest {
  status?: 'new' | 'replied' | 'in-progress' | 'closed';
  isStarred?: boolean;
  adminNotes?: string;
}

export interface ReplyToEnquiryRequest {
  replyMessage: string;
}

// Address Types
export interface BusinessAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalProducts: number;
  totalEnquiries: number;
  totalUsers: number;
  recentActivity: Array<{
    id: string;
    action: string;
    page: string;
    time: string;
    user?: string;
  }>;
}

// API Request Options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
}

// Query Parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  category?: string;
  starred?: boolean;
  email?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  hasReplies?: boolean;
  hasAdminNotes?: boolean;
  [key: string]: any;
}

// AI Usage Types
export interface AiUsageFilterState {
  operation?: string;
  success?: boolean | null;
  userId?: string;
  from?: string;
  to?: string;
  days?: number;
  page: number;
  limit: number;
}

export interface AiUsageOperationSummary {
  operation: string;
  label: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_tokens: number;
  total_cost_usd: number;
  last_used_at: string | null;
}

export interface AiUsageOperationsTotals {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_tokens: number;
  total_cost_usd: number;
  total_operations: number;
}

export interface AiUsageOperationsResponse {
  items: AiUsageOperationSummary[];
  totals: AiUsageOperationsTotals;
}

export interface AiUsageHistoryItem {
  id: number;
  uuid: string;
  operation: string;
  operation_label: string;
  user: {
    uuid: string | null;
    email: string | null;
    full_name: string | null;
  } | null;
  model: string | null;
  output_format: string | null;
  quality: string | null;
  size: string | null;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  estimated_cost_usd: number;
  success: boolean;
  error_message: string | null;
  result_url: string | null;
  usage_details: unknown;
  created_at: string;
}

export interface AiUsageHistoryFilters {
  operation: string | null;
  success: boolean | null;
  user_id: string | null;
  from: string | null;
  to: string | null;
}

export interface AiUsageHistoryPagination {
  page: number;
  limit: number;
  offset: number;
  total: number;
  total_pages: number;
}

export interface AiUsageHistoryResponse {
  items: AiUsageHistoryItem[];
  filters: AiUsageHistoryFilters;
  pagination: AiUsageHistoryPagination;
}

export interface AiUsageGraphPoint {
  day: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_tokens: number;
  total_cost_usd: number;
}

export interface AiUsageGraphResponse {
  filters: {
    operation: string | null;
    success: boolean | null;
    user_id: string | null;
    from: string | null;
    to: string | null;
    days: number;
  };
  summary: AiUsageOperationsTotals;
  points: AiUsageGraphPoint[];
}

export interface EnquiryStats {
  total: number;
  new: number;
  inProgress: number;
  replied: number;
  closed: number;
  starred: number;
}

export interface FilterOption {
  value: string;
  count: number;
}

export interface FilterOptions {
  categories: FilterOption[];
  statuses: FilterOption[];
  dateRanges: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export interface EnquiryListResponse {
  enquiries: Enquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateUserRequest {
  userName: string;
  isActive: boolean;
  status: string;
  contactNumber: string | number;
  email?: string;
  profileScore: string | number;
  gender?: string;
  city?: string;
};

export interface TableSortingInterface {
    children: React.ReactNode;
    sortKey: string;
    currentSortKey: string;
    currentDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
};

export interface UserListInterface {
    id: number;
    name: string;
    isActive: boolean;
    status: string;
    contact: string;
    email: string;
    profileScore : string,
    gender: string;
    city: string;
};

// User Management API Types
export interface UserListItem {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  email: string | null;
  phone: string;
  countryCode: string;
  gender: 'm' | 'f' | 'o';
  dob: string | null;
  profilePic: string | null;
  profileImages: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isFaceVerified: boolean;
  isAccountPaused: boolean;
  // Indicates whether the user is currently banned
  isBanned?: boolean;
  accountCurrentStatus: number;
  accountStatusName?: string; // Optional - may not be in API response
  accountStatusDescription?: string; // Optional - may not be in API response
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  height: number | null;
  education: string | null;
  relationshipGoal: string | null;
  voiceUrl: string | null;
  bio: string | null;
}

export interface UserAddress {
  cityId: number | null;
  cityName: string | null;
  countryId: number | null;
  lat: string | number | null; // Can be string or number
  long: string | number | null; // Can be string or number
  location: string | null;
  isVerified: boolean;
}

export interface UserInteractions {
  receivedLikes: number;
  givenLikes: number;
  receivedSuperLikes: number;
  givenSuperLikes: number;
  passes: number;
  blocks: number;
}

export interface PlanFeature {
  label: string;
  limit?: number;
  featureId?: number;
  accessible?: boolean;
  period?: string;
}

export interface UserSubscription {
  id: number;
  subscriptionId: string;
  planId: number;
  planName: string;
  planPrice: number;
  planDuration: string;
  planFeatures: string[] | PlanFeature[]; // Can be array of strings or objects
  periodType: 'month' | 'week';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface UserConnectionHistoryUser {
  uuid: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  signUpDate: string | null;
  avatarUrl: string | null;
  gender: string | null;
  currentCity: string | null;
}

export interface UserConnectionHistoryItem {
  connectionUuid: string;
  closetId: string | null;
  shareScope?: string | null;
  accessType?: string | null;
  invitationStatus?: string | null;
  isRevoked?: boolean;
  status?: string | null;
  isBlurred?: boolean;
  revokedAt?: string | null;
  createdAt: string | null;
  connectedUser: UserConnectionHistoryUser;
}

export interface UserConnectionHistorySummary {
  sharedClosetWithUserByOthers: number;
  sharedClosetByUserWithOthers: number;
  delegatedToUserByOthers: number;
  delegatedByUserToOthers: number;
}

export interface UserConnectionHistory {
  sharedClosetWithUserByOthers: UserConnectionHistoryItem[];
  sharedClosetByUserWithOthers: UserConnectionHistoryItem[];
  delegatedToUserByOthers: UserConnectionHistoryItem[];
  delegatedByUserToOthers: UserConnectionHistoryItem[];
  summary: UserConnectionHistorySummary;
}

export interface UserDetails extends UserListItem {
  isPausedByUser: boolean;
  profile: UserProfile;
  address: UserAddress;
  interactions: UserInteractions;
  subscriptions: UserSubscription[];
  firstPlan: UserSubscription | null;
  connectionHistory?: UserConnectionHistory;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  dob?: string;
  gender?: 'm' | 'f' | 'o';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isFaceVerified?: boolean;
  isAccountPaused?: boolean;
  accountCurrentStatus?: number;
}

export interface UserListResponse {
  data: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'deleted';
  gender?: 'm' | 'f' | 'o';
}

export interface DeleteUserRequest {
  deletionReason?: string;
}

export interface PaginationControlInterface {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
  startItem: number;
  endItem: number;
  visiblePages: (number | string)[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface AdminUser {
  id: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  fullName: string; // firstName + lastName or email if name is empty
}

export const FEATURES = {
  USER_MANAGEMENT: 'user-management',
  ADMIN_MANAGEMENT: 'admin-management',
  ADMIN_ROLE: 'admin-role',
  ADMIN_PERMISSION: 'admin-permission',
  ADMIN_PROFILE: 'admin-profile',
  DASHBOARD: 'dashboard',
  DASHBOARD_ANALYTICS: 'dashboard-analytics',
} as const;
