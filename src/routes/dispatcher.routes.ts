import { Router } from 'express';
import { dispatcherController } from '../controllers/dispatcher.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// All routes require authentication + dispatcher or admin role
router.use(authenticate);
router.use(requireRole(UserRole.DISPATCHER, UserRole.ADMIN));

// Dashboard
router.get('/dashboard', dispatcherController.getDashboard);

// Unassigned bookings
router.get('/unassigned', dispatcherController.getUnassignedBookings);

// Shifts
router.get('/shifts', dispatcherController.listShifts);
router.get('/shifts/:id', dispatcherController.getShift);
router.post('/shifts', dispatcherController.createShift);
router.patch('/shifts/:id/status', dispatcherController.updateShiftStatus);

// Trips
router.get('/trips', dispatcherController.listTrips);
router.get('/trips/:id', dispatcherController.getTrip);
router.post('/trips', dispatcherController.createTrip);
router.patch('/trips/:id/status', dispatcherController.updateTripStatus);

// Booking assignment
router.post('/assignments', dispatcherController.assignBooking);

// Passenger status
router.patch(
  '/trips/:tripId/passengers/:bookingId/status',
  dispatcherController.updatePassengerStatus
);

export default router;
