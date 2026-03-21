import { Request, Response } from "express";
import { getPublicAppSettings, updatePublicAppSettings } from "../services/app-settings.service.js";
import { getShippingSettings } from "../services/shipping-settings.service.js";

export const getPublicShippingSettings = async (_req: Request, res: Response) => {
  const settings = await getShippingSettings();
  res.json(settings);
};

export const getPublicSettings = async (_req: Request, res: Response) => {
  const settings = await getPublicAppSettings();
  res.json(settings);
};

export const getAdminAppSettings = async (_req: Request, res: Response) => {
  const settings = await getPublicAppSettings();
  res.json(settings);
};

export const saveAdminAppSettings = async (req: Request, res: Response) => {
  const settings = await updatePublicAppSettings(req.body);
  res.json(settings);
};
