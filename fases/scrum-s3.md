# Sprint 3 — Envío 🔧 EN PROGRESO

**Objetivo**: Página `/checkout/envio` — selección de país → método de envío → dirección/pickup  
**Story Points**: 8  
**Guard**: Requiere auth + perfil completo → redirect a `/checkout` si no cumple

| # | Tarea | SP | Estado |
|---|-------|----|--------|
| 3.1 | Crear `types/country.ts` — tipo Country | 0.5 | ⬜ |
| 3.2 | Crear `services/countries.ts` — `getCountries()`, `getShippingMethodsByCountry()` | 1.5 | ⬜ |
| 3.3 | Crear componente `country-selector.tsx` — grid de países con banderas | 1 | ⬜ |
| 3.4 | Crear componente `shipping-selector.tsx` — radio cards con precio | 1 | ⬜ |
| 3.5 | Crear componente `address-form.tsx` — direcciones guardadas + nueva dirección | 1.5 | ⬜ |
| 3.6 | Crear componente `pickup-info.tsx` — info de retiro si `!requiresAddress` | 0.5 | ⬜ |
| 3.7 | Crear server action `selectShippingAction` — validar + guardar cookie + redirect | 1 | ⬜ |
| 3.8 | Crear `app/(public)/checkout/envio/page.tsx` — server component con guard | 1 | ⬜ |

**Flujo**:
1. Seleccionar país (flags grid)
2. Ver métodos de envío filtrados por `shipping_method_countries`
3. Si `requiresAddress` → formulario dirección (guardadas + nueva)
4. Si `!requiresAddress` → mostrar `pickupConfig`
5. Submit → cookie → redirect `/checkout/pago`
