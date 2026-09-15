import { Router } from 'express';
import { getRevenueReport, getTripsReport } from '../controllers/reportsController';

const router = Router();

router.get('/revenue', getRevenueReport);
router.get('/trips', getTripsReport);

export default router;
