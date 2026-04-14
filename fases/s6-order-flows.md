# S6 — Order Flow System: Plan Scrum

> Sistema dinámico de estados y flujos de pedidos por combinación envío + pago.

---

## Sprint 6.1 — Base de Datos: Tablas + Migración

**Objetivo:** Crear las 3 tablas nuevas, migrar `orders.status` de pgEnum a varchar, agregar `flow_id`.

### Tareas

- [ ] **6.1.1** Agregar tabla `order_statuses` en `drizzle/schema.ts`
  - id (uuid PK), slug (varchar unique), name (jsonb i18n), description (jsonb i18n)
  - color (varchar), icon (varchar), is_final (boolean)
  - sort_order (int), active (boolean), created_at, updated_at

- [ ] **6.1.2** Agregar tabla `order_flows` en `drizzle/schema.ts`
  - id (uuid PK), name (jsonb i18n), description (jsonb i18n)
  - shipping_method_id (uuid FK → shipping_methods, nullable)
  - gateway_type (varchar, nullable)
  - is_default (boolean), active (boolean), created_at, updated_at
  - UNIQUE(shipping_method_id, gateway_type)

- [ ] **6.1.3** Agregar tabla `order_flow_steps` en `drizzle/schema.ts`
  - id (uuid PK), flow_id (uuid FK → order_flows CASCADE)
  - status_slug (varchar FK → order_statuses.slug)
  - step_order (int), auto_transition (boolean), notify_customer (boolean)
  - created_at
  - UNIQUE(flow_id, step_order), UNIQUE(flow_id, status_slug)

- [ ] **6.1.4** Agregar relaciones en `drizzle/relations.ts`

- [ ] **6.1.5** Migrar `orders.status` de pgEnum a varchar(50)
  - ALTER TABLE orders ALTER COLUMN status TYPE varchar(50)
  - DROP TYPE order_status (si no lo usan otras tablas)

- [ ] **6.1.6** Agregar columna `flow_id` (uuid FK nullable) a tabla `orders`

- [ ] **6.1.7** Generar migración drizzle (`pnpm drizzle-kit generate`)

- [ ] **6.1.8** Ejecutar migración (`pnpm drizzle-kit push` o SQL manual)

### Entregable
Las 3 tablas creadas en DB. `orders.status` es varchar. `orders.flow_id` existe. Migración aplicada sin errores.

---

## Sprint 6.2 — Seed de Estados y Flujos Preestablecidos

**Objetivo:** Poblar la DB con los 10 estados preset y los 6 flujos con sus pasos.

### Tareas

- [ ] **6.2.1** Crear script `scripts/seed-order-statuses.ts`
  - 10 estados: pending, awaiting-payment, confirmed, preparing, ready-for-pickup, shipped, in-transit, delivered, cancelled, refunded
  - Cada uno con: slug, name {es, pt}, color, icon, is_final, sort_order

- [ ] **6.2.2** Crear script `scripts/seed-order-flows.ts`
  - Flow 1: Retiro + Efectivo/Tarjeta local → `pending → confirmed → preparing → ready-for-pickup → delivered`
  - Flow 2: Retiro + Transferencia → `pending → awaiting-payment → confirmed → preparing → ready-for-pickup → delivered`
  - Flow 3: Retiro + PIX/Online card → `pending → confirmed → preparing → ready-for-pickup → delivered`
  - Flow 4: Envío + Transferencia → `pending → awaiting-payment → confirmed → preparing → shipped → in-transit → delivered`
  - Flow 5: Envío + PIX/Online card → `pending → confirmed → preparing → shipped → in-transit → delivered`
  - Flow 6: Default (is_default=true) → `pending → confirmed → preparing → shipped → delivered`
  - Marcar `auto_transition=true` en pasos automáticos (confirmed en flows con webhook/auto-confirm)
  - Marcar `notify_customer=true` en pasos clave (confirmed, shipped, delivered)

- [ ] **6.2.3** Ejecutar seeds y verificar datos en DB

