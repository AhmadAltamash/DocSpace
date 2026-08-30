import 'dotenv/config';
import bcrypt from 'bcryptjs';
import store from '../repository/index.js';
import { textToDoc } from './editor.js';

const DEMO_USERS = [
  { name: 'Alice', email: 'alice@example.com', password: 'password123' },
  { name: 'Bob', email: 'bob@example.com', password: 'password123' },
];

async function upsertUser({ name, email, password }) {
  const existing = await store.users.findByEmail(email);
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  return store.users.create({ name, email, passwordHash });
}

async function run() {
  console.log(`Seeding demo data using STORE_DRIVER=${process.env.STORE_DRIVER || 'json'} ...`);

  const [alice, bob] = await Promise.all(DEMO_USERS.map(upsertUser));

  const aliceDocs = await store.documents.findByOwner(alice._id);
  if (aliceDocs.length === 0) {
    const doc = await store.documents.create({
      title: 'Product Launch Plan',
      content: textToDoc(
        '# Product Launch Plan\n\nThis is a sample document owned by Alice.\n\n## Goals\n- Ship the MVP\n- Get 5 pilot customers\n- Collect feedback\n\n## Timeline\n1. Week 1: build\n2. Week 2: test\n3. Week 3: launch'
      ),
      owner: alice._id,
    });
    await store.shares.create({ document: doc._id, user: bob._id, permission: 'editor' });
    console.log(`Created sample document "${doc.title}" (shared with Bob as editor)`);
  } else {
    console.log('Sample data already present, skipping document creation.');
  }

  console.log('\nDemo accounts:');
  console.log('  alice@example.com / password123  (owner)');
  console.log('  bob@example.com   / password123  (has shared access)');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
