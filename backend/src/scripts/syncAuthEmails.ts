/**
 * syncAuthEmails.ts
 *
 * One-time (and safe to re-run) script that scans all Firebase Auth users
 * and ensures their emails are stored in their respective Firestore user documents.
 *
 * Run with:
 *   npx tsx backend/src/scripts/syncAuthEmails.ts
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const keyPath = path.resolve(__dirname, '..', '..', 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('serviceAccountKey.json not found at', keyPath);
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
const authAdmin = admin.auth();

async function syncEmails() {
  let pageToken: string | undefined;
  let updated = 0;
  let skipped = 0;
  let total = 0;

  console.log('Starting email sync from Firebase Auth → Firestore...\n');

  do {
    const listResult = await authAdmin.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;

    for (const authUser of listResult.users) {
      total++;
      if (!authUser.email) {
        skipped++;
        continue;
      }

      const docRef = db.collection('users').doc(authUser.uid);
      const doc = await docRef.get();

      if (!doc.exists) {
        // Create minimal Firestore entry so email is accessible
        await docRef.set(
          {
            email: authUser.email,
            name: authUser.displayName || '',
            type: 'customer',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`  [CREATED]  uid=${authUser.uid}  email=${authUser.email}`);
        updated++;
      } else {
        const existing = doc.data()!;
        if (!existing.email || existing.email !== authUser.email) {
          await docRef.set({ email: authUser.email }, { merge: true });
          console.log(`  [UPDATED]  uid=${authUser.uid}  email=${authUser.email}`);
          updated++;
        } else {
          // Email already in Firestore – nothing to do
          skipped++;
        }
      }
    }
  } while (pageToken);

  console.log(`\nDone! Total Auth users: ${total}  |  Updated: ${updated}  |  Skipped: ${skipped}`);
  process.exit(0);
}

syncEmails().catch((e) => {
  console.error('syncEmails failed:', e);
  process.exit(1);
});
