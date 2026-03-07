import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { uploadToCloudinary } from "../lib/cloudinary.js";

export const uploadImage = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "File is required" });
  }

  const url = await uploadToCloudinary({
    folder: "sparekart/products",
    body: file.buffer,
    fileName: file.originalname,
    contentType: file.mimetype
  });

  res.status(StatusCodes.CREATED).json({ url });
};
