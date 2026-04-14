# Sprint 2 — Cookie + Auth Gate ✅ COMPLETADO

**Objetivo**: Cookie de sesión checkout + página auth con login/register/profile inline  
**Story Points**: 8

| # | Tarea | SP | Estado |
|---|-------|----|--------|
| 2.1 | Crear `lib/actions/checkout-session.ts` — get/set/clear cookie AES-256-GCM | 2 | ✅ Done |
| 2.2 | Crear `lib/actions/checkout-auth.ts` — checkoutLoginAction, checkoutRegisterAction, completeProfileAction | 2 | ✅ Done |
| 2.3 | Crear `checkout-login.tsx` — formulario login inline con useActionState | 1 | ✅ Done |
| 2.4 | Crear `checkout-register.tsx` — registro con phone, docType, docNumber, nationality | 1 | ✅ Done |
| 2.5 | Crear `checkout-profile.tsx` — completar solo campos faltantes | 1 | ✅ Done |
| 2.6 | Reescribir `/checkout/page.tsx` — server component auth gate | 1 | ✅ Done |
| 2.7 | Verificar `tsc --noEmit` clean | 0 | ✅ Done |

**Archivos creados**: `lib/actions/checkout-session.ts`, `lib/actions/checkout-auth.ts`, `checkout-login.tsx`, `checkout-register.tsx`, `checkout-profile.tsx`  
**Archivos modificados**: `app/(public)/checkout/page.tsx`
