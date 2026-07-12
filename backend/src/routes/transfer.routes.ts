import { Router } from 'express';
import { createTransferRequest, approveTransferRequest } from '../controllers/transfer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Any user can initiate a transfer for an asset they own
router.post('/', createTransferRequest);

// Typically approvals are done by the receiving user or a manager, but for MVP we allow authenticated users to approve their incoming transfers
router.patch('/:id/approve', approveTransferRequest);

export default router;
