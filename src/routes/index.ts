import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import hostRoutes from './host.routes';

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

export default router;
