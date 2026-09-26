import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  createLocation,
} from '../controllers/warehouseController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), createWarehouse);
router.post('/locations', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), createLocation);

export default router;
