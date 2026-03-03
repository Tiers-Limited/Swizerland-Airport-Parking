import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// All payout routes require authentication
router.use(authenticate);

// ── Host Payout Routes (must be before /:id to avoid conflict) ───
router.get('/host/summary', requireRole(UserRole.HOST, UserRole.ADMIN), payoutController.getMyPayoutSummary);
router.get('/host', requireRole(UserRole.HOST, UserRole.ADMIN), payoutController.getMyPayouts);

// ── Admin Payout Routes ──────────────────────────────────────────
router.get('/pending', isAdmin, payoutController.getPendingPayouts);
router.post('/', isAdmin, payoutController.createPayout);
router.get('/list', isAdmin, payoutController.listPayouts);
router.get('/:id', isAdmin, payoutController.getPayoutDetails);
router.post('/:id/process', isAdmin, payoutController.processPayout);
router.post('/:id/fail', isAdmin, payoutController.failPayout);
router.post('/refund/:bookingId', isAdmin, payoutController.adminRefund);
router.get('/host/:hostId/summary', payoutController.getHostPayoutSummary);

export default router;
