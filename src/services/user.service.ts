import { db } from '../database';
import { User, UserPublic, UserRole, UserStatus } from '../types';
import { hashPassword, sanitizeUser } from '../utils/auth.utils';
import { NotFoundError, ConflictError } from '../utils/errors';
import { RegisterInput, UpdateUserInput, UserListFiltersInput } from '../validators/auth.validators';

export class UserService {
  private readonly tableName = 'users';

  /**
   * Create a new user
   */
  async create(data: RegisterInput): Promise<UserPublic> {
    // Check if email already exists
    const existing = await db(this.tableName)
      .where('email', data.email.toLowerCase())
      .first();
    
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(data.password);
    
    const [user] = await db(this.tableName)
      .insert({
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        name: data.name,
        phone: data.phone || null,
        role: data.role || UserRole.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
        email_verified: false,
      })
      .returning('*');

    return sanitizeUser(user) as UserPublic;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await db(this.tableName).where('id', id).first();
    return user || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await db(this.tableName)
      .where('email', email.toLowerCase())
      .first();
    return user || null;
  }

  /**
   * Find user by ID or throw error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Get user public profile by ID
   */
  async getPublicProfile(id: string): Promise<UserPublic> {
    const user = await this.findByIdOrFail(id);
    return sanitizeUser(user) as UserPublic;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput): Promise<UserPublic> {
    await this.findByIdOrFail(id);

    // Check email uniqueness if updating email
    if (data.email) {
      const existing = await db(this.tableName)
        .where('email', data.email.toLowerCase())
        .whereNot('id', id)
        .first();
      
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    const updateData: Partial<User> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || undefined;
    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase();
      updateData.email_verified = false; // Require re-verification
    }
    if (data.emailVerified !== undefined) updateData.email_verified = data.emailVerified;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status as UserStatus;

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update(updateData)
      .returning('*');

    return sanitizeUser(updated) as UserPublic;
  }

  async updateAdmin(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      emailVerified?: boolean;
      role?: UserRole | string;
      status?: UserStatus | string;
    }
  ): Promise<UserPublic> {
    const current = await this.findByIdOrFail(id);

    if (data.email) {
      const existing = await db(this.tableName)
        .where('email', data.email.toLowerCase())
        .whereNot('id', id)
        .first();

      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase();
      updateData.email_verified = data.emailVerified ?? false;
    } else if (data.emailVerified !== undefined) {
      updateData.email_verified = data.emailVerified;
    }
    if (data.role !== undefined && current.role !== UserRole.ADMIN) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status as UserStatus;

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update(updateData)
      .returning('*');

    return sanitizeUser(updated) as UserPublic;
  }

  async sendPasswordResetEmail(id: string): Promise<{ token: string }> {
    const { authService } = await import('./auth.service');
    const user = await this.findByIdOrFail(id);
    return authService.requestPasswordReset(user.email);
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<UserPublic> {
    await this.findByIdOrFail(id);

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update({
        status,
        updated_at: new Date(),
      })
      .returning('*');

    return sanitizeUser(updated) as UserPublic;
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(id: string, role: UserRole): Promise<UserPublic> {
    await this.findByIdOrFail(id);

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update({
        role,
        updated_at: new Date(),
      })
      .returning('*');

    return sanitizeUser(updated) as UserPublic;
  }

  /**
   * Mark email as verified
   */
  async verifyEmail(id: string): Promise<void> {
    await db(this.tableName)
      .where('id', id)
      .update({
        email_verified: true,
        status: UserStatus.ACTIVE,
        updated_at: new Date(),
      });
  }

  /**
   * Update password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    
    await db(this.tableName)
      .where('id', id)
      .update({
        password_hash: passwordHash,
        updated_at: new Date(),
      });
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    await db(this.tableName)
      .where('id', id)
      .update({
        last_login_at: new Date(),
        failed_login_attempts: 0,
        locked_until: null,
      });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(id: string): Promise<number> {
    const user = await this.findByIdOrFail(id);
    const newCount = (user.failed_login_attempts || 0) + 1;

    await db(this.tableName)
      .where('id', id)
      .update({
        failed_login_attempts: newCount,
        updated_at: new Date(),
      });

    return newCount;
  }

  /**
   * Lock account temporarily
   */
  async lockAccount(id: string, lockedUntil: Date): Promise<void> {
    await db(this.tableName)
      .where('id', id)
      .update({
        locked_until: lockedUntil,
        updated_at: new Date(),
      });
  }

  /**
   * List users with filters and pagination
   */
  async list(filters: UserListFiltersInput): Promise<{
    users: UserPublic[];
    total: number;
  }> {
    const { page, limit, sortBy, sortOrder, role, status, search } = filters;
    const offset = (page - 1) * limit;

    let query = db(this.tableName);

    // Apply filters
    if (role) {
      query = query.where('role', role);
    }
    if (status) {
      query = query.where('status', status);
    }
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    // Don't include deleted users unless specifically requested
    if (status !== UserStatus.DELETED) {
      query = query.whereNot('status', UserStatus.DELETED);
    }

    // Get total count
    const [{ count }] = await query.clone().count('* as count');
    const total = Number.parseInt(count as string, 10);

    // Get paginated results
    const users = await query
      .orderBy(sortBy || 'created_at', sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      users: users.map((u: User) => sanitizeUser(u) as UserPublic),
      total,
    };
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.findByIdOrFail(id);

    await db(this.tableName)
      .where('id', id)
      .update({
        status: UserStatus.DELETED,
        email: db.raw("email || '_deleted_' || id"),
        updated_at: new Date(),
      });
  }
}

export const userService = new UserService();
