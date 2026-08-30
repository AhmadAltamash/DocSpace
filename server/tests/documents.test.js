import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import store from '../src/repository/index.js';

const app = createApp();

async function makeUser(name, email, password = 'password123') {
  const passwordHash = await bcrypt.hash(password, 4); // low cost factor, tests only
  return store.users.create({ name, email, passwordHash });
}

async function loginToken(email, password = 'password123') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('DocSpace API', () => {
  let alice, bob;
  let aliceToken, bobToken;

  beforeEach(async () => {
    await store.__reset();
    alice = await makeUser('Alice', 'alice@test.com');
    bob = await makeUser('Bob', 'bob@test.com');
    aliceToken = await loginToken('alice@test.com');
    bobToken = await loginToken('bob@test.com');
  });

  describe('auth', () => {
    it('rejects login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'nope' });
      expect(res.status).toBe(401);
    });

    it('rejects requests with no token', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(401);
    });

    it('logs in successfully and returns a usable token', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('alice@test.com');
    });
  });

  describe('document CRUD', () => {
    it('creates a document owned by the creator', async () => {
      const res = await request(app).post('/api/documents').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'My Doc' });
      expect(res.status).toBe(201);
      expect(res.body.document.title).toBe('My Doc');
      expect(res.body.document.owner).toBe(alice._id);
    });

    it('lists a user\'s own documents under "owned"', async () => {
      await request(app).post('/api/documents').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'Doc A' });
      const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${aliceToken}`);
      expect(res.status).toBe(200);
      expect(res.body.owned).toHaveLength(1);
      expect(res.body.shared).toHaveLength(0);
    });

    it('persists content updates and reflects them on re-fetch (save/reopen)', async () => {
      const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'Doc' });
      const docId = create.body.document._id;
      const newContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] };

      await request(app).patch(`/api/documents/${docId}`).set('Authorization', `Bearer ${aliceToken}`).send({ content: newContent });
      const reopened = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${aliceToken}`);

      expect(reopened.status).toBe(200);
      expect(reopened.body.document.content).toEqual(newContent);
    });

    it('rejects an empty title on rename', async () => {
      const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'Doc' });
      const docId = create.body.document._id;
      const res = await request(app).patch(`/api/documents/${docId}`).set('Authorization', `Bearer ${aliceToken}`).send({ title: '   ' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for a document that does not exist', async () => {
      const res = await request(app).get('/api/documents/does-not-exist').set('Authorization', `Bearer ${aliceToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('sharing & access control (the core scope requirement)', () => {
    let docId;

    beforeEach(async () => {
      const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${aliceToken}`).send({ title: 'Shared Doc' });
      docId = create.body.document._id;
    });

    it('denies access to a document the user does not own and has no share for', async () => {
      const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
      expect(res.status).toBe(403);
    });

    it('only the owner can share a document', async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ email: 'alice@test.com', permission: 'viewer' });
      expect(res.status).toBe(403);
    });

    it('grants a shared viewer read access but not write access', async () => {
      await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@test.com', permission: 'viewer' });

      const read = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
      expect(read.status).toBe(200);
      expect(read.body.permission).toBe('viewer');

      const write = await request(app).patch(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`).send({ title: 'Hacked' });
      expect(write.status).toBe(403);
    });

    it('grants a shared editor both read and write access', async () => {
      await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@test.com', permission: 'editor' });

      const write = await request(app).patch(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`).send({ title: 'Edited by Bob' });
      expect(write.status).toBe(200);
      expect(write.body.document.title).toBe('Edited by Bob');
    });

    it('surfaces a shared document under "shared" for the recipient, not "owned"', async () => {
      await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@test.com', permission: 'viewer' });

      const list = await request(app).get('/api/documents').set('Authorization', `Bearer ${bobToken}`);
      expect(list.body.owned).toHaveLength(0);
      expect(list.body.shared).toHaveLength(1);
      expect(list.body.shared[0]._id).toBe(docId);
    });

    it('only the owner can delete the document, and deleting removes it for everyone', async () => {
      await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@test.com', permission: 'editor' });

      const deniedDelete = await request(app).delete(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
      expect(deniedDelete.status).toBe(403);

      const allowedDelete = await request(app).delete(`/api/documents/${docId}`).set('Authorization', `Bearer ${aliceToken}`);
      expect(allowedDelete.status).toBe(204);

      const afterDelete = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${aliceToken}`);
      expect(afterDelete.status).toBe(404);
    });
  });

  describe('file import', () => {
    it('imports a .md file as a new editable document', async () => {
      const res = await request(app)
        .post('/api/files/import')
        .set('Authorization', `Bearer ${aliceToken}`)
        .attach('file', Buffer.from('# Title\n\nSome text\n\n- one\n- two'), 'notes.md');

      expect(res.status).toBe(201);
      expect(res.body.document.title).toBe('notes');
      expect(res.body.document.content.content[0]).toMatchObject({ type: 'heading', attrs: { level: 1 } });
    });

    it('rejects unsupported file types', async () => {
      const res = await request(app)
        .post('/api/files/import')
        .set('Authorization', `Bearer ${aliceToken}`)
        .attach('file', Buffer.from('binary'), 'file.docx');
      expect(res.status).toBe(400);
    });
  });
});
