import { Router } from 'express';
import { driverController } from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, isAdmin } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Driver self-service routes ───────────────────────────────────────
router.get(
  '/me',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.getMyProfile
);

router.get(
  '/shifts',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.getMyShifts
);

router.get(
  '/shifts/:shiftId/trips',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.getShiftTrips
);

router.get(
  '/trips/:tripId',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.getTripDetail
);

router.patch(
  '/trips/:tripId/status',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.updateTripStatus
);

router.patch(
  '/trips/:tripId/passengers/:bookingId/status',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.updatePassengerStatus
);

router.patch(
  '/shifts/:shiftId/start',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.startShift
);

router.patch(
  '/shifts/:shiftId/end',
  requireRole(UserRole.DRIVER, UserRole.ADMIN),
  driverController.endShift
);

// ── Admin: Driver management routes ──────────────────────────────────
router.get(
  '/admin',
  isAdmin,
  driverController.adminListDrivers
);

router.get(
  '/admin/:id',
  isAdmin,
  driverController.adminGetDriver
);

router.post(
  '/admin',
  isAdmin,
  driverController.adminCreateDriver
);

router.patch(
  '/admin/:id/verify',
  isAdmin,
  driverController.adminVerifyDriver
);

export default router;
