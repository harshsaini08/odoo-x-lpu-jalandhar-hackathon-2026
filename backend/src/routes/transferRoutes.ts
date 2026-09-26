import { Router } from 'express';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  completeTransfer,
  cancelTransfer,
} from '../controllers/transferController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', authenticate, createTransfer);
router.post('/:id/complete', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']), completeTransfer);
router.post('/:id/cancel', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), cancelTransfer);

export default router;
