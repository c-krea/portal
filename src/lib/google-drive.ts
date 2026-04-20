import { google } from "googleapis"
import { Readable } from "stream"

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
  })
  return folder.data.id!
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

  const stream = Readable.from(Buffer.from(buffer))
  const file = await drive.files.create({
    requestBody: {
      name: `${periodo}.jpg`,
      parents: [unitFolderId],
    },
    media: {
      mimeType: mimeType || "image/jpeg",
      body: stream,
    },
    fields: "id",
  })

  const fileId = file.data.id!

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  })

  return {
    fileId,
    url: `https://drive.google.com/uc?id=${fileId}`,
  }
}
