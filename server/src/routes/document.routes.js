import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller.js';
import shareRouter from './share.routes.js';

const router = Router();
router.use(requireAuth);

router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// nested sharing routes: /api/documents/:id/share, /api/documents/:id/shares
router.use('/:id', shareRouter);

export default router;
