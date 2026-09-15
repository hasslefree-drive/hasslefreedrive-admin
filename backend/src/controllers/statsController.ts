import { Request, Response } from 'express';
import { db } from '../config/firebase';

// GET /api/stats
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usersSnap = await db.collection('users').get();

    let totalDrivers = 0;
    let verifiedDrivers = 0;
    let totalCustomers = 0;
    let totalAdmins = 0;

    usersSnap.forEach((doc) => {
      const data = doc.data();
      const isDriver = data.type === 'driver' || !!data.drivingLicense || !!data.serviceType;
      const isAdmin = data.type === 'admin';

      if (isAdmin) {
        totalAdmins++;
      } else if (isDriver) {
        totalDrivers++;
        if (data.verificationStatus === 'verified' || data.onboardingCompleted) {
          verifiedDrivers++;
        }
      } else {
        totalCustomers++;
      }
    });

    const bookingsSnap = await db.collection('bookings').get();
    let totalBookings = bookingsSnap.size;
    let totalRevenue = 0;

    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      const charge = data.baseCharge ?? data.charge ?? data.amount ?? 0;
      if (typeof charge === 'number') totalRevenue += charge;
    });

    res.json({
      totalDrivers,
      verifiedDrivers,
      totalCustomers,
      totalAdmins,
      totalBookings,
      totalRevenue,
    });
  } catch (err) {
    const error = err as Error;
    console.error('getStats error:', error);
    res.status(500).json({ error: error.message });
  }
};