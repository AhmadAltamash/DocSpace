import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import fileRoutes from './routes/file.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true, store: process.env.STORE_DRIVER || 'json' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/files', fileRoutes);

  // 404
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Central error handler (catches multer errors, JSON parse errors, etc.)
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    if (err?.name === 'MulterError') {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    console.error(err); // eslint-disable-line no-console
    res.status(err?.status || 500).json({ error: err?.message || 'Internal server error' });
  });

  return app;
}
