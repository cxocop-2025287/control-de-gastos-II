import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Solo authMiddleware, NO activityMiddleware.
// El heartbeat debe poder consultar el estado sin resetear el timer.
router.use(authMiddleware);
router.get('/heartbeat', ActivityController.heartbeat);

export default router;