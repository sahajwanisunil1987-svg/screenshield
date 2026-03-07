import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { cloudinary } from "../lib/cloudinary.js";

export const uploadImage = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "File is required" });
  }

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "sparekart/products" }, (error, result) => {
      if (error || !result) {
        reject(error);
        return;
      }

      resolve({ secure_url: result.secure_url });
    });

    stream.end(file.buffer);
  });

  res.status(StatusCodes.CREATED).json({ url: uploadResult.secure_url });
};
