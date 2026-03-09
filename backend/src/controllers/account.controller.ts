import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "../services/auth.service.js";
import * as notificationService from "../services/notification.service.js";
import { getSingleParam } from "../utils/helpers.js";

export const profile = async (req: Request, res: Response) => {
  res.json(await authService.getAuthUserById(req.user!.userId));
};

export const updateProfile = async (req: Request, res: Response) => {
  res.json(await authService.updateProfile(req.user!.userId, req.body));
};

export const listAddresses = async (req: Request, res: Response) => {
  res.json(await authService.listAddresses(req.user!.userId));
};

export const createAddress = async (req: Request, res: Response) => {
  const address = await authService.createAddress(req.user!.userId, req.body);
  res.status(StatusCodes.CREATED).json(address);
};

export const updateAddress = async (req: Request, res: Response) => {
  res.json(await authService.updateAddress(req.user!.userId, getSingleParam(req.params.id)!, req.body));
};

export const deleteAddress = async (req: Request, res: Response) => {
  await authService.deleteAddress(req.user!.userId, getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const notifications = async (req: Request, res: Response) => {
  res.json(await notificationService.listNotifications(req.user!.userId));
};

export const readNotification = async (req: Request, res: Response) => {
  await notificationService.markNotificationRead(req.user!.userId, getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const readAllNotifications = async (req: Request, res: Response) => {
  await notificationService.markAllNotificationsRead(req.user!.userId);
  res.status(StatusCodes.NO_CONTENT).send();
};
