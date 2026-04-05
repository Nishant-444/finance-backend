import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import recordsController from '../controllers/dashboard.controller';

const router = Router();

router.get('/', verifyJWT, recordsController.getDashboardSummary);

export default router;
