import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { uploadToS3 } from "../lib/s3.js";

export const uploadImage = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "File is required" });
  }

  const originalName = file.originalname.replace(/\s+/g, "-");
  const extension = originalName.includes(".") ? originalName.split(".").pop() ?? "jpg" : "jpg";
  const baseName = originalName.replace(/\.[^.]+$/, "") || `image-${Date.now()}`;
  const key = `sparekart/products/${Date.now()}-${baseName}.${extension}`;
  const url = await uploadToS3({
    key,
    body: file.buffer,
    contentType: file.mimetype
  });

  res.status(StatusCodes.CREATED).json({ url });
};
