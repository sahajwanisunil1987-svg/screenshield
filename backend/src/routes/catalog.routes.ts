import { Router } from "express";
import * as catalogController from "../controllers/catalog.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { searchRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validation/common.js";
import {
  adminProductListSchema,
  brandSchema,
  categorySchema,
  modelSchema,
  productSchema,
  productSearchSchema,
  productSuggestionSchema
} from "../validation/catalog.validation.js";

const router = Router();

router.get("/brands", catalogController.getBrands);
router.get("/models", catalogController.getModels);
router.get("/models/by-brand/:brandId", catalogController.getModelsByBrand);
router.get("/categories", catalogController.getCategories);
router.get("/products", searchRateLimiter, validate({ query: productSearchSchema }), catalogController.getProducts);
router.get("/products/search", searchRateLimiter, validate({ query: productSearchSchema }), catalogController.searchProducts);
router.get(
  "/products/suggestions",
  searchRateLimiter,
  validate({ query: productSuggestionSchema }),
  catalogController.getProductSuggestions
);
router.get("/products/:slug", catalogController.getProductBySlug);
router.get(
  "/admin/products",
  authenticate,
  requireAdmin,
  validate({ query: adminProductListSchema }),
  catalogController.getAdminProducts
);
router.get(
  "/admin/products/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  catalogController.getAdminProductById
);

router.post("/admin/brands", authenticate, requireAdmin, validate({ body: brandSchema }), catalogController.createBrand);
router.put(
  "/admin/brands/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: brandSchema }),
  catalogController.updateBrand
);
router.delete(
  "/admin/brands/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  catalogController.deleteBrand
);

router.post("/admin/models", authenticate, requireAdmin, validate({ body: modelSchema }), catalogController.createModel);
router.put(
  "/admin/models/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: modelSchema }),
  catalogController.updateModel
);
router.delete(
  "/admin/models/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  catalogController.deleteModel
);

router.post(
  "/admin/categories",
  authenticate,
  requireAdmin,
  validate({ body: categorySchema }),
  catalogController.createCategory
);
router.put(
  "/admin/categories/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: categorySchema }),
  catalogController.updateCategory
);
router.delete(
  "/admin/categories/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  catalogController.deleteCategory
);

router.post("/admin/products", authenticate, requireAdmin, validate({ body: productSchema }), catalogController.createProduct);
router.put(
  "/admin/products/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: productSchema }),
  catalogController.updateProduct
);
router.delete(
  "/admin/products/:id",
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  catalogController.deleteProduct
);

export default router;
