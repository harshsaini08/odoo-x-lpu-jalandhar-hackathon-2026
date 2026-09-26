export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  avatarUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  leadTimeDays: number;
  rating: number;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface LocationStock {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  warehouse: { id: string; name: string; code: string };
  location: { id: string; name: string; code: string; rackNumber?: string; capacity: number; type: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category: Category;
  unitOfMeasure: string;
  description?: string | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  reorderPoint: number;
  maximumStock: number;
  leadTimeDays: number;
  avgDailyUsage: number;
  defaultLocationId?: string | null;
  defaultLocation?: { id: string; name: string; code: string; warehouse?: { name: string } } | null;
  status: 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED' | 'SLOW_MOVING';
  barcode?: string | null;
  imageUrl?: string | null;
  currentStock: number;
  stockValuation?: number;
  stocks?: LocationStock[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  id?: string;
  productId: string;
  product?: Product;
  locationId?: string | null;
  location?: { id: string; name: string; code: string } | null;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplier: Supplier;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  orderDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';
  notes?: string | null;
  items: ReceiptItem[];
  createdBy?: { id: string; name: string } | null;
  validatedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface DeliveryItem {
  id?: string;
  productId: string;
  product?: Product;
  locationId?: string | null;
  location?: { id: string; name: string; code: string } | null;
  requestedQuantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  customerId: string;
  customer: Customer;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  orderDate: string;
  scheduledDate?: string | null;
  deliveredDate?: string | null;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'PICKED' | 'PACKED' | 'DONE' | 'CANCELED';
  destination?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  items: DeliveryItem[];
  createdBy?: { id: string; name: string } | null;
  validatedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface TransferItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  notes?: string | null;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouse: { id: string; name: string; code: string };
  sourceLocationId: string;
  sourceLocation: { id: string; name: string; code: string };
  destWarehouseId: string;
  destWarehouse: { id: string; name: string; code: string };
  destLocationId: string;
  destLocation: { id: string; name: string; code: string };
  status: 'DRAFT' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELED';
  transferDate: string;
  completedDate?: string | null;
  notes?: string | null;
  items: TransferItem[];
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  locationId: string;
  location: { id: string; name: string; code: string };
  productId: string;
  product: Product;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  reason: string;
  category: 'DAMAGED' | 'LOST' | 'COUNT_ERROR' | 'EXPIRED' | 'FOUND' | 'DEMO';
  status: 'DRAFT' | 'CONFIRMED' | 'REJECTED';
  adjustmentDate: string;
  approvedBy?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt: string;
}

export interface StockLedgerEntry {
  id: string;
  transactionNumber: string;
  timestamp: string;
  type: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';
  productId: string;
  product: { id: string; name: string; sku: string; unitOfMeasure: string };
  sku: string;
  sourceWarehouse?: { id: string; name: string; code: string } | null;
  sourceLocation?: { id: string; name: string; code: string } | null;
  destWarehouse?: { id: string; name: string; code: string } | null;
  destLocation?: { id: string; name: string; code: string } | null;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  beforeLocationStock?: number | null;
  afterLocationStock?: number | null;
  user?: { id: string; name: string; email: string } | null;
  referenceDoc?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  productId?: string | null;
  product?: Product | null;
  warehouseId?: string | null;
  warehouse?: { id: string; name: string } | null;
  locationId?: string | null;
  location?: { id: string; name: string } | null;
  recommendedAction?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface WarehouseLocationDetail {
  id: string;
  name: string;
  code: string;
  rackNumber: string;
  shelfNumber: string;
  type: string;
  capacity: number;
  usedCapacity: number;
  utilizationPercent: number;
  statusColor: 'green' | 'yellow' | 'red';
  productCount: number;
  stocks: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    category: string;
    quantity: number;
    unitOfMeasure: string;
    reorderPoint: number;
    isLowStock: boolean;
  }>;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  isPrimary: boolean;
  totalCapacity: number;
  usedCapacity: number;
  utilizationPercent: number;
  totalLocations: number;
  lowStockItemCount: number;
  locations: WarehouseLocationDetail[];
}

export interface HealthScoreData {
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

export interface StockExplanation {
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
    currentStock: number;
    minimumStock: number;
    reorderPoint: number;
    maximumStock: number;
  };
  summary: {
    initialEstimatedStock: number;
    totalReceipts: number;
    totalDeliveries: number;
    totalAdjustments: number;
    netChange: number;
    currentStock: number;
    formula: string;
  };
  breakdownItems: Array<{
    type: string;
    label: string;
    count: number;
    quantity: number;
    displayQty: string;
    impact: string;
    description: string;
  }>;
  recentMovements: any[];
}

export interface DemandForecastResult {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  costPrice: number;
  historicalDays: number;
  totalHistoricalDemand: number;
  avgDailyDemand: number;
  recentDailyDemand: number;
  trendPercentage: number;
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' | 'SEASONAL' | 'SLOW_MOVING';
  projectedDailyDemand: number;
  projected30dDemand: number;
  projected60dDemand: number;
  projected90dDemand: number;
  expectedStockoutDays: number;
  expectedStockoutDate: string | null;
  supplierLeadTime: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedReorderQty: number;
  forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  isLowData: boolean;
  explanation: string;
  historicalTimeline: Array<{
    date: string;
    dayLabel: string;
    actualDemand: number;
    stockLevel: number;
  }>;
  forecastTimeline: Array<{
    date: string;
    dayLabel: string;
    projectedDemand: number;
    upperBound: number;
    lowerBound: number;
    projectedStock: number;
  }>;
  preferredSupplier: {
    id: string;
    name: string;
    leadTimeDays: number;
  } | null;
  defaultLocation: {
    id: string;
    name: string;
    warehouseId: string;
    warehouseName: string;
  } | null;
}

export interface CopilotMessageResponse {
  message: string;
  suggestedFollowUps?: string[];
  actionButton?: {
    label: string;
    path?: string;
    actionType: 'NAVIGATE' | 'OPEN_MODAL' | 'EXECUTE_TRANSFER' | 'PREPARE_REORDER';
    payload?: any;
  } | null;
  preparedAction?: {
    actionType: 'TRANSFER' | 'RECEIPT' | 'DELIVERY' | 'ADJUSTMENT';
    title: string;
    summary: string;
    fields: Record<string, any>;
    requiresConfirmation: boolean;
  } | null;
  dataSummary?: any;
}

export interface ActionRequiredItem {
  id: string;
  type: string;
  severity: 'WARNING' | 'INFO' | 'MUTED' | 'CRITICAL';
  title: string;
  sku: string;
  subtitle: string;
  actionLabel: string;
  linkUrl: string;
}

