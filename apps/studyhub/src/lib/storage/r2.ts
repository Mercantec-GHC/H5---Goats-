import { S3Client } from "@aws-sdk/client-s3";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const R2_BUCKET_NAME = getRequiredEnv("R2_BUCKET_NAME");

export const r2Client = new S3Client({
  region: "auto",
  endpoint: getRequiredEnv("R2_ENDPOINT"),

  credentials: {
    accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
  },
});