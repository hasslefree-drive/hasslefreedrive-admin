import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

import * as fs from 'fs';

dotenv.config();

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(
    process.cwd(),
    process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json'
  );

  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
    });
  } else {
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.warn(
      `Ã¢Å¡Â Ã¯Â¸Â  Firebase Admin: serviceAccountKey.json not found at "${serviceAccountPath}".\n` +
      `   Place your Firebase service account key in the backend directory to enable Firestore queries.`
    );
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
      });
    } catch (e) {
      console.warn('Ã¢Å¡Â Ã¯Â¸Â  Firebase Admin initialized without credentials:', (e as Error).message);
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
