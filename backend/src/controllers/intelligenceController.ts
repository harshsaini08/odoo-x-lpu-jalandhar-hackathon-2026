import { Request, Response, NextFunction } from 'express';
import { IntelligenceEngine } from '../services/intelligenceEngine';
import { AppError } from '../middleware/errorHandler';

export const getHealthScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await IntelligenceEngine.calculateHealthScore();
    return res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
};

export const getReorderAdvisor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await IntelligenceEngine.getReorderAdvisor();
    return res.json({ success: true, data: { recommendations } });
  } catch (error) {
    next(error);
  }
};

export const getStockRiskRadar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riskData = await IntelligenceEngine.getStockRiskRadar();
    return res.json({ success: true, data: riskData });
  } catch (error) {
    next(error);
  }
};

export const getStockAging = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agingData = await IntelligenceEngine.getStockAgingAnalysis();
    return res.json({ success: true, data: agingData });
  } catch (error) {
    next(error);
  }
};

export const getAnomalies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await IntelligenceEngine.getAnomalyDetections();
    return res.json({ success: true, data: { anomalies } });
  } catch (error) {
    next(error);
  }
};

export const getDailyBrief = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brief = await IntelligenceEngine.getDailyBrief();
    return res.json({ success: true, data: brief });
  } catch (error) {
    next(error);
  }
};

export const getStockExplanation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const explanation = await IntelligenceEngine.explainStockChanges(productId);
    if (!explanation) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    return res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
