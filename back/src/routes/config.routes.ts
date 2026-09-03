import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router = Router();

router.get('/', ConfigController.getConfig);

export default router;