### Entregable
10 registros en `order_statuses`. 6 registros en `order_flows`. ~30 registros en `order_flow_steps`. Todo verificado.

---

## Sprint 6.3 — Services + Actions CRUD (Estados)

**Objetivo:** CRUD backend para gestionar estados de pedido.

### Tareas

- [ ] **6.3.1** Crear `services/admin/order-statuses.ts`
  - getAllOrderStatuses(), getOrderStatusBySlug(slug), createOrderStatus(data), updateOrderStatus(slug, data), deleteOrderStatus(slug)

- [ ] **6.3.2** Crear `lib/actions/admin/order-statuses.ts`
  - Server actions: createOrderStatusAction, updateOrderStatusAction, deleteOrderStatusAction
  - Validación con zod (slug regex, name requerido, color válido)
  - Proteger con requireAdmin()

- [ ] **6.3.3** Crear `lib/order-status-helpers.ts`
  - getStatusLabel(slug, locale): string
  - getStatusColor(slug): string
  - getStatusIcon(slug): string
  - getAllStatusesMap(): Map (cached)
  - Usar cachedQuery para evitar consultas repetidas

- [ ] **6.3.4** Crear tipo `types/order-flow.ts`
  - OrderStatusRecord, OrderFlow, OrderFlowStep interfaces

### Entregable
CRUD funcional de estados. Helpers cacheados para label/color/icon. Tipos TypeScript definidos.

---

## Sprint 6.4 — Services + Actions CRUD (Flujos)

**Objetivo:** CRUD backend para gestionar flujos y sus pasos.

### Tareas

- [ ] **6.4.1** Crear `services/admin/order-flows.ts`
  - getAllOrderFlows(), getOrderFlowById(id), createOrderFlow(data), updateOrderFlow(id, data), deleteOrderFlow(id)
  - getFlowSteps(flowId): OrderFlowStep[]
  - setFlowSteps(flowId, steps[]): void (replace all steps)

- [ ] **6.4.2** Crear `lib/actions/admin/order-flows.ts`
  - Server actions: createOrderFlowAction, updateOrderFlowAction, deleteOrderFlowAction, updateFlowStepsAction
  - Validar que steps referencien status_slug existentes
  - Proteger con requireAdmin()

- [ ] **6.4.3** Crear `lib/order-flow-resolver.ts`
  - resolveFlow(shippingMethodId, gatewayType): OrderFlow
    - Prioridad: exact match > shipping-only > gateway-only > default
  - getNextStatuses(orderId): string[] — estados válidos siguientes según flow
  - getFlowForOrder(orderId): OrderFlow | null — leer flow_id del pedido
  - isValidTransition(orderId, newStatus): boolean

### Entregable
CRUD de flujos funcional. Resolver que determina el flujo correcto por combinación envío+pago. Validación de transiciones.

---

## Sprint 6.5 — Integrar Flujos en Lógica de Pedidos

**Objetivo:** Conectar el sistema de flujos con la creación de pedidos, pagos y webhooks.

### Tareas

- [ ] **6.5.1** Actualizar `services/orders.ts` → `createOrder()`
  - Después de crear el pedido, resolver flow con resolveFlow(shippingMethodId, gatewayType)
  - Guardar flow_id en el pedido

- [ ] **6.5.2** Actualizar `lib/actions/create-payment.ts`
  - Reemplazar el check hardcodeado `manual-cash || manual-card` por consulta al flow
  - Leer el step actual, si `auto_transition=true` → avanzar al siguiente estado

- [ ] **6.5.3** Actualizar `lib/payments/process-webhook-event.ts`
  - En vez de hardcodear `→ CONFIRMED`, leer el flow del pedido y avanzar al siguiente estado

- [ ] **6.5.4** Actualizar `lib/actions/orders.ts` → `updateOrderStatus()`
  - Validar que la transición sea válida según el flow (usar isValidTransition)
  - `runStatusSideEffects` lee `notify_customer` del step para decidir si enviar email

