import { Request, Response } from "express";
import { getShippingSettings } from "../services/shipping-settings.service.js";

export const getPublicShippingSettings = async (_req: Request, res: Response) => {
  const settings = await getShippingSettings();
  res.json(settings);
};
