import { Router } from 'express';
import { createMaintenanceRequest, updateMaintenanceStatus, getMaintenanceRequests } from '../controllers/maintenance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Any employee can report an issue
router.post('/', createMaintenanceRequest);
router.get('/', getMaintenanceRequests);

// Only managers/admins can approve or resolve maintenance workflows
router.patch('/:id/status', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER), updateMaintenanceStatus);

export default router;
