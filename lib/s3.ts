

import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string, mimeType: string) {
  const key = `${folderPrefix}phase-documents/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return key;
}

export async function uploadLogo(buffer: Buffer, fileName: string, mimeType: string) {
  const key = `${folderPrefix}logos/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return key;
}

// Sobrecarga para manter compatibilidade com chamadas existentes
export async function getFileUrl(key: string, isPublicOrExpiresIn?: boolean | number, expiresIn?: number): Promise<string> {
  // Detectar se o segundo parâmetro é um número (expiresIn) ou boolean (isPublic)
  let isPublic = false;
  let expiry = 3600;
  
  if (typeof isPublicOrExpiresIn === "boolean") {
    isPublic = isPublicOrExpiresIn;
    expiry = expiresIn || 3600;
  } else if (typeof isPublicOrExpiresIn === "number") {
    expiry = isPublicOrExpiresIn;
  }
  
  // Para arquivos públicos, retornar URL direta
  if (isPublic) {
    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
  
  // Para arquivos privados, gerar URL assinada
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: "attachment",
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: expiry });
  return url;
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

// Gerar URL presignada para upload direto do cliente
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const prefix = isPublic ? "public/uploads" : "uploads";
  const cloud_storage_path = `${folderPrefix}${prefix}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ...(isPublic && { ContentDisposition: "attachment" }),
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { uploadUrl, cloud_storage_path };
}
