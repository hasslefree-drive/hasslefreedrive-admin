import { Router } from 'express';
import {
  getBookings,
  getBooking,
  assignDriver,
  updateBookingStatus,
} from '../controllers/bookingController';

const router = Router();

router.get('/', getBookings);
router.get('/:id', getBooking);
router.patch('/:id/assign', assignDriver);
router.patch('/:id/status', updateBookingStatus);

export default router;
