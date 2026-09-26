import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { StockEngine } from '../services/stockEngine';
import { IntelligenceEngine } from '../services/intelligenceEngine';

const createProductSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required').toUpperCase(),
  categoryId: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().default('units'),
  description: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(10),
  reorderPoint: z.number().min(0).default(25),
  maximumStock: z.number().min(1).default(200),
  leadTimeDays: z.number().min(1).default(5),
  avgDailyUsage: z.number().min(0).default(5),
  defaultLocationId: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  initialStock: z.number().min(0).optional(),
  initialWarehouseId: z.string().optional(),
});

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      categoryId,
      status,
      warehouseId,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
        { barcode: { contains: q } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = String(categoryId);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (warehouseId && warehouseId !== 'ALL') {
      where.stocks = {
        some: { warehouseId: String(warehouseId) },
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          defaultLocation: { include: { warehouse: true } },
          stocks: {
            include: {
              warehouse: true,
              location: true,
            },
          },
        },
        orderBy: { [String(sortBy)]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formattedProducts = products.map((p) => {
      const currentStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
      return {
        ...p,
        currentStock,
        stockValuation: currentStock * p.costPrice,
      };
    });

    return res.json({
      success: true,
      data: {
        items: formattedProducts,
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

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        defaultLocation: { include: { warehouse: true } },
        stocks: {
          include: {
            warehouse: true,
            location: true,
          },
        },
        reorderRules: {
          include: { preferredSupplier: true, warehouse: true },
        },
        alerts: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const currentStock = product.stocks.reduce((acc, s) => acc + s.quantity, 0);
    const explanation = await IntelligenceEngine.explainStockChanges(id);

    return res.json({
      success: true,
      data: {
        product: {
          ...product,
          currentStock,
          stockValuation: currentStock * product.costPrice,
        },
        explanation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createProductSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });

    if (existingSku) {
      throw new AppError(`A product with SKU '${validated.sku}' already exists.`, 400, 'DUPLICATE_SKU');
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: validated.name,
          sku: validated.sku,
          categoryId: validated.categoryId,
          unitOfMeasure: validated.unitOfMeasure,
          description: validated.description,
          supplierId: validated.supplierId,
          costPrice: validated.costPrice,
          sellingPrice: validated.sellingPrice,
          minimumStock: validated.minimumStock,
          reorderPoint: validated.reorderPoint,
          maximumStock: validated.maximumStock,
          leadTimeDays: validated.leadTimeDays,
          avgDailyUsage: validated.avgDailyUsage,
          defaultLocationId: validated.defaultLocationId,
          barcode: validated.barcode,
          imageUrl: validated.imageUrl,
          status: 'HEALTHY',
        },
      });

      // Handle initial stock setup if provided
      if (validated.initialStock && validated.initialStock > 0 && validated.defaultLocationId) {
        const location = await tx.location.findUnique({
          where: { id: validated.defaultLocationId },
        });

        if (location) {
          await tx.stock.create({
            data: {
              productId: newProduct.id,
              warehouseId: location.warehouseId,
              locationId: location.id,
              quantity: validated.initialStock,
            },
          });

          await tx.stockLedger.create({
            data: {
              transactionNumber: `TXN-INIT-${Date.now()}`,
              type: 'ADJUSTMENT',
              productId: newProduct.id,
              sku: newProduct.sku,
              destWarehouseId: location.warehouseId,
              destLocationId: location.id,
              quantity: validated.initialStock,
              beforeStock: 0,
              afterStock: validated.initialStock,
              beforeLocationStock: 0,
              afterLocationStock: validated.initialStock,
              reason: 'Initial Product Inventory Setup',
            },
          });
        }
      }

      return newProduct;
    });

    await StockEngine.recalculateProductStatus(product.id);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    if (body.sku && body.sku !== existing.sku) {
      const duplicate = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (duplicate) {
        throw new AppError(`A product with SKU '${body.sku}' already exists.`, 400, 'DUPLICATE_SKU');
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        sku: body.sku ? body.sku.toUpperCase() : existing.sku,
        categoryId: body.categoryId ?? existing.categoryId,
        unitOfMeasure: body.unitOfMeasure ?? existing.unitOfMeasure,
        description: body.description ?? existing.description,
        supplierId: body.supplierId !== undefined ? body.supplierId : existing.supplierId,
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : existing.costPrice,
        sellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : existing.sellingPrice,
        minimumStock: body.minimumStock !== undefined ? Number(body.minimumStock) : existing.minimumStock,
        reorderPoint: body.reorderPoint !== undefined ? Number(body.reorderPoint) : existing.reorderPoint,
        maximumStock: body.maximumStock !== undefined ? Number(body.maximumStock) : existing.maximumStock,
        leadTimeDays: body.leadTimeDays !== undefined ? Number(body.leadTimeDays) : existing.leadTimeDays,
        avgDailyUsage: body.avgDailyUsage !== undefined ? Number(body.avgDailyUsage) : existing.avgDailyUsage,
        defaultLocationId: body.defaultLocationId !== undefined ? body.defaultLocationId : existing.defaultLocationId,
        barcode: body.barcode ?? existing.barcode,
        imageUrl: body.imageUrl ?? existing.imageUrl,
      },
      include: {
        category: true,
        supplier: true,
        stocks: { include: { warehouse: true, location: true } },
      },
    });

    await StockEngine.recalculateProductStatus(id);

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const currentStock = await StockEngine.getTotalProductStock(id);
    if (currentStock > 0) {
      throw new AppError(
        `Cannot delete product with active inventory (${currentStock} units in stock). Please adjust stock to 0 first.`,
        400,
        'ACTIVE_INVENTORY'
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProductMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const movements = await prisma.stockLedger.findMany({
      where: { productId: id },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        user: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      data: { movements },
    });
  } catch (error) {
    next(error);
  }
};
