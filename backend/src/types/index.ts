export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';

export type ProductStatus = 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED' | 'SLOW_MOVING';

export type ReceiptStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export type DeliveryStatus = 'DRAFT' | 'WAITING' | 'READY' | 'PICKED' | 'PACKED' | 'DONE' | 'CANCELED';

export type TransferStatus = 'DRAFT' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELED';

export type AdjustmentStatus = 'DRAFT' | 'CONFIRMED' | 'REJECTED';

export type LedgerType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';

export type AlertType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'REORDER_REQUIRED'
  | 'UNUSUAL_ADJUSTMENT'
  | 'STOCKOUT_RISK'
  | 'OVERSTOCK'
  | 'SLOW_MOVING'
  | 'NEGATIVE_STOCK_ATTEMPT'
  | 'PENDING_RECEIPT'
  | 'PENDING_DELIVERY';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  maximumStock: number;
  avgDailyUsage: number;
  leadTimeDays: number;
  safetyStock: number;
  recommendedOrderQuantity: number;
  riskLevel: 'SAFE' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  estimatedStockoutDays: number;
  reason: string;
  calculationFormula: string;
  preferredSupplier?: {
    id: string;
    name: string;
    leadTimeDays: number;
  } | null;
}

export interface InventoryHealthScoreBreakdown {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    stockAvailability: { score: number; max: number; label: string; details: string };
    lowStockPenalty: { score: number; max: number; label: string; details: string };
    outOfStockPenalty: { score: number; max: number; label: string; details: string };
    pendingOperationsImpact: { score: number; max: number; label: string; details: string };
    adjustmentAnomalies: { score: number; max: number; label: string; details: string };
    slowMovingPenalty: { score: number; max: number; label: string; details: string };
  };
  summary: string;
  actionableInsights: string[];
}