- [ ] **6.5.5** Actualizar `lib/actions/orders.ts` → `bulkUpdateOrderStatus()`
  - Validar cada pedido individualmente contra su flow

- [ ] **6.5.6** Actualizar `types/order.ts`
  - OrderStatus pasa de union type a string
  - Agregar flowId opcional al tipo Order

### Entregable
Pedidos nuevos reciben flow_id. Pagos automáticos avanzan según flow. Webhooks avanzan según flow. Admin solo puede mover a estados válidos.

---

## Sprint 6.6 — Dashboard: CRUD de Estados

**Objetivo:** Páginas admin para gestionar estados de pedido.

### Tareas

- [ ] **6.6.1** Crear `app/dashboard/order-statuses/page.tsx` — lista de estados
  - Tabla: slug, nombre ES, color (badge), icono, is_final, orden, activo
  - Botón "+ Nuevo estado"

- [ ] **6.6.2** Crear `app/dashboard/order-statuses/table.tsx` — tabla read-only

- [ ] **6.6.3** Crear `app/dashboard/order-statuses/new/page.tsx` + `client.tsx`
  - Formulario: slug, nameEs, namePt, description, color (selector), icon (selector), is_final, sort_order

- [ ] **6.6.4** Crear `app/dashboard/order-statuses/[slug]/page.tsx` + `client.tsx`
  - Editar estado existente + botón eliminar con confirmación
  - No permitir eliminar estados en uso por flows

### Entregable
CRUD completo de estados desde el dashboard. Páginas separadas para crear/editar (nunca CRUD inline).

---

## Sprint 6.7 — Dashboard: CRUD de Flujos

**Objetivo:** Páginas admin para gestionar flujos y sus pasos.

### Tareas

- [ ] **6.7.1** Crear `app/dashboard/order-flows/page.tsx` — lista de flujos
  - Tabla: nombre, envío asociado, gateway asociado, #pasos, default, activo
  - Botón "+ Nuevo flujo"

- [ ] **6.7.2** Crear `app/dashboard/order-flows/table.tsx` — tabla read-only

- [ ] **6.7.3** Crear `app/dashboard/order-flows/new/page.tsx` + `client.tsx`
  - Formulario: name {es, pt}, shipping_method (select), gateway_type (select), is_default

- [ ] **6.7.4** Crear `app/dashboard/order-flows/[id]/page.tsx` + `client.tsx`
  - Editar flujo + sección de **pasos** (step editor)
  - Lista ordenada de pasos: status (select), auto_transition (toggle), notify_customer (toggle)
  - Agregar/quitar pasos, reordenar con flechas arriba/abajo
  - Botón eliminar flujo con confirmación

### Entregable
CRUD completo de flujos. Editor visual de pasos por flujo. Páginas separadas.

---

## Sprint 6.8 — Dashboard: Actualizar Tabla de Pedidos

**Objetivo:** Los pedidos muestran estados dinámicos con colores/labels del DB.

### Tareas

- [ ] **6.8.1** Actualizar `components/dashboard/orders-table.tsx`
  - Reemplazar STATUS_LABELS y STATUS_COLORS hardcodeados
  - Usar getStatusLabel() y getStatusColor() de order-status-helpers
  - Pasar statuses como prop desde page.tsx (server component)

- [ ] **6.8.2** Actualizar `app/dashboard/orders/[id]/order-actions.tsx`
  - Dropdown de cambio de estado muestra solo los estados válidos siguientes
  - Usar getNextStatuses(orderId) para obtener opciones
  - Agregar opción "Cancelar" siempre (excepto si ya es final)

- [ ] **6.8.3** Actualizar `app/dashboard/orders/[id]/page.tsx`
  - Badge de estado usa color dinámico del DB
  - Mostrar nombre del flujo asignado al pedido

### Entregable
Tabla de pedidos con estados dinámicos. Dropdown de estado con solo transiciones válidas. Colores y labels del DB.

