export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type MobileModel = {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brand?: Brand;
  isActive?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
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
  brand: Brand;
  model: MobileModel;
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
  createdAt: string;
  user: {
    name: string;
  };
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

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  phone?: string | null;
  addresses?: Array<{
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
  }>;
  orders?: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
  }>;
  _count?: {
    orders: number;
  };
};

export type InventoryItem = {
  id: string;
  stock: number;
  lowStockLimit: number;
  warehouseCode?: string | null;
  product: Product;
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

export type SearchSuggestion = {
  id: string;
  type: "product";
  label: string;
  hint: string;
  slug: string;
  searchTerm: string;
};
