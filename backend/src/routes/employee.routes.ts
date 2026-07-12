import { Router } from 'express';
import { getEmployees, updateEmployeeRole } from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Admin-only features
router.get('/', authorizeRole(Role.ADMIN), getEmployees);
router.patch('/:id/role', authorizeRole(Role.ADMIN), updateEmployeeRole);

export default router;
