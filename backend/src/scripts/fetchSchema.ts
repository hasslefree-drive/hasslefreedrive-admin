/**
 * fetchSchema.ts
 * ---------------
 * Connects to Firestore using the service account and samples documents from
 * every top-level collection to build a schema reference.
 *
 * Usage:
 *   npx tsx src/scripts/fetchSchema.ts
 *
 * Output:
 *   Prints a JSON schema snapshot to stdout AND writes it to schema.json in
 *   the project root (backend/).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// ── Bootstrap Firebase Admin ────────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, '..', '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌  serviceAccountKey.json not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively convert Firestore values to plain JS so JSON.stringify works. */
function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp
  if (typeof value === 'object' && 'toDate' in (value as object)) {
    return (value as admin.firestore.Timestamp).toDate().toISOString();
  }

  // Firestore DocumentReference
  if (typeof value === 'object' && 'path' in (value as object) && (value as admin.firestore.DocumentReference).firestore) {
    return `[DocumentReference: ${(value as admin.firestore.DocumentReference).path}]`;
  }

  if (Array.isArray(value)) return value.map(toPlain);

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toPlain(v);
    }
    return out;
  }

  return value;
}

/** Derive a simple type descriptor from a JS value. */
function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

/** Build a field-type map from a plain document object. */
function buildFieldMap(doc: Record<string, unknown>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, val] of Object.entries(doc)) {
    map[key] = typeOf(val);
  }
  return map;
}

/** Merge two field maps, union of all keys. */
function mergeFieldMaps(
  a: Record<string, string>,
  b: Record<string, string>
): Record<string, string> {
  const merged = { ...a };
  for (const [key, type] of Object.entries(b)) {
    if (!(key in merged)) merged[key] = type;
    else if (merged[key] !== type) merged[key] = `${merged[key]} | ${type}`;
  }
  return merged;
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface CollectionSchema {
  documentCount: number;
  sampledDocuments: number;
  sampleDocuments: Record<string, unknown>[];
  fieldTypes: Record<string, string>;
  subCollections: string[];
}

async function fetchSchema() {
  console.log('🔍  Fetching Firestore collections...\n');

  const schema: Record<string, CollectionSchema> = {};

  // List all root-level collections
  const collections = await db.listCollections();

  for (const colRef of collections) {
    const colName = colRef.id;
    console.log(`📁  Processing collection: ${colName}`);

    // Count total docs (capped at 500 for performance)
    const allDocs = await colRef.limit(500).get();
    const documentCount = allDocs.size;

    // Sample up to 3 documents for field introspection
    const sampleSnap = await colRef.limit(3).get();
    const sampleDocuments: Record<string, unknown>[] = [];
    let fieldTypes: Record<string, string> = {};

    for (const doc of sampleSnap.docs) {
      const plainData = toPlain(doc.data()) as Record<string, unknown>;
      sampleDocuments.push({ _id: doc.id, ...plainData });
      fieldTypes = mergeFieldMaps(fieldTypes, buildFieldMap(plainData));
    }

    // Check for sub-collections on the first document
    const subCollections: string[] = [];
    if (sampleSnap.docs.length > 0) {
      const subCols = await sampleSnap.docs[0].ref.listCollections();
      subCollections.push(...subCols.map((c) => c.id));
    }

    schema[colName] = {
      documentCount,
      sampledDocuments: sampleDocuments.length,
      sampleDocuments,
      fieldTypes,
      subCollections,
    };

    console.log(
      `   ✅  ${documentCount} docs — fields: ${Object.keys(fieldTypes).join(', ')}`
    );
    if (subCollections.length) {
      console.log(`   📂  Sub-collections: ${subCollections.join(', ')}`);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', '..', 'schema.json');
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf8');

  console.log(`\n✅  Schema written to: ${outputPath}`);
  console.log('\n📊  Schema Summary:');
  console.log('──────────────────────────────────────────');

  for (const [col, info] of Object.entries(schema)) {
    console.log(`\n  Collection: "${col}" (${info.documentCount} docs)`);
    console.log('  Fields:');
    for (const [field, type] of Object.entries(info.fieldTypes)) {
      console.log(`    • ${field}: ${type}`);
    }
    if (info.subCollections.length) {
      console.log(`  Sub-collections: ${info.subCollections.join(', ')}`);
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log('Full schema saved to schema.json for reference.');

  process.exit(0);
}

fetchSchema().catch((err) => {
  console.error('❌  Error fetching schema:', err);
  process.exit(1);
});
