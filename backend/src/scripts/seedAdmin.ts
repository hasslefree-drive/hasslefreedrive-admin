import admin, { db, auth } from '../config/firebase';

// =========================================================================
// Ã¢Å¡â„¢Ã¯Â¸Â DEFAULT ADMIN CONFIGURATION
// You can edit these values directly, OR pass them via command line:
//
// Usage:
//   npm run seed:admin -- <email> <password> <name>
//
// Examples:
//   npm run seed:admin
//   npm run seed:admin -- admin2@hasslefreedrive.com MyPass123 "John Doe"
// =========================================================================
const DEFAULT_CONFIG = {
  email: 'info@hasslefreedrive.com',
  password: process.env.ADMIN_PASSWORD || '',
  name: 'Shailesh Gade',
};

async function seedAdmin() {
  // Read arguments from command line if provided: [node, script, email, password, name]
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

  const email = (args[0] || process.env.ADMIN_EMAIL || DEFAULT_CONFIG.email).trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || DEFAULT_CONFIG.password;
  const name = args[2] || process.env.ADMIN_NAME || DEFAULT_CONFIG.name;

  if (!email || !email.includes('@')) {
    console.error('Ã¢ÂÅ’ Error: A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('Ã¢ÂÅ’ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('Ã°Å¸Å¡â‚¬ HassleFreeDrive Admin User Seeder');
  console.log('========================================');
  console.log(`Target Email: ${email}`);
  console.log(`Target Name : ${name}`);
  console.log('----------------------------------------');

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`Ã¢â€žÂ¹Ã¯Â¸Â  User already exists in Firebase Auth (UID: ${userRecord.uid})`);
    console.log('Ã°Å¸â€â€ž Updating password and display name...');
    await auth.updateUser(userRecord.uid, {
      password,
      displayName: name,
    });
    console.log('Ã¢Å“â€¦ Auth record updated.');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log('Ã¢Å¾â€¢ Creating new user in Firebase Auth...');
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      console.log(`Ã¢Å“â€¦ Auth user created (UID: ${userRecord.uid})`);
    } else {
      throw error;
    }
  }

  // 1. Assign custom claims for role-based access
  console.log('Ã°Å¸â€â€˜ Setting admin custom claims...');
  await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' });

  // 2. Upsert document in Firestore 'users' collection
  console.log('Ã°Å¸â€œÂ Updating Firestore "users" collection...');
  await db.collection('users').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      email,
      name,
      type: 'admin',
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('========================================');
  console.log('Ã°Å¸Å½â€° Admin user successfully configured!');
  console.log('========================================');
  console.log(`  Name    : ${name}`);
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  UID     : ${userRecord.uid}`);
  console.log(`  Role    : admin (type: admin)`);
  console.log('========================================');
  console.log('Ã°Å¸â€™Â¡ Tip: To seed another admin user in the future, run:');
  console.log('   npm run seed:admin -- <email> <password> "<Full Name>"\n');

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('\nÃ¢ÂÅ’ Failed to seed admin user:', err.message || err);
  process.exit(1);
});
