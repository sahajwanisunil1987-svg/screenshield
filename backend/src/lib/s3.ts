import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const assertS3Config = () => {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET || !env.AWS_S3_PUBLIC_BASE_URL) {
    throw new ApiError(500, "AWS S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, and AWS_S3_PUBLIC_BASE_URL.");
  }
};

const getS3Client = () => {
  assertS3Config();

  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });
};

export const uploadToS3 = async (params: {
  key: string;
  body: Buffer;
  contentType: string;
}) => {
  assertS3Config();

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: env.AWS_S3_BUCKET!,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    }
  });

  await upload.done();

  return `${env.AWS_S3_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${params.key}`;
};
