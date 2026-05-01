/**
 * Camada de storage unificada.
 *
 * Por padrão, novos uploads vão para Vercel Blob (https://vercel.com/storage/blob).
 * O bucket S3 ainda existe atrás dessa API por compatibilidade legada — quando
 * `cloud_storage_path` parece uma chave S3 (ex.: "phase-documents/abc"),
 * o código cai de volta no SDK da AWS. Quando for uma URL HTTPS (Vercel Blob)
 * ou um caminho relativo (`/phase-documents/...`, servido pelo Next), o
 * arquivo é tratado como já público.
 *
 * Pra produção:
 *   - Habilite Vercel Blob no painel do projeto (Storage → Connect Store → Blob)
 *   - O env var BLOB_READ_WRITE_TOKEN é injetado automaticamente nos
 *     deploys e nas funções serverless. Para `next dev` local, copie o
 *     token (Storage → .env.local) para o seu .env.
 */
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { put, del } from "@vercel/blob";
import { createS3Client, getBucketConfig } from "./aws-config";

// Lazy init pra evitar erro em dev quando AWS não está configurado
let _s3Client: ReturnType<typeof createS3Client> | null = null;
function s3() {
  if (!_s3Client) _s3Client = createS3Client();
  return _s3Client;
}

const { bucketName, folderPrefix } = getBucketConfig();

function isVercelBlobUrl(p: string | null | undefined): boolean {
  if (!p) return false;
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(p);
}

function isHttpUrl(p: string | null | undefined): boolean {
  if (!p) return false;
  return /^https?:\/\//i.test(p);
}

function isLocalPath(p: string | null | undefined): boolean {
  if (!p) return false;
  return p.startsWith("/");
}

export async function uploadFile(buffer: Buffer, fileName: string, mimeType: string) {
  // Vercel Blob: o pathname permite agrupar os arquivos por prefixo.
  const pathname = `${folderPrefix}phase-documents/${Date.now()}-${fileName}`;
  const result = await put(pathname, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });
  // Devolvemos a URL pública. `getFileUrl` aceita URLs HTTPS direto.
  return result.url;
}

export async function uploadLogo(buffer: Buffer, fileName: string, mimeType: string) {
  const pathname = `${folderPrefix}logos/${Date.now()}-${fileName}`;
  const result = await put(pathname, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });
  return result.url;
}

// Sobrecarga para manter compatibilidade com chamadas existentes
export async function getFileUrl(
  key: string,
  isPublicOrExpiresIn?: boolean | number,
  expiresIn?: number
): Promise<string> {
  // Arquivos servidos diretamente: já são URLs prontas (Vercel Blob)
  // ou caminhos relativos do Next (`/phase-documents/...`).
  if (isHttpUrl(key) || isLocalPath(key)) {
    return key;
  }

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

  const url = await getSignedUrl(s3(), command, { expiresIn: expiry });
  return url;
}

export async function deleteFile(key: string) {
  // Caminho local servido pelo Next: nada a apagar (arquivo está no repo).
  if (isLocalPath(key)) return;

  // Vercel Blob: usa o SDK próprio.
  if (isVercelBlobUrl(key)) {
    await del(key);
    return;
  }

  // S3 legado.
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3().send(command);
}

// Gerar URL presignada para upload direto do cliente (S3 — não usado em produção)
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

  const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}
