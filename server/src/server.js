import dns from 'dns';
import 'dotenv/config';
import { createApp } from './app.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DocSpace API listening on http://localhost:${PORT} (store: ${process.env.STORE_DRIVER || 'json'})`);
});
