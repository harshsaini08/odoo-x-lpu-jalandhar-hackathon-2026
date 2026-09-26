import { Router } from 'express';
import {
  getInventorySummaryReport,
  getMovementReport,
  getWarehouseUtilizationReport,
} from '../controllers/reportController';

const router = Router();

router.get('/summary', getInventorySummaryReport);
router.get('/movements', getMovementReport);
router.get('/utilization', getWarehouseUtilizationReport);

export default router;
