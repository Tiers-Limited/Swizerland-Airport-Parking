import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────────
// Calculate price (no auth needed for price preview)
router.get('/calculate-price', bookingController.calculatePrice);

// Lookup booking by code (for check-in kiosks, etc.)
router.get('/code/:code', bookingController.getBookingByCode);

// ── Authenticated Routes ──────────────────────────────────────────
router.use(authenticate);

// Customer booking management
router.post('/', bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/my/stats', bookingController.getMyStats);
router.get('/:id', bookingController.getBooking);
router.post('/:bookingId/confirm-payment', bookingController.confirmPayment);
router.post('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/status', bookingController.updateStatus);

export default router;
