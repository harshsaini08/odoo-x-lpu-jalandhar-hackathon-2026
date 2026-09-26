import { Router } from 'express';
import {
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,
  cancelReceipt,
} from '../controllers/receiptController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getReceipts);
router.get('/:id', getReceiptById);
router.post('/', authenticate, createReceipt);
router.post('/:id/validate', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']), validateReceipt);
router.post('/:id/cancel', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), cancelReceipt);

export default router;
