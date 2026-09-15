import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
const rootEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else dotenv.config();

if (!admin.apps.length) {
  // Option 1: JSON string in env var (Render deployment)
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    const serviceAccount = JSON.parse(credsJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
    });
  } else {
    // Option 2: Local file path (local dev)
    const candidates = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.resolve(process.cwd(), 'backend/serviceAccountKey.json'),
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
    ].filter(Boolean) as string[];

    const keyPath = candidates.find((p) => fs.existsSync(p));

    if (keyPath) {
      admin.initializeApp({
        credential: admin.credential.cert(keyPath),
        projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
      });
    } else {
      try {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
        });
      } catch (e) {
        console.warn('Firebase Admin initialized without credentials:', (e as Error).message);
      }
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;