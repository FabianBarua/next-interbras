# Sprint 4 — Pago ⬜ PENDIENTE

**Objetivo**: Página `/checkout/pago` — resumen + gateways filtrados + confirmar + crear orden  
**Story Points**: 8  
**Guard**: Requiere cookie con `shippingMethodId` → redirect a `/checkout/envio` si falta

| # | Tarea | SP | Estado |
|---|-------|----|--------|
| 4.1 | Crear `getGatewayTypesForShipping(shippingMethodId)` — query shipping_payment_rules | 1 | ⬜ |
| 4.2 | Crear `getAvailableGatewaysForCheckout(shippingMethodId)` — rules → gateway_config activos | 1.5 | ⬜ |
| 4.3 | Crear componente order-summary — items del carrito + envío + total | 1 | ⬜ |
| 4.4 | Crear componente gateway-cards — gateways disponibles como cards seleccionables | 1 | ⬜ |
| 4.5 | Reescribir `createOrderAction` — leer cookie en vez de formData | 1.5 | ⬜ |
| 4.6 | Crear `app/(public)/checkout/pago/page.tsx` — server component con guard | 1.5 | ⬜ |
| 4.7 | Verificar `tsc --noEmit` clean | 0.5 | ⬜ |

**Flujo**:
1. Leer cookie → obtener shippingMethodId
2. Consultar `shipping_payment_rules` → tipos de gateway permitidos
3. Obtener gateways activos que matcheen esos tipos
4. Mostrar resumen de orden + tarjetas de gateways
5. Confirmar → crear orden → limpiar cookie → redirect `/checkout/payment/[orderId]`
