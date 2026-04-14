# Sprint 5 — Dashboard + Cleanup ⬜ PENDIENTE

**Objetivo**: CRUD dashboard para países/reglas + limpieza final  
**Story Points**: 5

| # | Tarea | SP | Estado |
|---|-------|----|--------|
| 5.1 | Crear `app/dashboard/countries/page.tsx` + `table.tsx` — CRUD países | 1.5 | ⬜ |
| 5.2 | Agregar UI asignación países a shipping methods (multi-select) | 1 | ⬜ |
| 5.3 | Agregar UI asignación gateway types a shipping methods (multi-select) | 1 | ⬜ |
| 5.4 | Eliminar `checkout-form.tsx` viejo | 0.25 | ⬜ |
| 5.5 | Actualizar diccionarios i18n (ES/PT) — nuevas keys checkout | 0.5 | ⬜ |
| 5.6 | `tsc --noEmit` + `eslint` final | 0.25 | ⬜ |
| 5.7 | Agregar link "Países" al sidebar dashboard | 0.25 | ⬜ |
| 5.8 | Test manual de flujo completo (10 pasos de verificación) | 0.25 | ⬜ |

## Verificación Final (Definition of Done)

- [ ] `tsc --noEmit` sin errores
- [ ] `eslint` sin errores
- [ ] `/checkout` sin auth → muestra login/register
- [ ] Register/login → perfil incompleto → formulario completar
- [ ] Perfil completo → redirect `/checkout/envio`
- [ ] `/checkout/envio` → seleccionar país → métodos de envío filtrados
- [ ] Seleccionar envío → dirección o pickup → redirect `/checkout/pago`
- [ ] `/checkout/pago` → solo gateways permitidos por `shipping_payment_rules`
- [ ] Confirmar → orden creada → redirect `/checkout/payment/[orderId]`
- [ ] Página pago existente funciona (sin regresión)
- [ ] Dashboard: CRUD países, asignar países a shipping, asignar gateways a shipping
