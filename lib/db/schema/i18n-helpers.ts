/** Shared i18n types for JSONB columns */

/** Short translatable text: { es: "Negro", pt: "Preto", en: "Black" } */
export type I18nText = Record<string, string>

/** Long/HTML translatable text per locale */
export type I18nRichText = Record<string, string>

/** Structured specs per locale: { es: [{ label: "Potencia", value: "1500W" }] } */
export type I18nSpecs = Record<string, Array<{ label: string; value: string }>>
