import { Router } from 'express';
import {
  getDrivers,
  getDriver,
  updateDriverVerification,
  toggleDriverActive,
} from '../controllers/driverController';

const router = Router();

router.get('/', getDrivers);
router.get('/:uid', getDriver);
router.patch('/:uid/verify', updateDriverVerification);
router.patch('/:uid/toggle', toggleDriverActive);

export default router;
