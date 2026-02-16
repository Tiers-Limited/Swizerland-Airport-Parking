'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean; // For permissions: require all or any
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole, isAnyRole, can, canAny, canAll } = useRBAC();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${fallbackPath}?returnUrl=${returnUrl}`);
      return;
    }

    // Check role requirements
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    if (requiredRoles && requiredRoles.length > 0 && !isAnyRole(requiredRoles)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirements
    if (requiredPermission && !can(requiredPermission)) {
      router.push('/unauthorized');
      return;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequired = requireAll 
        ? canAll(requiredPermissions) 
        : canAny(requiredPermissions);
      
      if (!hasRequired) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    requiredRole,
    requiredRoles,
    requiredPermission,
    requiredPermissions,
    requireAll,
    hasRole,
    isAnyRole,
    can,
    canAny,
    canAll,
    router,
    pathname,
    fallbackPath,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-baby-blue border-t-transparent"></div>
      </div>
    );
  }

  // Not authenticated or not authorized
  if (!isAuthenticated) {
    return null;
  }

  // Check authorization
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0 && !isAnyRole(requiredRoles)) {
    return null;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return null;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequired = requireAll 
      ? canAll(requiredPermissions) 
      : canAny(requiredPermissions);
    
    if (!hasRequired) {
      return null;
    }
  }

  return <>{children}</>;
}

// HOC for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export default ProtectedRoute;
