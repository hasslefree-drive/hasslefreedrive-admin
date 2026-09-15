import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val._seconds) return new Date(val._seconds * 1000);
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// GET /api/reports/revenue  — monthly revenue from bookings
export const getRevenueReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('bookings').get();

    const monthlyRevenue: Record<string, number> = {};

    snap.forEach((doc) => {
      const data = doc.data();
      const charge = typeof data.baseCharge === 'number' ? data.baseCharge : (typeof data.charge === 'number' ? data.charge : 0);

      const date = toDate(data.created_at || data.createdAt || data.scheduled_time || data.bookingDateTime || data.startDateTime);

      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + charge;
      }
    });

    // Sort by month key and return as array
    const revenue = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    res.json({ revenue });
  } catch (err) {
    const error = err as Error;
    console.error('getRevenueReport error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reports/trips  — trip count per driver
export const getTripsReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('bookings').get();

    const driverTrips: Record<string, { driverId: string; trips: number }> = {};

    snap.forEach((doc) => {
      const data = doc.data();
      const driverId = data.driver_id || data.driverId;
      if (driverId) {
        if (!driverTrips[driverId]) {
          driverTrips[driverId] = { driverId, trips: 0 };
        }
        driverTrips[driverId].trips++;
      }
    });

    // Enrich with driver names
    const driverIds = Object.keys(driverTrips);
    const driverDocs = await Promise.all(
      driverIds.map((uid) => db.collection('users').doc(uid).get())
    );

    const trips = driverDocs.map((doc) => ({
      driverId: doc.id,
      driverName: doc.exists ? doc.data()?.name || 'Driver ' + doc.id.slice(0, 6) : 'Driver ' + doc.id.slice(0, 6),
      trips: driverTrips[doc.id]?.trips || 0,
    }));

    res.json({ trips });
  } catch (err) {
    const error = err as Error;
    console.error('getTripsReport error:', error);
    res.status(500).json({ error: error.message });
  }
};