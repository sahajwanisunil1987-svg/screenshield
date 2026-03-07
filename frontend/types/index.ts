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
};
