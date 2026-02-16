import type { UserRole } from '@/types';

// Define permissions for each role
export const rolePermissions: Record<UserRole, string[]> = {
  customer: [
    'booking:create',
    'booking:read:own',
    'booking:cancel:own',
    'profile:read:own',
    'profile:update:own',
    'listing:read',
    'search:listings',
  ],
  host: [
    'listing:create',
    'listing:read:own',
    'listing:update:own',
    'listing:delete:own',
    'booking:read:own',
    'booking:checkin',
    'booking:checkout',
    'shuttle:manage:own',
    'payout:read:own',
    'profile:read:own',
    'profile:update:own',
    'driver:manage:own',
    'vehicle:manage:own',
  ],
  dispatcher: [
    'shuttle:read:own',
    'shuttle:assign',
    'shuttle:update:status',
    'booking:read:own',
    'driver:read:own',
    'vehicle:read:own',
  ],
  driver: [
    'shuttle:read:assigned',
    'shuttle:update:status',
    'booking:read:assigned',
  ],
  admin: [
    'user:read',
    'user:update',
    'user:deactivate',
    'host:approve',
    'host:read',
    'listing:read',
    'listing:approve',
    'listing:deactivate',
    'booking:read',
    'booking:refund',
    'payout:read',
    'payout:process',
    'commission:manage',
    'analytics:read',
  ],
  super_admin: [
    '*', // All permissions
  ],
};

// Role hierarchy for access control
export const roleHierarchy: Record<UserRole, number> = {
  customer: 1,
  driver: 2,
  dispatcher: 3,
  host: 4,
  admin: 5,
  super_admin: 6,
};

// Check if user has a specific permission
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  
  // Super admin has all permissions
  if (permissions.includes('*')) {
    return true;
  }
  
  return permissions.includes(permission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Check if user has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

// Check if user role meets minimum role requirement
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Get allowed routes for a role
export function getAllowedRoutes(role: UserRole): string[] {
  const routesByRole: Record<UserRole, string[]> = {
    customer: [
      '/',
      '/zurich',
      '/parking',
      '/booking',
      '/account',
      '/account/bookings',
      '/account/profile',
      '/how-it-works',
      '/faq',
      '/contact',
    ],
    host: [
      '/host',
      '/host/dashboard',
      '/host/listings',
      '/host/bookings',
      '/host/payouts',
      '/host/shuttles',
      '/host/drivers',
      '/host/settings',
    ],
    dispatcher: [
      '/dispatch',
      '/dispatch/dashboard',
      '/dispatch/trips',
      '/dispatch/drivers',
      '/dispatch/vehicles',
    ],
    driver: [
      '/driver',
      '/driver/trips',
      '/driver/current',
    ],
    admin: [
      '/admin',
      '/admin/dashboard',
      '/admin/users',
      '/admin/hosts',
      '/admin/listings',
      '/admin/bookings',
      '/admin/payouts',
      '/admin/analytics',
    ],
    super_admin: ['*'], // All routes
  };

  return routesByRole[role] || [];
}

// Check if user can access a specific route
export function canAccessRoute(role: UserRole, route: string): boolean {
  const allowedRoutes = getAllowedRoutes(role);
  
  // Super admin can access all routes
  if (allowedRoutes.includes('*')) {
    return true;
  }
  
  // Check exact match or prefix match
  return allowedRoutes.some((allowedRoute) => {
    if (allowedRoute === route) return true;
    // Check if route starts with allowed route (for dynamic routes)
    if (route.startsWith(allowedRoute + '/')) return true;
    return false;
  });
}

// Get redirect path based on role after login
export function getDefaultRedirectPath(role: UserRole): string {
  const redirectPaths: Record<UserRole, string> = {
    customer: '/account',
    host: '/host/dashboard',
    dispatcher: '/dispatch/dashboard',
    driver: '/driver/trips',
    admin: '/admin/dashboard',
    super_admin: '/admin/dashboard',
  };

  return redirectPaths[role] || '/';
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    customer: 'Customer',
    host: 'Parking Host',
    dispatcher: 'Dispatcher',
    driver: 'Driver',
    admin: 'Administrator',
    super_admin: 'Super Administrator',
  };

  return displayNames[role] || role;
}
