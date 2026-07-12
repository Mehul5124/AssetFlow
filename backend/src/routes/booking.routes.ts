import { Router } from 'express';
import { createBooking, getBookingsForAsset, cancelBooking } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Any authenticated employee can book an asset (subject to overlap rules)
router.post('/', createBooking);
router.get('/', getBookingsForAsset);
router.patch('/:id/cancel', cancelBooking);

export default router;
