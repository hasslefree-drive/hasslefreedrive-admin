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

// --- Security & Parsing -----------------------------------------------------
app.use(helmet());

const frontendEnv = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/+$/, '');
    if (
      normalized === frontendEnv ||
      frontendEnv === '*' ||
      normalized.endsWith('.vercel.app') ||
      normalized.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());

// --- Health check (public) --------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', project: 'haefreedrive', timestamp: new Date().toISOString() });
});

// --- Protected Routes (require valid Firebase admin token) ------------------
app.use('/api/stats', verifyAdminToken, statsRouter);
app.use('/api/drivers', verifyAdminToken, driversRouter);
app.use('/api/bookings', verifyAdminToken, bookingsRouter);
app.use('/api/users', verifyAdminToken, usersRouter);
app.use('/api/reports', verifyAdminToken, reportsRouter);

// --- Global Error Handler ---------------------------------------------------
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 [Backend] HassleFreeDrive Express Server is running on http://localhost:${PORT}`);
});

export default app;
