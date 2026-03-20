import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.get('/summary', authenticate, dashboardController.getSummary);

export default router;
