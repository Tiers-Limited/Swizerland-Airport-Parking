// User Roles - Core platform roles
export enum UserRole {
  CUSTOMER = 'customer',
  HOST = 'host',
  ADMIN = 'admin',
}

// User Status
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING_VERIFICATION = 'pending_verification',
}

// Verification Status
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Host Type (kept for DB compatibility — single-type hosts in UI)
export enum HostType {
  OPERATOR = 'operator',
  PRIVATE = 'private',
}

// Permission Resources
export enum Resource {
  USERS = 'users',
  BOOKINGS = 'bookings',
  LISTINGS = 'listings',
  HOSTS = 'hosts',
  PAYMENTS = 'payments',
  PAYOUTS = 'payouts',
  REPORTS = 'reports',
  SETTINGS = 'settings',
}

// Permission Actions
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full control
}

// Permission definition
export interface Permission {
  resource: Resource;
  actions: Action[];
  conditions?: PermissionCondition;
}

// Conditions for fine-grained permissions
export interface PermissionCondition {
  ownOnly?: boolean;      // Can only access own resources
  statusIn?: string[];    // Resource status must be in this list
  locationBased?: boolean; // Access limited to specific locations
}

// Role Permissions Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CUSTOMER]: [
    { resource: Resource.BOOKINGS, actions: [Action.CREATE, Action.READ, Action.UPDATE], conditions: { ownOnly: true } },
    { resource: Resource.LISTINGS, actions: [Action.READ] },
    { resource: Resource.USERS, actions: [Action.READ, Action.UPDATE], conditions: { ownOnly: true } },
  ],
  
  [UserRole.HOST]: [
    { resource: Resource.LISTINGS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE], conditions: { ownOnly: true } },
    { resource: Resource.BOOKINGS, actions: [Action.READ], conditions: { ownOnly: true } },
    { resource: Resource.PAYOUTS, actions: [Action.READ], conditions: { ownOnly: true } },
    { resource: Resource.USERS, actions: [Action.READ, Action.UPDATE], conditions: { ownOnly: true } },
  ],
  
  [UserRole.ADMIN]: [
    { resource: Resource.USERS, actions: [Action.MANAGE] },
    { resource: Resource.BOOKINGS, actions: [Action.MANAGE] },
    { resource: Resource.LISTINGS, actions: [Action.MANAGE] },
    { resource: Resource.HOSTS, actions: [Action.MANAGE] },
    { resource: Resource.PAYMENTS, actions: [Action.MANAGE] },
    { resource: Resource.PAYOUTS, actions: [Action.MANAGE] },
    { resource: Resource.REPORTS, actions: [Action.MANAGE] },
    { resource: Resource.SETTINGS, actions: [Action.MANAGE] },
  ],
};
