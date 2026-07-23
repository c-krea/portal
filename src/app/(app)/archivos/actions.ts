"use server"

import { listFiles, getSignedDownloadUrl, deleteFile } from "@/lib/r2/files"
import { getAuthUser } from "@/lib/auth/session"

async function requireAuth() {
  const user = await getAuthUser()
  if (!user) throw new Error("No autorizado")
  return user
}

export async function getArchivosList(prefix?: string) {
  await requireAuth()
  return listFiles(prefix)
}

export async function getDownloadUrl(key: string): Promise<string> {
  await requireAuth()
  return getSignedDownloadUrl(key)
}

export async function deleteArchivo(key: string): Promise<void> {
  await requireAuth()
  await deleteFile(key)
}
