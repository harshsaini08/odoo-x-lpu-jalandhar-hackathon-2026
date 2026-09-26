import { Request, Response, NextFunction } from 'express';
import { ForecastService } from '../services/forecastService';
import { AppError } from '../middleware/errorHandler';

export const getProductForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { horizonDays = '30' } = req.query;

    const horizon = parseInt(horizonDays as string, 10) || 30;
    const forecast = await ForecastService.getProductForecast(productId, horizon);

    if (!forecast) {
      throw new AppError('Product not found for forecasting', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { forecast },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllForecastSummaries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecasts = await ForecastService.getAllForecastSummaries();
    return res.json({
      success: true,
      data: { forecasts },
    });
  } catch (error) {
    next(error);
  }
};

export const seedHistoricalMovementData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ForecastService.generate90DayHistoricalData();
    return res.json({
      success: true,
      message: '90-day realistic historical movement data generated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
