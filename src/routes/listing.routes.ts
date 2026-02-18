import { Router } from 'express';
import { listingController } from '../controllers/listing.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requireRole, isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { UserRole } from '../types/roles';
import { z } from 'zod';
import { uuidSchema } from '../validators/auth.validators';

const router = Router();

// ===== PUBLIC ENDPOINTS (no auth required) =====
router.get('/search', listingController.search);
router.get('/public/:id', validateParams(z.object({ id: uuidSchema })), listingController.getPublicListing);

// ===== HOST ENDPOINTS (auth required) =====
router.use(authenticate);

// Host listing management
router.post('/', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.create);
router.get('/my', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.getMyListings);
router.get('/my/bookings', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.getMyBookings);
router.get('/my/stats', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.getMyStats);
router.get('/my/vehicles', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.getMyVehicles);

router.get('/my/:id', validateParams(z.object({ id: uuidSchema })), requireRole(UserRole.HOST, UserRole.ADMIN), listingController.getMyListing);
router.patch('/:id', validateParams(z.object({ id: uuidSchema })), requireRole(UserRole.HOST, UserRole.ADMIN), listingController.update);
router.delete('/:id', validateParams(z.object({ id: uuidSchema })), requireRole(UserRole.HOST, UserRole.ADMIN), listingController.delete);

// Pricing rules
router.post('/:id/pricing', validateParams(z.object({ id: uuidSchema })), requireRole(UserRole.HOST, UserRole.ADMIN), listingController.setPricingRule);
router.get('/:id/pricing', validateParams(z.object({ id: uuidSchema })), listingController.getPricingRule);

// Shuttle vehicles
router.post('/:id/vehicles', validateParams(z.object({ id: uuidSchema })), requireRole(UserRole.HOST, UserRole.ADMIN), listingController.createVehicle);
router.patch('/vehicles/:vehicleId', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.updateVehicle);
router.delete('/vehicles/:vehicleId', requireRole(UserRole.HOST, UserRole.ADMIN), listingController.deleteVehicle);

// Admin status management
router.patch('/:id/status', isAdmin, validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({ status: z.enum(['pending', 'active', 'inactive', 'rejected']) })),
  listingController.updateStatus
);

export default router;
