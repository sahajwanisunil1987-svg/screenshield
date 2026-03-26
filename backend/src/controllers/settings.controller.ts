import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeAppSettings } from "../services/app-settings.service.js";

export const getAppSettings = async (_req: Request, res: Response) => {
  res.json(await serializeAppSettings(prisma));
};
