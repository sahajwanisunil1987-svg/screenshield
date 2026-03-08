import { Request, Response } from "express";
import { getSingleParam } from "../utils/helpers.js";
import * as wishlistService from "../services/wishlist.service.js";

export const list = async (req: Request, res: Response) => {
  res.json(await wishlistService.getWishlist(req.user!.userId));
};

export const add = async (req: Request, res: Response) => {
  res.json(await wishlistService.addWishlistItem(req.user!.userId, getSingleParam(req.params.id)!));
};

export const remove = async (req: Request, res: Response) => {
  res.json(await wishlistService.removeWishlistItem(req.user!.userId, getSingleParam(req.params.id)!));
};
