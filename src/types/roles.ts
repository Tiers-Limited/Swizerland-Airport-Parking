// User Roles - Core platform roles
export enum UserRole {
  CUSTOMER = 'customer',
  HOST = 'host',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

// User Status
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING_VERIFICATION = 'pending_verification',
}

// Host Types
export enum HostType {
  OPERATOR = 'operator', // Owns parking lot + provides own shuttle
  PRIVATE = 'private',   // Provides parking space; platform provides shuttle
}

// Verification Status
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Permission Resources
export enum Resource {
  USERS = 'users',
  BOOKINGS = 'bookings',
  LISTINGS = 'listings',
  HOSTS = 'hosts',
  VEHICLES = 'vehicles',
  SHIFTS = 'shifts',
  TRIPS = 'trips',
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
    { resource: Resource.VEHICLES, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE], conditions: { ownOnly: true } },
  ],
  
  [UserRole.DISPATCHER]: [
    { resource: Resource.BOOKINGS, actions: [Action.READ, Action.UPDATE] },
    { resource: Resource.TRIPS, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.SHIFTS, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.VEHICLES, actions: [Action.READ] },
    { resource: Resource.USERS, actions: [Action.READ], conditions: { ownOnly: true } },
  ],
  
  [UserRole.DRIVER]: [
    { resource: Resource.TRIPS, actions: [Action.READ, Action.UPDATE], conditions: { ownOnly: true } },
    { resource: Resource.SHIFTS, actions: [Action.READ], conditions: { ownOnly: true } },
    { resource: Resource.BOOKINGS, actions: [Action.READ] },
    { resource: Resource.USERS, actions: [Action.READ, Action.UPDATE], conditions: { ownOnly: true } },
  ],
  
  [UserRole.ADMIN]: [
    { resource: Resource.USERS, actions: [Action.MANAGE] },
    { resource: Resource.BOOKINGS, actions: [Action.MANAGE] },
    { resource: Resource.LISTINGS, actions: [Action.MANAGE] },
    { resource: Resource.HOSTS, actions: [Action.MANAGE] },
    { resource: Resource.VEHICLES, actions: [Action.MANAGE] },
    { resource: Resource.SHIFTS, actions: [Action.MANAGE] },
    { resource: Resource.TRIPS, actions: [Action.MANAGE] },
    { resource: Resource.PAYMENTS, actions: [Action.MANAGE] },
    { resource: Resource.PAYOUTS, actions: [Action.MANAGE] },
    { resource: Resource.REPORTS, actions: [Action.MANAGE] },
    { resource: Resource.SETTINGS, actions: [Action.MANAGE] },
  ],
};
