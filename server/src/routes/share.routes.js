import { Router } from 'express';
import { shareDocument, listShares, revokeShare } from '../controllers/share.controller.js';

const router = Router({ mergeParams: true });

router.post('/share', shareDocument);
router.get('/shares', listShares);
router.delete('/share/:userId', revokeShare);

export default router;
