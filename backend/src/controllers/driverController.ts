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

// GET /api/drivers
export const getDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('users').get();

    const statusFilter = req.query.status as string | undefined;

    const drivers = snap.docs
      .filter((doc) => {
        const d = doc.data();
        const isDriver = d.type === 'driver' || !!d.drivingLicense || !!d.serviceType;
        if (!isDriver) return false;

        if (statusFilter && statusFilter !== 'all') {
          const effectiveStatus = d.verificationStatus || (d.onboardingCompleted ? 'verified' : 'pending');
          return effectiveStatus === statusFilter;
        }
        return true;
      })
      .map((doc) => {
        const data = doc.data();
        const verificationStatus = data.verificationStatus || (data.onboardingCompleted ? 'verified' : 'pending');

        return {
          uid: doc.id,
          name: data.name || '',
          phone: data.phone || data.phoneNumber || '',
          email: data.email || '',
          age: data.age || null,
          gender: data.gender || '',
          dob: parseDateString(data.dob),
          drivingLicense: data.drivingLicense || '',
          licenseIssueDate: parseDateString(data.licenseIssueDate),
          licenseExpiryDate: parseDateString(data.licenseExpiryDate),
          panNumber: data.panNumber || '',
          aadhaarNumber: data.aadhaarNumber || '',
          fatherName: data.fatherName || '',
          referenceName: data.referenceName || '',
          referencePhone: data.referencePhone || '',
          emergencyName: data.emergencyName || '',
          emergencyPhone: data.emergencyPhone || '',
          documents: data.documents || {},
          onboardingCompleted: data.onboardingCompleted || false,
          verificationStatus,
          verificationNotes: data.verificationNotes || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: parseDateString(data.createdAt),
        };
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    res.json({ drivers });
  } catch (err) {
    const error = err as Error;
    console.error('getDrivers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/drivers/:uid
export const getDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    const data = doc.data()!;
    const isDriver = data.type === 'driver' || !!data.drivingLicense || !!data.serviceType;
    if (!isDriver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    res.json({
      uid: doc.id,
      ...data,
      phone: data.phone || data.phoneNumber || '',
      dob: parseDateString(data.dob),
      licenseIssueDate: parseDateString(data.licenseIssueDate),
      licenseExpiryDate: parseDateString(data.licenseExpiryDate),
      createdAt: parseDateString(data.createdAt),
      verificationStatus: data.verificationStatus || (data.onboardingCompleted ? 'verified' : 'pending'),
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/drivers/:uid/verify
export const updateDriverVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body as { status: string; notes?: string };

    const validStatuses = ['pending', 'background_check', 'police_verification', 'registration_received', 'verified', 'rejected'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid verification status' });
      return;
    }

    await db.collection('users').doc(req.params.uid).update({
      type: 'driver',
      verificationStatus: status,
      verificationNotes: notes || '',
    });

    res.json({ success: true, status });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/drivers/:uid/toggle
export const toggleDriverActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    const currentStatus = doc.data()?.isActive !== false;
    await db.collection('users').doc(req.params.uid).update({
      isActive: !currentStatus,
    });

    res.json({ success: true, isActive: !currentStatus });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};