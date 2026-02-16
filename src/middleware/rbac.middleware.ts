import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, InsufficientPermissionsError, AuthenticationError } from '../utils/errors';
import { UserRole, Resource, Action, ROLE_PERMISSIONS, Permission } from '../types/roles';

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has any of the allowed roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-based authorization middleware
 * Checks if the user's role has specific permission for resource + action
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const userRole = req.user.role as UserRole;
      const hasPermission = checkPermission(userRole, resource, action);

      if (!hasPermission) {
        throw new InsufficientPermissionsError(resource, action);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if a role has permission for a resource and action
 */
export function checkPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  
  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.some((permission: Permission) => {
    // Check if permission is for the requested resource
    if (permission.resource !== resource) {
      return false;
    }

    // MANAGE action grants all permissions
    if (permission.actions.includes(Action.MANAGE)) {
      return true;
    }

    // Check if the action is allowed
    return permission.actions.includes(action);
  });
}

/**
 * Get permission conditions for a role and resource
 */
export function getPermissionConditions(
  role: UserRole,
  resource: Resource
): Permission['conditions'] | undefined {
  const rolePermissions = ROLE_PERMISSIONS[role];
  
  if (!rolePermissions) {
    return undefined;
  }

  const permission = rolePermissions.find(p => p.resource === resource);
  return permission?.conditions;
}

/**
 * Middleware to check ownership of a resource
 * Used with ownOnly permission condition
 * Requires the resource owner ID to be in req.params.userId or custom extractor
 */
export const checkOwnership = (
  ownerIdExtractor?: (req: Request) => string | undefined
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      // Get the owner ID from the request
      const ownerId = ownerIdExtractor 
        ? ownerIdExtractor(req) 
        : req.params.userId || req.params.id;

      // Admins can access anything
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check if the current user is the owner
      if (ownerId && ownerId !== req.user.userId) {
        // Check if user's role has ownOnly condition
        const resource = getResourceFromPath(req.path);
        if (resource) {
          const conditions = getPermissionConditions(req.user.role as UserRole, resource);
          if (conditions?.ownOnly) {
            throw new ForbiddenError('You can only access your own resources');
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper to determine resource from request path
 */
function getResourceFromPath(path: string): Resource | undefined {
  const pathMappings: Record<string, Resource> = {
    '/users': Resource.USERS,
    '/bookings': Resource.BOOKINGS,
    '/listings': Resource.LISTINGS,
    '/hosts': Resource.HOSTS,
    '/vehicles': Resource.VEHICLES,
    '/shifts': Resource.SHIFTS,
    '/trips': Resource.TRIPS,
    '/payments': Resource.PAYMENTS,
    '/payouts': Resource.PAYOUTS,
  };

  for (const [pathPrefix, resource] of Object.entries(pathMappings)) {
    if (path.includes(pathPrefix)) {
      return resource;
    }
  }

  return undefined;
}

/**
 * Combined middleware: require role AND permission
 */
export const requireRoleAndPermission = (
  roles: UserRole[],
  resource: Resource,
  action: Action
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireRole(...roles)(req, res, (err) => {
      if (err) return next(err);
      requirePermission(resource, action)(req, res, next);
    });
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
