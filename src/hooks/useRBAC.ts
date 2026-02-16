'use client';

import { useAuth } from '@/contexts/AuthContext';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  hasMinimumRole,
  canAccessRoute,
  getDefaultRedirectPath,
  getAllowedRoutes,
} from '@/lib/rbac';
import type { UserRole } from '@/types';

export function useRBAC() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || 'customer';

  return {
    role,
    isAuthenticated,
    
    // Check single permission
    can: (permission: string) => hasPermission(role, permission),
    
    // Check any of multiple permissions
    canAny: (permissions: string[]) => hasAnyPermission(role, permissions),
    
    // Check all of multiple permissions
    canAll: (permissions: string[]) => hasAllPermissions(role, permissions),
    
    // Check minimum role level
    hasRole: (requiredRole: UserRole) => hasMinimumRole(role, requiredRole),
    
    // Check if can access a route
    canAccess: (route: string) => canAccessRoute(role, route),
    
    // Get default redirect after login
    getRedirectPath: () => getDefaultRedirectPath(role),
    
    // Get all allowed routes
    getAllowedRoutes: () => getAllowedRoutes(role),
    
    // Check if user is specific role
    isRole: (checkRole: UserRole) => role === checkRole,
    
    // Check if user is any of the specified roles
    isAnyRole: (roles: UserRole[]) => roles.includes(role),
  };
}

export default useRBAC;
