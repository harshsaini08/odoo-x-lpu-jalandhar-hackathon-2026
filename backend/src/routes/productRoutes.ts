import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductMovements,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/movements', getProductMovements);
router.post('/', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), createProduct);
router.put('/:id', authenticate, authorize(['ADMIN', 'INVENTORY_MANAGER']), updateProduct);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteProduct);

export default router;
