import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'ACTIVE', severity, alertType, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (severity && severity !== 'ALL') where.severity = String(severity);
    if (alertType && alertType !== 'ALL') where.alertType = String(alertType);

    const [total, alerts, activeCount, criticalCount] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
          location: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
      prisma.alert.count({ where: { status: 'ACTIVE', severity: 'CRITICAL' } }),
    ]);

    return res.json({
      success: true,
      data: {
        items: alerts,
        activeCount,
        criticalCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');

    const updated = await prisma.alert.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });

    return res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: { alert: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const dismissAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');

    const updated = await prisma.alert.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });

    return res.json({
      success: true,
      message: 'Alert dismissed',
      data: { alert: updated },
    });
  } catch (error) {
    next(error);
  }
};
