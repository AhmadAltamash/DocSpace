// Selects the persistence backend at startup. Everything downstream
// (controllers) talks to this same interface: users / documents / shares.
//
//   STORE_DRIVER=json   -> data/db.json on disk (default, no setup required)
//   STORE_DRIVER=mongo  -> real MongoDB via Mongoose (needs MONGODB_URI)
import jsonStore from './jsonStore.js';
import mongoStore from './mongoStore.js';

const driver = (process.env.STORE_DRIVER || 'json').toLowerCase();
const store = driver === 'mongo' ? mongoStore : jsonStore;

export default store;
