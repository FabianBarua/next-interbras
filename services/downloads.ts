import { downloadsMock } from "../mock/downloads"
import type { DownloadFile } from "../types/download"
import { categoriesMock } from "../mock/categories"

const DELAY = 500

export async function getDownloads(): Promise<DownloadFile[]> {
  return new Promise((resolve) => setTimeout(() => resolve(downloadsMock), DELAY))
}

export async function getDownloadsByCategory(categoryId: string): Promise<DownloadFile[]> {
  return new Promise((resolve) => 
    setTimeout(() => {
      const downloads = downloadsMock.filter(d => d.productCategoryId === categoryId)
      resolve(downloads)
    }, DELAY)
  )
}
