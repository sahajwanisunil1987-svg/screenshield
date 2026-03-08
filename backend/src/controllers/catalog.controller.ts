import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as catalogService from "../services/catalog.service.js";
import { prisma } from "../lib/prisma.js";
import { getSingleParam } from "../utils/helpers.js";

export const getBrands = async (_req: Request, res: Response) => {
  res.json(await catalogService.getBrands());
};

export const createBrand = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await catalogService.createBrand(req.body));
};

export const updateBrand = async (req: Request, res: Response) => {
  res.json(await catalogService.updateBrand(getSingleParam(req.params.id)!, req.body));
};

export const deleteBrand = async (req: Request, res: Response) => {
  await catalogService.deleteBrand(getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const getModels = async (req: Request, res: Response) => {
  res.json(await catalogService.getModels(getSingleParam(req.query.brandId as string | string[] | undefined)));
};

export const getModelsByBrand = async (req: Request, res: Response) => {
  res.json(await catalogService.getModels(getSingleParam(req.params.brandId)!));
};

export const createModel = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await catalogService.createModel(req.body));
};

export const updateModel = async (req: Request, res: Response) => {
  res.json(await catalogService.updateModel(getSingleParam(req.params.id)!, req.body));
};

export const deleteModel = async (req: Request, res: Response) => {
  await catalogService.deleteModel(getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const getCategories = async (_req: Request, res: Response) => {
  res.json(await catalogService.getCategories());
};

export const createCategory = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await catalogService.createCategory(req.body));
};

export const updateCategory = async (req: Request, res: Response) => {
  res.json(await catalogService.updateCategory(getSingleParam(req.params.id)!, req.body));
};

export const deleteCategory = async (req: Request, res: Response) => {
  await catalogService.deleteCategory(getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const getProducts = async (req: Request, res: Response) => {
  res.json(await catalogService.listProducts(req.query));
};

export const getAdminProducts = async (_req: Request, res: Response) => {
  res.json(await catalogService.getAdminProducts());
};

export const getAdminProductById = async (req: Request, res: Response) => {
  res.json(await catalogService.getAdminProductById(getSingleParam(req.params.id)!));
};

export const searchProducts = async (req: Request, res: Response) => {
  res.json(await catalogService.listProducts(req.query));
};

export const getProductSuggestions = async (req: Request, res: Response) => {
  res.json(await catalogService.getProductSuggestions(req.query));
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const product = await catalogService.getProductBySlug(getSingleParam(req.params.slug)!);
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product?.categoryId,
      id: { not: product?.id },
      isActive: true
    },
    take: 4,
    include: {
      images: true,
      brand: true,
      model: true,
      category: true
    }
  });

  res.json({ product, relatedProducts });
};

export const createProduct = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await catalogService.createProduct(req.body));
};

export const updateProduct = async (req: Request, res: Response) => {
  res.json(await catalogService.updateProduct(getSingleParam(req.params.id)!, req.body));
};

export const deleteProduct = async (req: Request, res: Response) => {
  await catalogService.deleteProduct(getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};
