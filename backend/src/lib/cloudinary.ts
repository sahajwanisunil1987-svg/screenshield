import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const assertCloudinaryConfig = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(500, "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
};

const getCloudinary = () => {
  assertCloudinaryConfig();

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });

  return cloudinary;
};

export const uploadToCloudinary = async (params: {
  folder: string;
  body: Buffer;
  fileName: string;
  contentType: string;
}) => {
  const client = getCloudinary();

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: params.folder,
        resource_type: "image",
        filename_override: params.fileName.replace(/\s+/g, "-"),
        use_filename: true
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({ secure_url: result.secure_url });
      }
    );

    stream.end(params.body);
  });

  return uploadResult.secure_url;
};
