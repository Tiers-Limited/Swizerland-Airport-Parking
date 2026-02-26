import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import hostRoutes from './host.routes';
import listingRoutes from './listing.routes';
import adminRoutes from './admin.routes';
import bookingRoutes from './booking.routes';
import payoutRoutes from './payout.routes';
import dispatcherRoutes from './dispatcher.routes';
import driverRoutes from './driver.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hosts', hostRoutes);
router.use('/listings', listingRoutes);
router.use('/admin', adminRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payouts', payoutRoutes);
router.use('/dispatch', dispatcherRoutes);
router.use('/drivers', driverRoutes);

export default router;
