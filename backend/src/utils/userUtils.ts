import { auth, db } from '../config/firebase';

/**
 * Given an array of users/drivers with possible missing emails,
 * looks up the email from Firebase Authentication using their UID,
 * attaches it to the returned record, and asynchronously backfills
 * the Firestore document so future queries have it cached.
 */
export async function enrichWithAuthEmails<T extends { uid: string; email?: string }>(
  records: T[]
): Promise<T[]> {
  const missing = records.filter((r) => !r.email);
  if (missing.length === 0) return records;

  // Batch fetch from Firebase Auth (max 100 per request)
  const identifiers = missing.map((r) => ({ uid: r.uid }));
  const chunks: Array<typeof identifiers> = [];
  for (let i = 0; i < identifiers.length; i += 100) {
    chunks.push(identifiers.slice(i, i + 100));
  }

  const emailMap: Record<string, string> = {};

  for (const chunk of chunks) {
    try {
      const result = await auth.getUsers(chunk);
      for (const user of result.users) {
        if (user.email) {
          emailMap[user.uid] = user.email;
        }
      }
    } catch (err) {
      console.error('enrichWithAuthEmails: Auth.getUsers error', err);
    }
  }

  // Asynchronously backfill Firestore for any newly resolved emails
  const backfillPromises: Promise<void>[] = [];
  for (const [uid, email] of Object.entries(emailMap)) {
    backfillPromises.push(
      (async () => {
        try {
          await db.collection('users').doc(uid).set({ email }, { merge: true });
        } catch (e) {
          console.error(`Failed to backfill email for uid ${uid}:`, e);
        }
      })()
    );
  }
  // Fire-and-forget backfill
  Promise.all(backfillPromises).catch(() => {});

  // Merge emails back into records
  return records.map((r) => ({
    ...r,
    email: r.email || emailMap[r.uid] || '',
  }));
}
