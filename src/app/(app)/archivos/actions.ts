"use server"

import { listFiles, getSignedDownloadUrl, deleteFile } from "@/lib/r2/files"

export async function getArchivosList(prefix?: string) {
  return listFiles(prefix)
}

export async function getDownloadUrl(key: string): Promise<string> {
  return getSignedDownloadUrl(key)
}

export async function deleteArchivo(key: string): Promise<void> {
  await deleteFile(key)
}
