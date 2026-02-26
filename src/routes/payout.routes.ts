import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';

const router = Router();

// All payout routes require authentication
router.use(authenticate);

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
