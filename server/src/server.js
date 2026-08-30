import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DocSpace API listening on http://localhost:${PORT} (store: ${process.env.STORE_DRIVER || 'json'})`);
});
