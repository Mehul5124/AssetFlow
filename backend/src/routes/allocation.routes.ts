import { Router } from 'express';
import { createAllocation, returnAllocation, getOverdueAllocations } from '../controllers/allocation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), createAllocation);
router.post('/:id/return', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), returnAllocation);
router.get('/overdue', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER), getOverdueAllocations);

export default router;
