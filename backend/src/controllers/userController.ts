import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { enrichWithAuthEmails } from '../utils/userUtils';

const parseDateString = (val: any): string | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (typeof val === 'string') return val;
  return null;
};

// GET /api/users  (customers only – type === 'customer' or no driver indicators)
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('users').get();

    let users = snap.docs
      .filter((doc) => {
        const d = doc.data();
        // Strict: if type is explicitly driver or admin, exclude
        if (d.type === 'driver' || d.type === 'admin') return false;
        // Legacy heuristic only when type is unset: exclude implicit drivers
        if (!d.type) {
          const isDriver = !!d.drivingLicense || !!d.serviceType;
          if (isDriver) return false;
        }
        return true;
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

    // Resolve missing emails from Firebase Auth
    users = await enrichWithAuthEmails(users);

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
    const record = {
      uid: doc.id,
      name: data.name || '',
      phone: data.phone || data.phoneNumber || '',
      email: data.email || '',
      type: data.type || 'customer',
      createdAt: parseDateString(data.createdAt),
    };

    const [enriched] = await enrichWithAuthEmails([record]);
    res.json(enriched);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/users/:uid/role  — switch between 'customer' and 'driver'
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;
    const { role } = req.body as { role: string };

    if (role !== 'customer' && role !== 'driver') {
      res.status(400).json({ error: "role must be 'customer' or 'driver'" });
      return;
    }

    const docRef = db.collection('users').doc(uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await docRef.update({ type: role });
    res.json({ success: true, uid, role });
  } catch (err) {
    const error = err as Error;
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: error.message });
  }
};