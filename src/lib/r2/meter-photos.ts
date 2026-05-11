import { uploadFile } from "./files"

export async function uploadMeterPhoto(
  buffer: ArrayBuffer,
  mimeType: string,
  unitNumber: string,
  periodo: string,
): Promise<{ key: string; url: string }> {
  const ext = mimeType === "image/png" ? "png" : "jpg"
  const timestamp = Date.now()
  const key = `medidores/${periodo}/local-${unitNumber}-${timestamp}.${ext}`

  await uploadFile(key, Buffer.from(buffer), mimeType)

  return { key, url: key }
}