---

## Sprint 6.9 — Customer-Facing: Tracker + Pedidos

**Objetivo:** El cliente ve el progreso de su pedido según el flujo específico de su orden.

### Tareas

- [ ] **6.9.1** Actualizar `components/store/order-tracker.tsx`
  - STAGES ya no es hardcodeado — se cargan desde el flow del pedido
  - Server component padre carga getFlowSteps(order.flowId) y pasa como prop
  - Renderizar pasos dinámicos con icons y colores del DB
  - "cancelled" sigue siendo caso especial (banner rojo)

- [ ] **6.9.2** Actualizar `app/(public)/cuenta/pedidos/[id]/page.tsx`
  - Cargar flow steps del pedido
  - Pasar a OrderTracker como prop
  - Status badge usa color dinámico

- [ ] **6.9.3** Actualizar `app/(public)/cuenta/pedidos/page.tsx`
  - Lista de pedidos usa getStatusLabel/getStatusColor para badges
  - Pasar statusMap como prop

- [ ] **6.9.4** Actualizar `app/(public)/tracking/[id]/page.tsx`
  - Mismo tratamiento: flow steps dinámicos + OrderTracker

### Entregable
El tracker muestra los pasos reales del flujo del pedido (ej: retiro muestra "Listo para retiro" en vez de "Enviado"). Colores y labels dinámicos en toda la cuenta del cliente.

---

## Sprint 6.10 — Cleanup + Verificación Final

**Objetivo:** Eliminar código hardcodeado obsoleto. Verificar que todo compile y funcione.

### Tareas

- [ ] **6.10.1** Eliminar constantes hardcodeadas
  - STATUS_LABELS, STATUS_COLORS, STATUSES de `orders-table.tsx`
  - ORDER_STATUSES de `lib/actions/orders.ts` (reemplazar por consulta a DB)
  - Hardcoded STAGES de `order-tracker.tsx`

- [ ] **6.10.2** Evaluar si `lib/actions/simulate-card-payment.ts` sigue siendo necesario
  - Si el auto-confirm por flow lo reemplaza → eliminar
  - Si no → actualizar para usar flow

- [ ] **6.10.3** Actualizar i18n dictionaries si es necesario
  - Agregar keys para nuevos estados en diccionarios es/pt

- [ ] **6.10.4** Ejecutar `tsc --noEmit` — cero errores

- [ ] **6.10.5** Test manual: crear pedido con cada combinación envío+pago
  - pickup + efectivo → flow 1
  - pickup + transferencia → flow 2
  - pickup + PIX → flow 3
  - delivery + transferencia → flow 4
  - delivery + PIX → flow 5
  - Verificar tracker del cliente para cada caso

- [ ] **6.10.6** Verificar pedidos existentes (sin flow_id) siguen mostrándose correctamente

### Entregable
Código limpio sin duplicados. `tsc` pasa. Todos los flows verificados manualmente. Pedidos viejos compatibles.

---

## Resumen de Sprints

| Sprint | Nombre | Tareas | Depende de |
|--------|--------|--------|------------|
| 6.1 | DB: Tablas + Migración | 8 | — |
| 6.2 | Seed: Estados + Flujos | 3 | 6.1 |
| 6.3 | Services: CRUD Estados | 4 | 6.1 |
| 6.4 | Services: CRUD Flujos | 3 | 6.1, 6.3 |
| 6.5 | Integrar Flujos en Pedidos | 6 | 6.2, 6.4 |
| 6.6 | Dashboard: CRUD Estados | 4 | 6.3 |
| 6.7 | Dashboard: CRUD Flujos | 4 | 6.4 |
| 6.8 | Dashboard: Tabla Pedidos | 3 | 6.5, 6.6 |
| 6.9 | Customer: Tracker + Pedidos | 4 | 6.5 |
| 6.10 | Cleanup + Verificación | 6 | 6.8, 6.9 |

**Total:** 10 sprints, 45 tareas.
