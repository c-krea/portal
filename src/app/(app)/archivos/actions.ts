"use server"

import { listFiles, getSignedDownloadUrl, deleteFile } from "@/lib/r2/files"
import { createClient } from "@/lib/supabase/server"

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
