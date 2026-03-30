import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store/store';
import { authStorage } from '@/lib/authStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loadingState } = useSelector((state: RootState) => state.auth);
  
  // Also check localStorage as fallback (in case Redux hasn't rehydrated yet)
  const isAuthFromStorage = Boolean(
    authStorage.getAccessToken() && authStorage.getCurrentUser()
  );

  // Show loading state while checking authentication
  if (loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check both Redux state and localStorage
  if (!isAuthenticated && !isAuthFromStorage) {
    // Redirect to login page with the intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 
