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

// GET /api/users  (customers only)
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('users').get();

    const users = snap.docs
      .filter((doc) => {
        const d = doc.data();
        const isDriver = d.type === 'driver' || !!d.drivingLicense || !!d.serviceType;
        const isAdmin = d.type === 'admin';
        return !isDriver && !isAdmin;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || '',
          phone: data.phone || data.phoneNumber || '',
          email: data.email || '',
          createdAt: parseDateString(data.createdAt),
        };
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    res.json({ users });
  } catch (err) {
    const error = err as Error;
    console.error('getUsers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/:uid
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const data = doc.data()!;
    res.json({
      uid: doc.id,
      name: data.name || '',
      phone: data.phone || data.phoneNumber || '',
      type: data.type || 'customer',
      createdAt: parseDateString(data.createdAt),
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};