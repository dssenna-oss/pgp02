import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME!,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || "",
  };
}

export function createS3Client() {
  const config: S3ClientConfig = {
    region: process.env.AWS_REGION || "us-east-1",
  };

  // Em produção (Vercel/serverless), usa credenciais via env vars.
  // Localmente, se as vars não estiverem definidas, o SDK cai no fluxo
  // padrão (~/.aws/credentials, AWS_PROFILE, IAM role, etc).
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && {
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }),
    };
  }

  return new S3Client(config);
}
