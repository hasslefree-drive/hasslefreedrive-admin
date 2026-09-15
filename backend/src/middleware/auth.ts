import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
  uid?: string;
  userType?: string;
}

export const verifyAdminToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;

    // Check the user's type in Firestore to confirm they are an admin
    const { db } = await import('../config/firebase');
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      res.status(403).json({ error: 'Forbidden: User not found' });
      return;
    }

    const userData = userDoc.data();
    if (userData?.type !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access only' });
      return;
    }

    req.userType = 'admin';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
