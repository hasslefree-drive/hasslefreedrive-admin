import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

const parseDateString = (val: any): string | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (typeof val === 'string') return val;
  return null;
};

const serializeBooking = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  userId: data.user_id || data.userId || '',
  driverId: data.driver_id || data.driverId || null,
  status: data.status || 'pending',
  name: data.passenger_name || data.name || '',
  phone: data.passenger_phone || data.phone || '',
  carType: data.car_type || data.carType || '',
  gearType: data.transmission || data.gearType || '',
  baseCharge: data.baseCharge ?? data.charge ?? data.amount ?? 0,
  bookingType: data.trip_type || data.bookingType || 'local',
  // Local
  tripType: data.trip_type || data.tripType || null,
  packageHours: data.packageHours || null,
  pickupLocation: data.pickup_location || data.pickupLocation || (typeof data.pickup === 'string' ? data.pickup : data.pickup?.description) || null,
  visitingLocation: data.drop_location || data.visitingLocation || (typeof data.dropoff === 'string' ? data.dropoff : data.dropoff?.description) || null,
  bookingDateTime: parseDateString(data.scheduled_time || data.bookingDateTime || data.startDateTime),
  // Outstation
  pickup: typeof data.pickup === 'object' ? data.pickup : null,
  dropoff: typeof data.dropoff === 'object' ? data.dropoff : null,
  startDateTime: parseDateString(data.startDateTime || data.scheduled_time),
  endDate: parseDateString(data.endDate),
  // Meta
  createdAt: parseDateString(data.created_at || data.createdAt),
  declinedBy: data.declined_by || data.declinedBy || [],
});

// GET /api/bookings
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('bookings').get();

    const statusFilter = req.query.status as string | undefined;
    const bookingTypeFilter = req.query.bookingType as string | undefined;

    const bookings = snap.docs
      .map((doc) => serializeBooking(doc.id, doc.data()))
      .filter((b) => {
        if (statusFilter && statusFilter !== 'all' && b.status !== statusFilter) {
          return false;
        }
        if (bookingTypeFilter && bookingTypeFilter !== 'all' && b.bookingType !== bookingTypeFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    res.json({ bookings });
  } catch (err) {
    const error = err as Error;
    console.error('getBookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/bookings/:id
export const getBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('bookings').doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(serializeBooking(doc.id, doc.data()!));
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/bookings/:id/assign  — admin assigns a driver manually
export const assignDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.body as { driverId: string };
    if (!driverId) {
      res.status(400).json({ error: 'driverId is required' });
      return;
    }

    await db.collection('bookings').doc(req.params.id).update({
      driver_id: driverId,
      status: 'scheduled',
    });

    res.json({ success: true });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/bookings/:id/status
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: string };
    const validStatuses = ['pending', 'searching', 'scheduled', 'accepted', 'completed', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid booking status' });
      return;
    }

    await db.collection('bookings').doc(req.params.id).update({ status });
    res.json({ success: true, status });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};