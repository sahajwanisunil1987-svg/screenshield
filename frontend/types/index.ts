export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export type MobileModel = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  brandId: string;
  brand?: Brand;
  isActive?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export type ProductImage = {
  id?: string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  price: number;
  comparePrice?: number | null;
  warrantyMonths: number;
  stock: number;
  averageRating: number;
  reviewCount: number;
  videoUrl?: string | null;
  brand: Brand;
  model: MobileModel;
  compatibilityModels?: Array<{
    model: MobileModel;
  }>;
  category: Category;
  images: ProductImage[];
  inventory?: {
    stock: number;
    lowStockLimit: number;
    warehouseCode?: string | null;
  } | null;
  isFeatured?: boolean;
  isActive?: boolean;
};

export type ProductListResponse = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  status?: "PENDING" | "APPROVED" | "HIDDEN";
  createdAt: string;
  user: {
    name: string;
  };
};

export type AdminReview = Review & {
  user: {
    name: string;
    email: string;
  };
  status: "PENDING" | "APPROVED" | "HIDDEN";
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
  };
};

export type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  gstNumber?: string | null;
  isDefault: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  shippingCourier?: string | null;
  shippingAwb?: string | null;
  estimatedDeliveryAt?: string | null;
  adminNotes?: string | null;
  cancelRequestedAt?: string | null;
  cancelRequestReason?: string | null;
  cancelRequestStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  cancelDecisionAt?: string | null;
  cancelDecisionNote?: string | null;
  cancelledAt?: string | null;
  returnRequestedAt?: string | null;
  returnRequestReason?: string | null;
  returnRequestStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  returnDecisionAt?: string | null;
  returnDecisionNote?: string | null;
  returnedAt?: string | null;
  items: Array<{
    id: string;
    quantity: number;
    productName: string;
    productSku: string;
    totalPrice: number;
    product?: Product;
  }>;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  };
  addressSnapshot?: Record<string, string | undefined>;
  invoice?: {
    invoiceNumber?: string | null;
  } | null;
  gstNumber?: string | null;
};

export type AdminOrder = Order & {
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

export type UserOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount?: number;
  items?: Array<{
    id: string;
    quantity: number;
    productName: string;
    productSku: string;
    totalPrice: number;
  }>;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  phone?: string | null;
  addresses?: Address[];
  orders?: UserOrderSummary[];
  _count?: {
    orders: number;
    addresses?: number;
  };
};

export type AdminUserDetail = User & {
  addresses: Address[];
  orders: UserOrderSummary[];
  stats: {
    totalOrders: number;
    totalAddresses: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderAt?: string | null;
  };
};

export type InventoryItem = {
  id: string;
  stock: number;
  lowStockLimit: number;
  warehouseCode?: string | null;
  lastRestockedAt?: string | null;
  impactedActiveOrders?: number;
  product: Product;
};

export type InventorySummary = {
  critical: number;
  low: number;
  healthy: number;
  totalUnits: number;
  reorderUnits: number;
};

export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
};

export type InvoiceRecord = {
  id: string;
  orderId: string;
  invoiceNumber: string;
  gstin?: string | null;
  billingName: string;
  billingEmail?: string | null;
  billingPhone?: string | null;
  pdfUrl?: string | null;
  generatedAt?: string | null;
  lastDownloadedAt?: string | null;
  downloadCount: number;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  };
};

export type SearchSuggestion = {
  id: string;
  type: "product";
  label: string;
  hint: string;
  slug: string;
  searchTerm: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  href?: string | null;
  kind: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};


export type SupportTicket = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  orderNumber?: string | null;
  kind: "ORDER_ISSUE" | "RETURN_ISSUE" | "PAYMENT_ISSUE" | "PRODUCT_INQUIRY" | "OTHER";
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  adminNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};


export type Vendor = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  isActive: boolean;
};

export type PurchaseEntry = {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  invoiceRef?: string | null;
  notes?: string | null;
  purchasedAt: string;
  vendor: Vendor;
  product: Product;
};
