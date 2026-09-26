import { Router } from 'express';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
  validateDelivery,
  cancelDelivery,
} from '../controllers/deliveryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getDeliveries);
router.get('/:id', getDeliveryById);
router.post('/', authenticate, createDelivery);
router.put('/:id/status', authenticate, updateDeliveryStatus);
router.post('/:id/validate', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']), validateDelivery);
router.post('/:id/cancel', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), cancelDelivery);

export default router;
