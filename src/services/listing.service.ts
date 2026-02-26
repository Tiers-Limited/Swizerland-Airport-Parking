import { db } from '../database';
import { ParkingLocation, PricingRule, LocationAddon } from '../types/entities';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export interface CreateListingInput {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  airportCode?: string;
  capacityTotal: number;
  amenities?: Record<string, boolean>;
  shuttleMode?: 'scheduled' | 'on_demand' | 'hybrid';
  shuttleHours?: { start: string; end: string; frequency_min?: number };
  bufferSettings?: { lot_processing_min: number; transfer_time_min: number; pickup_buffer_min: number };
  distanceToAirportMin?: number;
  description?: string;
  images?: string[];
  photos?: string[];
  basePricePerDay?: number;
  cancellationPolicy?: string;
  checkInInstructions?: string;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {}

export interface CreatePricingRuleInput {
  baseRatePerDay: number;
  offers?: Array<{ min_days: number; discount_percent: number }>;
  minStayDays?: number;
  maxStayDays?: number;
  currency?: string;
}

export interface CreateAddonInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  maxQuantity?: number;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateAddonInput extends Partial<CreateAddonInput> {
  isActive?: boolean;
}

export interface ListingSearchFilters {
  airportCode?: string;
  startDate?: string;
  endDate?: string;
  priceMin?: number;
  priceMax?: number;
  covered?: boolean;
  evCharging?: boolean;
  security247?: boolean;
  shuttleMode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ListingService {
  private readonly tableName = 'parking_locations';

  async create(hostId: string, data: CreateListingInput): Promise<ParkingLocation> {
    const insertData: Record<string, unknown> = {
      host_id: hostId,
      name: data.name,
      address: data.address,
      airport_code: data.airportCode || 'ZRH',
      capacity_total: data.capacityTotal,
      amenities: data.amenities ? JSON.stringify(data.amenities) : '{}',
      shuttle_mode: data.shuttleMode || 'scheduled',
      shuttle_hours: data.shuttleHours ? JSON.stringify(data.shuttleHours) : null,
      buffer_settings: data.bufferSettings ? JSON.stringify(data.bufferSettings) : null,
      distance_to_airport_min: data.distanceToAirportMin || null,
      description: data.description || null,
      images: data.images ? JSON.stringify(data.images) : '[]',
      photos: data.photos ? JSON.stringify(data.photos) : '[]',
      base_price_per_day: data.basePricePerDay || null,
      cancellation_policy: data.cancellationPolicy || null,
      check_in_instructions: data.checkInInstructions || null,
      status: 'pending',
    };

    if (data.latitude && data.longitude) {
      insertData.location = db.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
        [data.longitude, data.latitude]
      );
    }

    const [location] = await db(this.tableName).insert(insertData).returning('*');
    return location;
  }

  async findById(id: string): Promise<ParkingLocation | null> {
    const location = await db(this.tableName).where('id', id).first();
    return location || null;
  }

  async findByIdOrFail(id: string): Promise<ParkingLocation> {
    const location = await this.findById(id);
    if (!location) throw new NotFoundError('Parking location');
    return location;
  }

  async findByHostId(hostId: string): Promise<ParkingLocation[]> {
    return db(this.tableName).where('host_id', hostId).orderBy('created_at', 'desc');
  }

  async update(id: string, data: UpdateListingInput): Promise<ParkingLocation> {
    await this.findByIdOrFail(id);

    const updateData: Record<string, unknown> = { updated_at: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.airportCode !== undefined) updateData.airport_code = data.airportCode;
    if (data.capacityTotal !== undefined) updateData.capacity_total = data.capacityTotal;
    if (data.amenities !== undefined) updateData.amenities = JSON.stringify(data.amenities);
    if (data.shuttleMode !== undefined) updateData.shuttle_mode = data.shuttleMode;
    if (data.shuttleHours !== undefined) updateData.shuttle_hours = JSON.stringify(data.shuttleHours);
    if (data.bufferSettings !== undefined) updateData.buffer_settings = JSON.stringify(data.bufferSettings);
    if (data.distanceToAirportMin !== undefined) updateData.distance_to_airport_min = data.distanceToAirportMin;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.photos !== undefined) updateData.photos = JSON.stringify(data.photos);
    if (data.basePricePerDay !== undefined) updateData.base_price_per_day = data.basePricePerDay;
    if (data.cancellationPolicy !== undefined) updateData.cancellation_policy = data.cancellationPolicy;
    if (data.checkInInstructions !== undefined) updateData.check_in_instructions = data.checkInInstructions;

    if (data.latitude && data.longitude) {
      updateData.location = db.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
        [data.longitude, data.latitude]
      );
    }

    const [updated] = await db(this.tableName).where('id', id).update(updateData).returning('*');
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<ParkingLocation> {
    await this.findByIdOrFail(id);
    const [updated] = await db(this.tableName)
      .where('id', id)
      .update({ status, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrFail(id);
    await db(this.tableName).where('id', id).delete();
  }

  // Public search for customers
  async search(filters: ListingSearchFilters): Promise<{ listings: ParkingLocation[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db(this.tableName)
      .leftJoin('pricing_rules', 'parking_locations.id', 'pricing_rules.location_id')
      .select(
        'parking_locations.*',
        'pricing_rules.base_rate_per_day',
        'pricing_rules.offers as pricing_offers',
        'pricing_rules.min_stay_days',
        'pricing_rules.max_stay_days',
        'pricing_rules.currency as pricing_currency'
      )
      .where('parking_locations.status', 'active');

    if (filters.airportCode) {
      query = query.where('parking_locations.airport_code', filters.airportCode);
    }

    if (filters.priceMin !== undefined) {
      query = query.where(function () {
        this.where('parking_locations.base_price_per_day', '>=', filters.priceMin!)
          .orWhere('pricing_rules.base_rate_per_day', '>=', filters.priceMin!);
      });
    }

    if (filters.priceMax !== undefined) {
      query = query.where(function () {
        this.where('parking_locations.base_price_per_day', '<=', filters.priceMax!)
          .orWhere('pricing_rules.base_rate_per_day', '<=', filters.priceMax!);
      });
    }

    if (filters.covered) {
      query = query.whereRaw("parking_locations.amenities->>'covered' = 'true'");
    }

    if (filters.evCharging) {
      query = query.whereRaw("parking_locations.amenities->>'evCharging' = 'true'");
    }

    if (filters.security247) {
      query = query.whereRaw("parking_locations.amenities->>'security247' = 'true'");
    }

    if (filters.shuttleMode) {
      query = query.where('parking_locations.shuttle_mode', filters.shuttleMode);
    }

    const [{ count }] = await query.clone().clearSelect().count('parking_locations.id as count');
    const total = parseInt(count as string, 10);

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    const sortMap: Record<string, string> = {
      price: 'parking_locations.base_price_per_day',
      distance: 'parking_locations.distance_to_airport_min',
      created_at: 'parking_locations.created_at',
      name: 'parking_locations.name',
    };

    const sortColumn = sortMap[sortBy] || sortMap.created_at;
    query = query.orderBy(sortColumn, sortOrder);

    const listings = await query.limit(limit).offset(offset);
    return { listings, total };
  }

  // Get single listing with pricing for public view
  async getPublicListing(id: string): Promise<ParkingLocation & { pricing_rule?: PricingRule; addons?: LocationAddon[] }> {
    const listing = await db(this.tableName)
      .leftJoin('pricing_rules', 'parking_locations.id', 'pricing_rules.location_id')
      .select(
        'parking_locations.*',
        'pricing_rules.base_rate_per_day',
        'pricing_rules.offers as pricing_offers',
        'pricing_rules.min_stay_days',
        'pricing_rules.max_stay_days',
        'pricing_rules.currency as pricing_currency'
      )
      .where('parking_locations.id', id)
      .first();

    if (!listing) throw new NotFoundError('Parking location');

    // Include active add-ons
    const addons = await this.getAddonsByLocationId(id, true);
    return { ...listing, addons };
  }

  // Pricing rules
  async createPricingRule(locationId: string, data: CreatePricingRuleInput): Promise<PricingRule> {
    // Remove existing pricing rule for this location
    await db('pricing_rules').where('location_id', locationId).delete();

    const [rule] = await db('pricing_rules').insert({
      location_id: locationId,
      base_rate_per_day: data.baseRatePerDay,
      offers: data.offers ? JSON.stringify(data.offers) : '[]',
      min_stay_days: data.minStayDays || 1,
      max_stay_days: data.maxStayDays || 30,
      currency: data.currency || 'CHF',
    }).returning('*');

    return rule;
  }

  async getPricingRule(locationId: string): Promise<PricingRule | null> {
    const rule = await db('pricing_rules').where('location_id', locationId).first();
    return rule || null;
  }

  async updatePricingRule(locationId: string, data: Partial<CreatePricingRuleInput>): Promise<PricingRule> {
    const existing = await this.getPricingRule(locationId);
    if (!existing) {
      return this.createPricingRule(locationId, data as CreatePricingRuleInput);
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.baseRatePerDay !== undefined) updateData.base_rate_per_day = data.baseRatePerDay;
    if (data.offers !== undefined) updateData.offers = JSON.stringify(data.offers);
    if (data.minStayDays !== undefined) updateData.min_stay_days = data.minStayDays;
    if (data.maxStayDays !== undefined) updateData.max_stay_days = data.maxStayDays;
    if (data.currency !== undefined) updateData.currency = data.currency;

    const [updated] = await db('pricing_rules')
      .where('location_id', locationId)
      .update(updateData)
      .returning('*');
    return updated;
  }

  // Host bookings
  async getHostBookings(hostId: string, filters: { status?: string; page?: number; limit?: number } = {}): Promise<{ bookings: unknown[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('bookings')
      .join('parking_locations', 'bookings.location_id', 'parking_locations.id')
      .join('users', 'bookings.customer_id', 'users.id')
      .where('parking_locations.host_id', hostId)
      .select(
        'bookings.*',
        'parking_locations.name as location_name',
        'users.name as customer_name',
        'users.email as customer_email',
        'users.phone as customer_phone'
      );

    if (filters.status) {
      query = query.where('bookings.status', filters.status);
    }

    const [{ count }] = await query.clone().clearSelect().count('bookings.id as count');
    const total = parseInt(count as string, 10);

    const bookings = await query.orderBy('bookings.created_at', 'desc').limit(limit).offset(offset);
    return { bookings, total };
  }

  // Dashboard stats for host
  async getHostStats(hostId: string): Promise<{
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    upcomingBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
  }> {
    const locations = await db(this.tableName).where('host_id', hostId);
    const locationIds = locations.map(l => l.id);

    if (locationIds.length === 0) {
      return { totalListings: 0, activeListings: 0, totalBookings: 0, upcomingBookings: 0, totalRevenue: 0, monthlyRevenue: 0 };
    }

    const activeListings = locations.filter(l => l.status === 'active').length;

    const [{ count: totalBookings }] = await db('bookings')
      .whereIn('location_id', locationIds)
      .count('id as count');

    const [{ count: upcomingBookings }] = await db('bookings')
      .whereIn('location_id', locationIds)
      .whereIn('status', ['confirmed', 'checked_in'])
      .where('start_datetime', '>=', new Date())
      .count('id as count');

    const [{ sum: totalRevenue }] = await db('bookings')
      .whereIn('location_id', locationIds)
      .whereIn('status', ['confirmed', 'checked_in', 'checked_out', 'shuttle_to_airport_completed', 'shuttle_pickup_completed', 'awaiting_pickup'])
      .sum('host_payout as sum');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ sum: monthlyRevenue }] = await db('bookings')
      .whereIn('location_id', locationIds)
      .whereIn('status', ['confirmed', 'checked_in', 'checked_out', 'shuttle_to_airport_completed', 'shuttle_pickup_completed', 'awaiting_pickup'])
      .where('created_at', '>=', startOfMonth)
      .sum('host_payout as sum');

    return {
      totalListings: locations.length,
      activeListings,
      totalBookings: parseInt(totalBookings as string, 10),
      upcomingBookings: parseInt(upcomingBookings as string, 10),
      totalRevenue: parseFloat(totalRevenue as string) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue as string) || 0,
    };
  }

  // Shuttle vehicles for a host
  async getHostVehicles(hostId: string): Promise<unknown[]> {
    const locations = await db(this.tableName).where('host_id', hostId).select('id');
    const locationIds = locations.map(l => l.id);
    if (locationIds.length === 0) return [];
    return db('shuttle_vehicles').whereIn('location_id', locationIds).orderBy('created_at', 'desc');
  }

  async createVehicle(locationId: string, data: {
    plate: string;
    capacityPassengers: number;
    capacityLuggage: number;
    vehicleType?: string;
    make?: string;
    model?: string;
    year?: number;
  }): Promise<unknown> {
    const [vehicle] = await db('shuttle_vehicles').insert({
      location_id: locationId,
      plate: data.plate,
      capacity_passengers: data.capacityPassengers,
      capacity_luggage: data.capacityLuggage,
      vehicle_type: data.vehicleType || null,
      make: data.make || null,
      model: data.model || null,
      year: data.year || null,
      active: true,
    }).returning('*');
    return vehicle;
  }

  async updateVehicle(vehicleId: string, data: Partial<{
    plate: string;
    capacityPassengers: number;
    capacityLuggage: number;
    vehicleType: string;
    make: string;
    model: string;
    year: number;
    active: boolean;
  }>): Promise<unknown> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.plate !== undefined) updateData.plate = data.plate;
    if (data.capacityPassengers !== undefined) updateData.capacity_passengers = data.capacityPassengers;
    if (data.capacityLuggage !== undefined) updateData.capacity_luggage = data.capacityLuggage;
    if (data.vehicleType !== undefined) updateData.vehicle_type = data.vehicleType;
    if (data.make !== undefined) updateData.make = data.make;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.active !== undefined) updateData.active = data.active;

    const [updated] = await db('shuttle_vehicles').where('id', vehicleId).update(updateData).returning('*');
    return updated;
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    await db('shuttle_vehicles').where('id', vehicleId).delete();
  }

  // ── Location Add-ons / Extra Services ─────────────────────────────

  async getAddonsByLocationId(locationId: string, activeOnly: boolean = false): Promise<LocationAddon[]> {
    let query = db('location_addons').where('location_id', locationId);
    if (activeOnly) {
      query = query.where('is_active', true);
    }
    return query.orderBy('sort_order', 'asc').orderBy('created_at', 'asc');
  }

  async getAddonById(addonId: string): Promise<LocationAddon | null> {
    const addon = await db('location_addons').where('id', addonId).first();
    return addon || null;
  }

  async getAddonByIdOrFail(addonId: string): Promise<LocationAddon> {
    const addon = await this.getAddonById(addonId);
    if (!addon) throw new NotFoundError('Add-on service');
    return addon;
  }

  async createAddon(locationId: string, data: CreateAddonInput): Promise<LocationAddon> {
    await this.findByIdOrFail(locationId);

    // Determine next sort order
    const [{ max }] = await db('location_addons')
      .where('location_id', locationId)
      .max('sort_order as max');
    const nextSort = (max || 0) + 1;

    const [addon] = await db('location_addons').insert({
      location_id: locationId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      currency: data.currency || 'CHF',
      max_quantity: data.maxQuantity || 1,
      icon: data.icon || null,
      is_active: true,
      sort_order: data.sortOrder ?? nextSort,
    }).returning('*');

    return addon;
  }

  async updateAddon(addonId: string, data: UpdateAddonInput): Promise<LocationAddon> {
    await this.getAddonByIdOrFail(addonId);

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.maxQuantity !== undefined) updateData.max_quantity = data.maxQuantity;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;

    const [updated] = await db('location_addons')
      .where('id', addonId)
      .update(updateData)
      .returning('*');

    return updated;
  }

  async deleteAddon(addonId: string): Promise<void> {
    await this.getAddonByIdOrFail(addonId);
    await db('location_addons').where('id', addonId).delete();
  }

  async reorderAddons(locationId: string, addonIds: string[]): Promise<LocationAddon[]> {
    // Update sort_order for each addon
    for (let i = 0; i < addonIds.length; i++) {
      await db('location_addons')
        .where('id', addonIds[i])
        .where('location_id', locationId)
        .update({ sort_order: i, updated_at: new Date() });
    }
    return this.getAddonsByLocationId(locationId);
  }
}

export const listingService = new ListingService();
