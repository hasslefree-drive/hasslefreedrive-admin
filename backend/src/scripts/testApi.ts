import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const keyPath = path.join(__dirname, "..", "..", "serviceAccountKey.json");
const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });

async function main() {
  const uid = "v5hpvYZPU7fN7TlEDOzwVqvGKrF3";
  const customToken = await admin.auth().createCustomToken(uid);
  
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "";
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const tokenData = await resp.json() as any;
  const idToken = tokenData.idToken;
  
  const endpoints = [
    "/api/drivers",
    "/api/users",
    "/api/bookings",
    "/api/stats",
    "/api/reports/revenue",
    "/api/reports/trips"
  ];

  for (const ep of endpoints) {
    const res = await fetch("http://localhost:5000" + ep, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    const txt = await res.text();
    console.log(`[${res.status}] ${ep}: ${txt.substring(0, 120)}`);
  }
}
main().catch(console.error);