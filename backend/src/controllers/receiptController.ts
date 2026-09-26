import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockEngine } from '../services/stockEngine';

const receiptItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  locationId: z.string().optional().nullable(),
  orderedQuantity: z.number().positive('Ordered quantity must be positive'),
  receivedQuantity: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const createReceiptSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, 'At least one product item is required'),
});

export const getReceipts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, warehouseId, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (warehouseId && warehouseId !== 'ALL') where.warehouseId = String(warehouseId);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { receiptNumber: { contains: q } },
        { supplier: { name: { contains: q } } },
        { notes: { contains: q } },
      ];
    }

    const [total, receipts] = await Promise.all([
      prisma.receipt.count({ where }),
      prisma.receipt.findMany({
        where,
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: { product: true, location: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          validatedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: receipts,
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

export const getReceiptById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: { product: true, location: true },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        validatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!receipt) {
      throw new AppError('Receipt not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { receipt },
    });
  } catch (error) {
    next(error);
  }
};

export const createReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createReceiptSchema.parse(req.body);

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        supplierId: validated.supplierId,
        warehouseId: validated.warehouseId,
        expectedDate: validated.expectedDate ? new Date(validated.expectedDate) : null,
        status: 'WAITING',
        notes: validated.notes,
        createdById: req.user?.id,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            locationId: item.locationId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity || item.orderedQuantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { product: true, location: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Receipt ${receipt.receiptNumber} created successfully.`,
      data: { receipt },
    });
  } catch (error) {
    next(error);
  }
};

export const validateReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedReceipt = await StockEngine.validateReceipt(id, req.user?.id);

    // Recalculate status for each product in receipt
    for (const item of updatedReceipt.items) {
      await StockEngine.recalculateProductStatus(item.productId);
    }

    return res.json({
      success: true,
      message: `Receipt ${updatedReceipt.receiptNumber} has been validated. Stock updated and ledger logged!`,
      data: { receipt: updatedReceipt },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) throw new AppError('Receipt not found', 404, 'NOT_FOUND');
    if (receipt.status === 'DONE') throw new AppError('Cannot cancel an already completed receipt.', 400, 'ALREADY_DONE');

    const updated = await prisma.receipt.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    return res.json({
      success: true,
      message: `Receipt ${receipt.receiptNumber} canceled.`,
      data: { receipt: updated },
    });
  } catch (error) {
    next(error);
  }
};
