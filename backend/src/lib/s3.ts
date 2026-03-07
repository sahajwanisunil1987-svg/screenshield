import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "../config/env.js";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

export const uploadToS3 = async (params: {
  key: string;
  body: Buffer;
  contentType: string;
}) => {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: env.AWS_S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    }
  });

  await upload.done();

  return `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${params.key}`;
};
