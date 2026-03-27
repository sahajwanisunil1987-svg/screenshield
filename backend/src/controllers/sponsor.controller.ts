import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getSingleParam } from "../utils/helpers.js";
import * as sponsorService from "../services/sponsor.service.js";

export const listSponsorAds = async (_req: Request, res: Response) => {
  res.json(await sponsorService.listSponsorAds());
};

export const getSponsorForPlacement = async (req: Request, res: Response) => {
  const placement = getSingleParam(req.params.placement)! as sponsorService.SponsorPlacement;
  res.json(await sponsorService.getSponsorByPlacement(placement));
};

export const createSponsorAd = async (req: Request, res: Response) => {
  res.status(StatusCodes.CREATED).json(await sponsorService.createSponsorAd(req.body));
};

export const updateSponsorAd = async (req: Request, res: Response) => {
  res.json(await sponsorService.updateSponsorAd(getSingleParam(req.params.id)!, req.body));
};

export const deleteSponsorAd = async (req: Request, res: Response) => {
  await sponsorService.deleteSponsorAd(getSingleParam(req.params.id)!);
  res.status(StatusCodes.NO_CONTENT).send();
};
