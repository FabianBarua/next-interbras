import type { DownloadFile } from "../types/download"

// TODO: connect to DB when downloads table is created
export async function getDownloads(): Promise<DownloadFile[]> {
  return []
}

export async function getDownloadsByCategory(_categoryId: string): Promise<DownloadFile[]> {
  return []
}
