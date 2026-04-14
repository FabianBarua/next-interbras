/**
 * States/departments per country code.
 * Used in address forms as a Select dropdown instead of freeform text.
 */
export const countryStates: Record<string, { code: string; name: string }[]> = {
  PY: [
    { code: "ASU", name: "Asunción" },
    { code: "ALT", name: "Alto Paraná" },
    { code: "ALP", name: "Alto Paraguay" },
    { code: "AMA", name: "Amambay" },
    { code: "BOQ", name: "Boquerón" },
    { code: "CAA", name: "Caaguazú" },
    { code: "CAZ", name: "Caazapá" },
    { code: "CAN", name: "Canindeyú" },
    { code: "CEN", name: "Central" },
    { code: "CON", name: "Concepción" },
    { code: "COR", name: "Cordillera" },
    { code: "GUA", name: "Guairá" },
    { code: "ITA", name: "Itapúa" },
    { code: "MIS", name: "Misiones" },
    { code: "NEE", name: "Ñeembucú" },
    { code: "PAR", name: "Paraguarí" },
    { code: "PHA", name: "Pdte. Hayes" },
    { code: "SPE", name: "San Pedro" },
  ],
  BR: [
    { code: "AC", name: "Acre" },
    { code: "AL", name: "Alagoas" },
    { code: "AP", name: "Amapá" },
    { code: "AM", name: "Amazonas" },
    { code: "BA", name: "Bahia" },
    { code: "CE", name: "Ceará" },
    { code: "DF", name: "Distrito Federal" },
    { code: "ES", name: "Espírito Santo" },
    { code: "GO", name: "Goiás" },
    { code: "MA", name: "Maranhão" },
    { code: "MT", name: "Mato Grosso" },
    { code: "MS", name: "Mato Grosso do Sul" },
    { code: "MG", name: "Minas Gerais" },
    { code: "PA", name: "Pará" },
    { code: "PB", name: "Paraíba" },
    { code: "PR", name: "Paraná" },
    { code: "PE", name: "Pernambuco" },
    { code: "PI", name: "Piauí" },
    { code: "RJ", name: "Rio de Janeiro" },
    { code: "RN", name: "Rio Grande do Norte" },
    { code: "RS", name: "Rio Grande do Sul" },
    { code: "RO", name: "Rondônia" },
    { code: "RR", name: "Roraima" },
    { code: "SC", name: "Santa Catarina" },
    { code: "SP", name: "São Paulo" },
    { code: "SE", name: "Sergipe" },
    { code: "TO", name: "Tocantins" },
  ],
}

/** Get states/departments for a country code, or empty array if not found */
export function getStatesForCountry(countryCode: string) {
  return countryStates[countryCode] ?? []
}
