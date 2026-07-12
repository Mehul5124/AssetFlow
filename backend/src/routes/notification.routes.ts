import { Router } from 'express';
import { getUserNotifications, markAsRead, markAllAsRead, getActivityLogs } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Employee Notification endpoints
router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Admin-only Activity Log endpoint
router.get('/logs', authorizeRole(Role.ADMIN), getActivityLogs);

export default router;
