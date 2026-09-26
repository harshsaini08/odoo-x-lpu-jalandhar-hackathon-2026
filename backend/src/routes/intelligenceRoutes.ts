import { Router } from 'express';
import {
  getHealthScore,
  getReorderAdvisor,
  getStockRiskRadar,
  getStockAging,
  getAnomalies,
  getDailyBrief,
  getStockExplanation,
} from '../controllers/intelligenceController';

const router = Router();

router.get('/health', getHealthScore);
router.get('/reorder', getReorderAdvisor);
router.get('/risk', getStockRiskRadar);
router.get('/aging', getStockAging);
router.get('/anomalies', getAnomalies);
router.get('/daily-brief', getDailyBrief);
router.get('/explain/:productId', getStockExplanation);

export default router;
