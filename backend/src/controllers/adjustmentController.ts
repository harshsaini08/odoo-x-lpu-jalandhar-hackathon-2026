import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockEngine } from '../services/stockEngine';

const createAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  locationId: z.string().min(1, 'Location is required'),
  physicalQuantity: z.number().min(0, 'Physical quantity cannot be negative'),
  reason: z.string().min(3, 'A clear reason is strictly mandatory for inventory adjustment'),
  category: z.enum(['DAMAGED', 'LOST', 'COUNT_ERROR', 'EXPIRED', 'FOUND', 'DEMO']).default('COUNT_ERROR'),
  notes: z.string().optional(),
});

export const getAdjustments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, warehouseId, category, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (productId && productId !== 'ALL') where.productId = String(productId);
    if (warehouseId && warehouseId !== 'ALL') where.warehouseId = String(warehouseId);
    if (category && category !== 'ALL') where.category = String(category);

    const [total, adjustments] = await Promise.all([
      prisma.adjustment.count({ where }),
      prisma.adjustment.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
          location: true,
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: adjustments,
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

export const getAdjustmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.adjustment.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
        location: true,
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!adjustment) {
      throw new AppError('Adjustment not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { adjustment },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdjustment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createAdjustmentSchema.parse(req.body);

    const adjustment = await StockEngine.recordAdjustment({
      productId: validated.productId,
      warehouseId: validated.warehouseId,
      locationId: validated.locationId,
      physicalQuantity: validated.physicalQuantity,
      reason: validated.reason,
      category: validated.category,
      notes: validated.notes,
      userId: req.user?.id,
    });

    await StockEngine.recalculateProductStatus(validated.productId);

    return res.status(201).json({
      success: true,
      message: `Adjustment ${adjustment.adjustmentNumber} recorded. Difference: ${adjustment.difference >= 0 ? '+' : ''}${adjustment.difference}.`,
      data: { adjustment },
    });
  } catch (error) {
    next(error);
  }
};
