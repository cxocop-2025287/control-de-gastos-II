import { Router } from 'express';
import { IncomeController } from '../controllers/income.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { activityMiddleware } from '../middleware/activity.middleware';

const router = Router();

router.use(authMiddleware);
router.use(activityMiddleware);

router.get('/', IncomeController.getAll);
router.get('/summary', IncomeController.getSummary);
router.get('/categories', IncomeController.getCategories);
router.post('/', IncomeController.create);
router.put('/:id', IncomeController.update);
router.delete('/:id', IncomeController.delete);

export default router;