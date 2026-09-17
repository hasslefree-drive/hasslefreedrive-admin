import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
const rootEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else dotenv.config();

let app: App;

if (!getApps().length) {
  // Option 1: JSON string in env var (Render deployment)
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credsJson) {
    const serviceAccount = JSON.parse(credsJson);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
    });
  } else {
    // Option 2: Local service-account key file (local dev)
    const candidates = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.resolve(process.cwd(), 'backend/serviceAccountKey.json'),
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
    ].filter(Boolean) as string[];

    const keyPath = candidates.find((p) => fs.existsSync(p));

    if (keyPath) {
      app = initializeApp({
        credential: cert(keyPath),
        projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
      });
    } else {
      try {
        app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'haefreedrive',
        });
      } catch (e) {
        console.warn('Firebase Admin initialized without credentials:', (e as Error).message);
        app = getApps()[0];
      }
    }
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app!);
export const auth = getAuth(app!);
export default app!;