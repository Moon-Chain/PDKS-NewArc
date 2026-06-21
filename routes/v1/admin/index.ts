import { Router } from 'express';
import auditRoute from './audit.js';
import dashboardRoute from './dashboard.js';

const router = Router();

router.use('/audit', auditRoute);
router.use('/dashboard', dashboardRoute);

export default router;
