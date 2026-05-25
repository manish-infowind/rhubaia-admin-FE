import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from '@/redux/store/store';
import { AuthService } from '@/api/services/authService';
import { canAccessAdminPath, getDefaultLandingRoute } from '@/lib/adminRoutes';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Redirects away from admin routes the user cannot access
 * (e.g. /admin dashboard when dashboard read is disabled).
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const user = loginState ?? AuthService.getCurrentUser();

  if (!canAccessAdminPath(user, location.pathname)) {
    const fallback = getDefaultLandingRoute(user);
    if (location.pathname !== fallback) {
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};
