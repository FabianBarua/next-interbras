import type { I18nText } from "./common"

export type DownloadCategory = "MANUAL" | "DATASHEET" | "FIRMWARE" | "OTHER"

export interface DownloadFile {
  id: string
  title: I18nText
  type: DownloadCategory
  fileUrl: string
  fileSize?: string
  productId?: string
  productCategoryId?: string
  version?: string
  date: string
}
