# SCRUM — Checkout Multi-Paso

> **Producto**: Checkout multi-paso server-side  
> **Velocidad**: ~8 SP/sprint | **Total**: 37 SP en 5 sprints  
> **Flujo**: `/checkout` (auth) → `/checkout/envio` (envío) → `/checkout/pago` (pago)

| Sprint | Objetivo | SP | Estado |
|--------|----------|----|--------|
| [S1](scrum-s1.md) | Schema + DB | 8 | ✅ Done |
| [S2](scrum-s2.md) | Cookie + Auth Gate | 8 | ✅ Done |
| [S3](scrum-s3.md) | Envío | 8 | 🔧 In Progress |
| [S4](scrum-s4.md) | Pago | 8 | ⬜ Pending |
| [S5](scrum-s5.md) | Dashboard + Cleanup | 5 | ⬜ Pending |

## Decisiones de Arquitectura

| Decisión | Justificación |
|----------|--------------|
| Login obligatorio para checkout | UX friendly con formularios inline para no perder ventas |
| Sesión checkout en cookie encriptada (no DB) | Stateless, limpia automáticamente en 1h |
| País → envío → pago (cascading filters) | Cada paso filtra las opciones del siguiente |
| `shipping_payment_rules` liga envío ↔ gateways | Flexible: el admin define qué gateways acepta cada método |
| Pickup no requiere dirección | `requiresAddress: false` + `pickupConfig` con info de retiro |
| `payment_types` eliminado | Reemplazado completamente por sistema de gateways |
