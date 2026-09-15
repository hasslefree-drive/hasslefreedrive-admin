import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

// Load env before importing routes (firebase config needs it)
dotenv.config();

import statsRouter from './routes/stats';
import driversRouter from './routes/drivers';
import bookingsRouter from './routes/bookings';
import usersRouter from './routes/users';
import reportsRouter from './routes/reports';
import { errorHandler } from './middleware/errorHandler';
import { verifyAdminToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;

// â”€â”€ Security & Parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// â”€â”€ Health check (public) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', project: 'haefreedrive', timestamp: new Date().toISOString() });
});

// â”€â”€ Protected Routes (require valid Firebase admin token) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/stats', verifyAdminToken, statsRouter);
app.use('/api/drivers', verifyAdminToken, driversRouter);
app.use('/api/bookings', verifyAdminToken, bookingsRouter);
app.use('/api/users', verifyAdminToken, usersRouter);
app.use('/api/reports', verifyAdminToken, reportsRouter);

// â”€â”€ Global Error Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 [Backend] HassleFreeDrive Express Server is running on http://localhost:${PORT}`);
});

export default app;
