/**
 * API Services Index
 * 
 * Centralized exports for all API services.
 * This provides a clean, modular interface for importing services throughout the application.
 */

// Profile Services
export { profileService } from './profileService';
export type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest as ProfileChangePasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
  UserActivity,
  UpdatePreferencesRequest,
  ApiResponse as ProfileApiResponse,
} from './profileService';

// Password Services
export { PasswordService } from './passwordService';

// Auth Services
export { AuthService } from './authService';

// Admin Management Services
export { AdminManagementService } from './adminManagementService';

// User Management Services
export { UserManagementService } from './userManagementService';

// Content Services
export { ContentService } from './contentService';

// AI Usage Services
export { AiUsageService } from './aiUsageService';

// Dashboard Services
export { DashboardService } from './dashboardService';

// Enquiry Services
export { EnquiryService } from './enquiryService';

// FAQ Services
export { FAQService } from './faqService';

// Product Services
export { ProductService } from './productService';

// Role Services
export { RoleService } from './roleService';

// Permission Services
export { PermissionService } from './permissionService';

// About Us Services
export { AboutUsService } from './aboutUsService';

// Privacy Policy Services
export { PrivacyPolicyService } from './privacyPolicyService';

// Index Page Services
export { IndexPageService } from './indexPageService';
