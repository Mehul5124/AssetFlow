import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(Role.ADMIN), createCategory);
router.get('/', getCategories);

export default router;
