import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Hosts
router.get('/hosts', adminController.listHosts);
router.patch('/hosts/:id/verify', adminController.updateHostVerification);

// Listings
router.get('/listings', adminController.listListings);
router.patch('/listings/:id/status', adminController.updateListingStatus);

// Bookings
router.get('/bookings', adminController.listBookings);
router.patch('/bookings/:id/refund', adminController.refundBooking);

// Payments
router.get('/payments', adminController.listPayments);

// Vehicles
router.get('/vehicles', adminController.listVehicles);
router.patch('/vehicles/:id/status', adminController.updateVehicleStatus);

// Settings
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

// Analytics
router.get('/analytics/revenue', adminController.revenueByMonth);
router.get('/analytics/bookings', adminController.bookingsByStatus);

export default router;
