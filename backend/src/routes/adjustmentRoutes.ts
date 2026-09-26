import { Router } from 'express';
import {
  getAdjustments,
  getAdjustmentById,
  createAdjustment,
} from '../controllers/adjustmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAdjustments);
router.get('/:id', getAdjustmentById);
router.post('/', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), createAdjustment);

export default router;
