import { Router } from 'express';
import {
  getProductForecast,
  getAllForecastSummaries,
  seedHistoricalMovementData,
} from '../controllers/forecastController';

const router = Router();

router.get('/summaries', getAllForecastSummaries);
router.get('/product/:productId', getProductForecast);
router.post('/seed-history', seedHistoricalMovementData);

export default router;
