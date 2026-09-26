import { Router } from 'express';
import { handleCopilotChat } from '../controllers/copilotController';

const router = Router();

router.post('/chat', handleCopilotChat);

export default router;
