import {
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2, R2_BUCKET } from "./client"

export type R2File = {
  key: string
  size: number
  lastModified: Date
  type: "factura" | "medidor" | "otro"
  periodo: string   // YYYY-MM
  local: string     // unit identifier parsed from key
  nombre: string    // display filename
}

function parseKey(obj: _Object): R2File {
  const key = obj.Key ?? ""
  const parts = key.split("/")
  // Expected patterns:
  //   facturas/YYYY-MM/local-{id}.pdf
  //   medidores/YYYY-MM/local-{id}-{timestamp}.jpg
  const folder = parts[0] ?? ""
  const periodo = parts[1] ?? ""
  const filename = parts[2] ?? key

  let type: R2File["type"] = "otro"
  if (folder === "facturas") type = "factura"
  else if (folder === "medidores") type = "medidor"

  // Extract local id from filename: local-101.pdf → "101"
  const localMatch = filename.match(/local-([^-.]+)/)
  const local = localMatch ? localMatch[1] : "—"

  return {
    key,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date(),
    type,
    periodo,
    local,
    nombre: filename,
  }
}

export async function listFiles(prefix?: string): Promise<R2File[]> {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
    MaxKeys: 1000,
  })
  const response = await r2.send(command)
  return (response.Contents ?? []).map(parseKey)
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn: 3600 })
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function deleteFile(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}
