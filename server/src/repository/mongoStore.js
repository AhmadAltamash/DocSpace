// Real MongoDB persistence layer, used when STORE_DRIVER=mongo and
// MONGODB_URI is set (e.g. a MongoDB Atlas connection string). Implements
// the exact same interface as jsonStore.js so controllers never know or
// care which backend is active.
import dns from 'dns';
import mongoose from 'mongoose';
import { UserModel, DocumentModel, ShareModel } from '../models/schemas.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

let connected = null;
async function init() {
  if (!connected) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('STORE_DRIVER=mongo requires MONGODB_URI to be set');
    connected = mongoose.connect(uri);
  }
  return connected;
}

const toId = (v) => (v ? String(v) : v);
const serializeUser = (u) => (u ? { _id: toId(u._id), name: u.name, email: u.email, passwordHash: u.passwordHash, createdAt: u.createdAt } : u);
const serializeDoc = (d) => (d ? { _id: toId(d._id), title: d.title, content: d.content, owner: toId(d.owner), createdAt: d.createdAt, updatedAt: d.updatedAt } : d);
const serializeShare = (s) => (s ? { _id: toId(s._id), document: toId(s.document), user: toId(s.user), permission: s.permission, createdAt: s.createdAt } : s);

const users = {
  async create({ name, email, passwordHash }) {
    await init();
    const doc = await UserModel.create({ name, email, passwordHash });
    return serializeUser(doc);
  },
  async findByEmail(email) {
    await init();
    return serializeUser(await UserModel.findOne({ email: String(email).toLowerCase() }));
  },
  async findById(id) {
    await init();
    return serializeUser(await UserModel.findById(id));
  },
  async list() {
    await init();
    return (await UserModel.find()).map(serializeUser);
  },
};

const documents = {
  async create({ title, content, owner }) {
    await init();
    const doc = await DocumentModel.create({ title, content, owner });
    return serializeDoc(doc);
  },
  async findById(id) {
    await init();
    try {
      return serializeDoc(await DocumentModel.findById(id));
    } catch {
      return null; // invalid ObjectId
    }
  },
  async findByOwner(ownerId) {
    await init();
    return (await DocumentModel.find({ owner: ownerId })).map(serializeDoc);
  },
  async update(id, updates) {
    await init();
    return serializeDoc(await DocumentModel.findByIdAndUpdate(id, updates, { new: true }));
  },
  async delete(id) {
    await init();
    const res = await DocumentModel.findByIdAndDelete(id);
    if (res) await ShareModel.deleteMany({ document: id });
    return !!res;
  },
};

const shares = {
  async create({ document, user, permission }) {
    await init();
    const doc = await ShareModel.findOneAndUpdate(
      { document, user },
      { document, user, permission },
      { upsert: true, new: true }
    );
    return serializeShare(doc);
  },
  async findByDocument(documentId) {
    await init();
    return (await ShareModel.find({ document: documentId })).map(serializeShare);
  },
  async findByUser(userId) {
    await init();
    return (await ShareModel.find({ user: userId })).map(serializeShare);
  },
  async findOne(documentId, userId) {
    await init();
    return serializeShare(await ShareModel.findOne({ document: documentId, user: userId }));
  },
  async delete(documentId, userId) {
    await init();
    const res = await ShareModel.deleteOne({ document: documentId, user: userId });
    return res.deletedCount > 0;
  },
};

async function __reset() {
  await init();
  await Promise.all([UserModel.deleteMany({}), DocumentModel.deleteMany({}), ShareModel.deleteMany({})]);
}

export default { users, documents, shares, __reset, __driver: 'mongo' };
