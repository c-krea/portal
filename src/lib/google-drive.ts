import { google } from "googleapis"
import { PDFDocument } from "pdf-lib"

function getDriveClient() {
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
  return google.drive({ version: "v3", auth })
}

async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string,
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  })
  return folder.data.id!
}

async function toPdf(buffer: ArrayBuffer, mimeType: string): Promise<{ data: Buffer; mime: string; ext: string }> {
  if (mimeType === "application/pdf") {
    return { data: Buffer.from(buffer), mime: "application/pdf", ext: "pdf" }
  }
  try {
    const pdfDoc = await PDFDocument.create()
    const image = mimeType === "image/png"
      ? await pdfDoc.embedPng(buffer)
      : await pdfDoc.embedJpg(buffer)
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    return { data: Buffer.from(await pdfDoc.save()), mime: "application/pdf", ext: "pdf" }
  } catch {
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg"
    return { data: Buffer.from(buffer), mime: mimeType, ext }
  }
}

export async function uploadMeterPhoto(
  buffer: ArrayBuffer,
  mimeType: string,
  unitNumber: string,
  periodo: string,
): Promise<{ fileId: string; url: string }> {
  const drive = getDriveClient()
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

  const unitFolderId = await getOrCreateFolder(drive, `Local ${unitNumber}`, rootFolderId)

  const { data: fileData, mime: fileMime, ext: fileExt } = await toPdf(buffer, mimeType)

  const { Readable } = await import("stream")
  const stream = new Readable()
  stream.push(fileData)
  stream.push(null)

  const file = await drive.files.create({
    requestBody: {
      name: `${periodo}.${fileExt}`,
      parents: [unitFolderId],
    },
    media: {
      mimeType: fileMime,
      body: stream,
    },
    fields: "id",
    supportsAllDrives: true,
  })

  const fileId = file.data.id!

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  })

  return {
    fileId,
    url: `https://drive.google.com/file/d/${fileId}/view`,
  }
}
