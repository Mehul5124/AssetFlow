import { Router } from 'express';
import { getKPIs, getAnalytics } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// These routes provide read-only operational data for the dashboard
router.get('/kpis', getKPIs);
router.get('/analytics', getAnalytics);

export default router;
