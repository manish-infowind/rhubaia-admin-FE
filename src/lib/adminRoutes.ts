import type { User } from '@/api/types';
import {
  canAccessAdminManagement,
  canManageAdminUsers,
  canManagePermissions,
  canManageRoles,
  canPerformAction,
  PERMISSIONS,
} from '@/lib/permissions';

type RouteRule = {
  path: string;
  permission: string;
};

/** Ordered nav routes — first match is the default landing page after login. */
const LANDING_ROUTES: RouteRule[] = [
  { path: '/admin', permission: 'dashboard' },
  { path: '/admin/users', permission: 'user_management' },
  { path: '/admin/ai-usage', permission: 'ai_usage' },
  { path: '/admin/activity-logs', permission: PERMISSIONS.ACTIVITY_LOGS },
  { path: '/admin/contact-support', permission: 'contact_support' },
];

const ADMIN_MANAGEMENT_ROUTES: RouteRule[] = [
  { path: '/admin/management/users', permission: PERMISSIONS.ADMIN_MANAGEMENT },
  { path: '/admin/management/roles', permission: PERMISSIONS.ROLE_MANAGEMENT },
  { path: '/admin/management/permissions', permission: PERMISSIONS.PERMISSION_MANAGEMENT },
];

/**
 * Longest-prefix rules for route access checks (most specific paths first).
 * Profile is always available to authenticated admins.
 */
const ACCESS_RULES: { prefix: string; permission: string | null }[] = [
  ...ADMIN_MANAGEMENT_ROUTES.map((r) => ({ prefix: r.path, permission: r.permission })),
  { prefix: '/admin/management', permission: PERMISSIONS.ADMIN_MANAGEMENT },
  { prefix: '/admin/users', permission: 'user_management' },
  { prefix: '/admin/ai-usage', permission: 'ai_usage' },
  { prefix: '/admin/activity-logs', permission: PERMISSIONS.ACTIVITY_LOGS },
  { prefix: '/admin/contact-support', permission: 'contact_support' },
  { prefix: '/admin/profile', permission: null },
  { prefix: '/admin', permission: 'dashboard' },
];

export const canAccessRoutePermission = (
  user: User | null | undefined,
  permission: string,
): boolean => canPerformAction(user, permission, 'read');

export const getDefaultLandingRoute = (user: User | null | undefined): string => {
  for (const route of LANDING_ROUTES) {
    if (canAccessRoutePermission(user, route.permission)) {
      return route.path;
    }
  }

  if (canAccessAdminManagement(user)) {
    if (canManageAdminUsers(user, 'read')) return '/admin/management/users';
    if (canManageRoles(user, 'read')) return '/admin/management/roles';
    if (canManagePermissions(user, 'read')) return '/admin/management/permissions';
  }

  return '/admin/profile';
};

const getPermissionForPath = (pathname: string): string | null => {
  const rule = ACCESS_RULES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return rule?.permission ?? null;
};

export const canAccessAdminPath = (
  user: User | null | undefined,
  pathname: string,
): boolean => {
  const permission = getPermissionForPath(pathname);
  if (permission === null) return true;
  return canAccessRoutePermission(user, permission);
};

export const getPostLoginPath = (
  user: User | null | undefined,
  intendedPath?: string,
): string => {
  if (intendedPath && canAccessAdminPath(user, intendedPath)) {
    return intendedPath;
  }
  return getDefaultLandingRoute(user);
};
