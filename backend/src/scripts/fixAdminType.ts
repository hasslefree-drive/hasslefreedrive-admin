import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const keyPath = path.join(__dirname, "..", "..", "serviceAccountKey.json");
const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
const authAdmin = admin.auth();

async function main() {
  const user = await authAdmin.getUserByEmail("info@hasslefreedrive.com");
  console.log("Auth UID:", user.uid);
  
  const doc = await db.collection("users").doc(user.uid).get();
  console.log("Current type:", doc.exists ? doc.data()?.type : "NOT FOUND");

  await db.collection("users").doc(user.uid).set({
    name: "Shailesh Gade",
    email: "info@hasslefreedrive.com",
    type: "admin",
    role: "superadmin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log("Fixed - type is now admin");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });