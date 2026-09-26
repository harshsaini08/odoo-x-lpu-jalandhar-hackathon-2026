import { Router } from 'express';
import { getAlerts, resolveAlert, dismissAlert } from '../controllers/alertController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getAlerts);
router.put('/:id/resolve', authenticate, resolveAlert);
router.put('/:id/dismiss', authenticate, dismissAlert);

export default router;
