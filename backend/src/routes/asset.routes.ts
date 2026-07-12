import { Router } from 'express';
import { getAssets, getAssetById, createAsset } from '../controllers/asset.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Creation is restricted to Admins and Asset Managers
router.post('/', authorizeRole(Role.ADMIN, Role.ASSET_MANAGER), createAsset);

// Any authenticated user can view the directory and details
router.get('/', getAssets);
router.get('/:id', getAssetById);

export default router;
