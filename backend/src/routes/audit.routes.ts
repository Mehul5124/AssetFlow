import { Router } from 'express';
import { createAuditCycle, submitAuditRecord, closeAuditCycle, getAuditCycles } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Admins & Asset Managers manage audit cycles
router.post('/', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER), createAuditCycle);
router.get('/', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), getAuditCycles);
router.patch('/:id/close', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER), closeAuditCycle);

// Any assigned auditor (could be regular employee) can submit a record for an open cycle
router.post('/:id/records', submitAuditRecord);

export default router;
