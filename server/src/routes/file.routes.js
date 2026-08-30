import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { importFile } from '../controllers/file.controller.js';

const router = Router();
router.post('/import', requireAuth, upload.single('file'), importFile);

export default router;
