import { Router } from 'express';
import authRoutes from './auth.routes';
import incomeRoutes from './income.routes';
import configRoutes from './config.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/incomes', incomeRoutes);
router.use('/config', configRoutes);
router.use('/activity', activityRoutes);

export default router;