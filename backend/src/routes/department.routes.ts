import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment, updateDepartmentStatus } from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin-only routes for modifications
router.post('/', authorizeRole(Role.ADMIN), createDepartment);
router.put('/:id', authorizeRole(Role.ADMIN), updateDepartment);
router.patch('/:id/status', authorizeRole(Role.ADMIN), updateDepartmentStatus);

// All authenticated users can view the department structure
router.get('/', getDepartments);

export default router;
