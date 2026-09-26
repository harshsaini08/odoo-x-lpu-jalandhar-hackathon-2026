import { Router } from 'express';
import { runDemoScenarioStep } from '../controllers/demoController';

const router = Router();

router.post('/scenario-step', runDemoScenarioStep);

export default router;
