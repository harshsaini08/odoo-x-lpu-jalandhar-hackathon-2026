import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CopilotService } from '../services/copilotService';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export const handleCopilotChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = chatSchema.parse(req.body);
    const result = await CopilotService.processMessage(message);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
