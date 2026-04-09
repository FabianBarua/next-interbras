# FRONT — Plan: Interbras Frontend Completo

## TL;DR
Construir toda la interfaz visual del sitio e-commerce Interbras sobre el proyecto Next.js 16 existente (que ya tiene auth, dashboard admin, 45+ componentes shadcn, esquema DB, y 153 imágenes de productos). Se crearán tipos TS, mock data, servicios fake, store de estado, layout público (header/footer), y todas las páginas del sitio. Solo frontend — sin backend real.

## Estado Actual del Proyecto
- **Framework**: Next.js 16.1.7, React 19, Tailwind 4 (OKLch), shadcn/ui
- **Auth**: Completo (login, register, forgot/reset password, middleware, dashboard admin)
- **DB Schema**: 16 tablas Drizzle (users, products, categories, variants, product-images, external-codes, promotions, etc.)
- **Assets**: 153 imágenes de productos en 17 categorías, 47 hero PNGs, 16 SVG icons de categorías, videos MP4
- **Tema**: Verde Interbras como primary, dark mode funcional, radius 14px
- **i18n**: next-intl instalado pero NO configurado
- **Estado (store)**: No existe
- **Mock data**: No existe
- **Páginas públicas**: No existen (solo placeholder "Project ready!")

---

## Fase 1: Fundación (types, mocks, services, store)

### 1.1 Tipos TypeScript — `types/`
Crear tipos para todos los modelos del frontend basados en el schema DB existente:
- `types/product.ts` — Product, Variant, ProductImage, ExternalCEC (precio/stock)
- `types/category.ts` — Category
- `types/cart.ts` — CartItem, Cart
- `types/wishlist.ts` — WishlistItem
- `types/order.ts` — Order, OrderItem, OrderStatus
- `types/user.ts` — UserProfile, Address
- `types/banner.ts` — Banner, HeroBanner
- `types/brand.ts` — Brand
- `types/download.ts` — DownloadFile, DownloadCategory
- `types/store-location.ts` — StoreLocation
- `types/common.ts` — I18nText, I18nRichText, I18nSpecs (reexport de schema), Locale, SiteConfig

Respetar la estructura i18n del schema (jsonb con `{es: "", pt: ""}`). Stock/precio vienen de externalCEC, NO de variants.

### 1.2 Mock Data — `mock/`
- `mock/products.ts` — ~30 productos usando las imágenes reales de `/public/productos/` (TVs, scooters, airfryer, hoverboards, etc.)
- `mock/categories.ts` — 17 categorías con slugs, nombres i18n, iconos SVG de `/public/newVersion/icons/`
- `mock/banners.ts` — 5-6 banners hero usando `/public/newVersion/hero/*.png` y assets
- `mock/orders.ts` — 3-4 pedidos fake con estados variados
- `mock/user.ts` — Perfil fake, 2 direcciones
- `mock/cart.ts` — Carrito inicial (vacío + helper)
- `mock/wishlist.ts` — 2-3 items fake
- `mock/downloads.ts` — Manuales y fichas técnicas fake por categoría
- `mock/stores.ts` — 3-4 tiendas con coordenadas (Paraguay/Brasil)
- `mock/brands.ts` — Marca Interbras + auxiliares
- `mock/site-config.ts` — Config general del sitio (contacto, redes sociales, etc.)

### 1.3 Servicios Fake — `services/`
Funciones async que devuelven mock data (simulan futura API):
- `services/products.ts` — `getProducts()`, `getProductBySlug()`, `getProductsByCategory()`, `getFeaturedProducts()`, `getNewProducts()`
- `services/categories.ts` — `getCategories()`, `getCategoryBySlug()`
- `services/orders.ts` — `getOrders()`, `getOrderById()`
- `services/downloads.ts` — `getDownloads()`, `getDownloadsByCategory()`
- `services/stores.ts` — `getStores()`
- `services/cart.ts` — `getCart()`, helpers
- `services/wishlist.ts` — `getWishlist()`
- `services/user.ts` — `getUserProfile()`, `getAddresses()`

### 1.4 Store de Estado — `store/`
Usar Zustand (instalar como dependencia):
- `store/cart-store.ts` — addItem, removeItem, updateQuantity, clear, total
- `store/wishlist-store.ts` — addItem, removeItem, toggle
- `store/locale-store.ts` — locale actual (es/pt), toggle
- `store/providers.tsx` — Provider wrapper (hydration boundary para SSR)

---

## Fase 2: Layout Público (header, footer, shell)

### 2.1 Layout Público — `app/(public)/layout.tsx`
Crear route group `(public)` para todas las páginas del sitio (separado de `(auth)` y `dashboard`):
- Renderiza Header + main + Footer
- Wrappea con store providers

### 2.2 Header — `components/store/header.tsx`
- Logo Interbras (link a home)
- Menú principal con mega-menu de categorías (Productos dropdown con las 17 categorías)
- Items: Inicio, Productos (dropdown), Downloads, Quiénes somos, Dónde estamos
- Selector de idioma (ES/PT) — visual, usa locale store
- Toggle light/dark (ya existe en theme-provider, exponer botón)
- Botón login / avatar usuario
- Botón carrito con badge de cantidad
- Mobile: hamburger menu con drawer/sheet
- Sticky header, backdrop blur

### 2.3 Footer — `components/store/footer.tsx`
- Logo + descripción breve
- Columnas: Productos, Institucional, Soporte, Contacto
- Redes sociales
- Newsletter input (visual, sin lógica)
- Copyright + links legales
- Responsive (columns → stack en mobile)

### 2.4 Componentes Store Compartidos — `components/store/`
- `product-card.tsx` — Card con imagen, nombre, precio, badge promo, botón wishlist, link a detalle
- `category-card.tsx` — Card con icono SVG + nombre
- `price-display.tsx` — Muestra precio con formato, old price tachado, badge descuento
- `add-to-cart-button.tsx` — Botón con lógica de store
- `wishlist-button.tsx` — Toggle heart
- `quantity-selector.tsx` — +/- input
- `breadcrumbs.tsx` — Migajas de pan reutilizable
- `section-header.tsx` — Título de sección con "Ver todos" link
- `product-carousel.tsx` — Carousel de product-cards (usar embla/carousel de shadcn)
- `newsletter-section.tsx` — Sección newsletter
- `language-switcher.tsx` — Selector ES/PT

---

## Fase 3: Páginas Principales

### 3.1 Home — `app/(public)/page.tsx`
- Hero banner carousel (imágenes de `/public/newVersion/hero/`)
- Sección categorías destacadas (carousel de category-cards con iconos SVG)
- Productos destacados (grid/carousel de product-cards)
- Banner promocional (imagen + CTA)
- Nuevos productos
- Sección TVs (con video TvsSection.mp4)
- Sección scooters/patinetas (con assets SVG)
- Sección airfryer (con medalla)
- Newsletter
- Sección "Por qué elegir Interbras" (features/trust badges)

### 3.2 Productos (listado) — `app/(public)/productos/page.tsx`
- Grid de productos con filtros laterales (categoría, precio, ordenar)
- Paginación visual
- Vista grid/lista toggle
- Breadcrumbs

### 3.3 Categoría — `app/(public)/productos/[category]/page.tsx`
- Header de categoría (nombre, descripción, imagen)
- Grid de productos de la categoría
- Filtros y ordenamiento
- Breadcrumbs

### 3.4 Detalle Producto — `app/(public)/productos/[category]/[slug]/page.tsx`
- Galería de imágenes (thumbnails + imagen principal, zoom)
- Nombre, descripción
- Selector de variantes (colores, tamaños según options)
- Precio desde externalCEC (precio actual, precio anterior tachado)
- Stock indicator
- Botón agregar al carrito
- Botón wishlist
- Tabs: Descripción, Especificaciones, Reseña, Incluido
- Productos relacionados (carousel)
- Breadcrumbs

### 3.5 Quiénes Somos — `app/(public)/quienes-somos/page.tsx`
- Hero institucional
- Historia de la marca
- Valores/misión
- Estadísticas (países, productos, años)
- Galería/imágenes

### 3.6 Downloads — `app/(public)/downloads/page.tsx`
- Buscador de documentos
- Filtros por categoría de producto
- Lista/grid de archivos descargables (manuales, fichas técnicas)
- Iconos por tipo de archivo

### 3.7 Dónde Estamos — `app/(public)/donde-estamos/page.tsx`
- Lista de tiendas con dirección, teléfono, horario
- Mapa visual (imagen placeholder o embed estático)
- Cards de tiendas

### 3.8 Página 404 — `app/not-found.tsx`
- Diseño branded con ilustración
- Botón volver al inicio
- Links útiles

---

## Fase 4: Páginas de Usuario y E-commerce

### 4.1 Carrito — `app/(public)/carrito/page.tsx`
- Tabla/lista de items en el carrito
- Imagen, nombre, variante, precio unitario, cantidad editable, subtotal
- Botón eliminar por item
- Resumen: subtotal, envío (placeholder), total
- Botón "Ir al checkout"
- Estado vacío con CTA a productos
- **También**: Drawer/sidebar de carrito rápido (`components/store/cart-drawer.tsx`) accesible desde header

### 4.2 Checkout — `app/(public)/checkout/page.tsx`
- Stepper visual (Datos → Envío → Pago → Confirmación)
- Formulario de datos personales
- Selección de dirección
- Método de envío (placeholder)
- Método de pago (placeholder visual)
- Resumen del pedido
- Todo visual, sin lógica real

### 4.3 Mi Cuenta — `app/(public)/cuenta/page.tsx`
Layout con sidebar de navegación para sub-páginas:
- **Perfil** (`cuenta/page.tsx`) — Datos del usuario, editar nombre/email/teléfono (visual)
- **Direcciones** (`cuenta/direcciones/page.tsx`) — CRUD visual de direcciones
- **Pedidos** (`cuenta/pedidos/page.tsx`) — Tabla de pedidos con estados, link a detalle
- **Detalle Pedido** (`cuenta/pedidos/[id]/page.tsx`) — Items, seguimiento, estado
- **Wishlist** (`cuenta/wishlist/page.tsx`) — Grid de productos guardados, botón agregar al carrito

---

## Fase 5: Pulido y Responsive

### 5.1 Responsive
- Verificar todas las páginas en mobile (< 768px)
- Header mobile con drawer navigation
- Product grid 1-2 cols en mobile, 3-4 en desktop
- Carrito responsive
- Footer stack en mobile

### 5.2 Animaciones y UX
- Transiciones suaves entre páginas (ya con Next.js)
- Hover effects en cards
- Loading skeletons donde corresponda
- Empty states con ilustraciones/mensajes

### 5.3 Paleta Verde Interbras
La paleta personalizada del todo.md ya está mapeada al primary en globals.css (OKLch). Verificar que se usa consistentemente. Agregar las variantes de la paleta (`interbrasGreen.50-950`) como CSS custom properties si se necesitan fuera del primary.

---

## Archivos a Crear (nuevos)

### Tipos (~11 archivos)
- `types/product.ts`, `types/category.ts`, `types/cart.ts`, `types/wishlist.ts`, `types/order.ts`, `types/user.ts`, `types/banner.ts`, `types/brand.ts`, `types/download.ts`, `types/store-location.ts`, `types/common.ts`

### Mock Data (~11 archivos)
- `mock/products.ts`, `mock/categories.ts`, `mock/banners.ts`, `mock/orders.ts`, `mock/user.ts`, `mock/cart.ts`, `mock/wishlist.ts`, `mock/downloads.ts`, `mock/stores.ts`, `mock/brands.ts`, `mock/site-config.ts`

### Servicios (~8 archivos)
- `services/products.ts`, `services/categories.ts`, `services/orders.ts`, `services/downloads.ts`, `services/stores.ts`, `services/cart.ts`, `services/wishlist.ts`, `services/user.ts`

### Store (~4 archivos)
- `store/cart-store.ts`, `store/wishlist-store.ts`, `store/locale-store.ts`, `store/providers.tsx`

### Componentes Store (~15 archivos)
- `components/store/header.tsx`, `components/store/footer.tsx`, `components/store/mobile-menu.tsx`, `components/store/product-card.tsx`, `components/store/category-card.tsx`, `components/store/price-display.tsx`, `components/store/add-to-cart-button.tsx`, `components/store/wishlist-button.tsx`, `components/store/quantity-selector.tsx`, `components/store/breadcrumbs.tsx`, `components/store/section-header.tsx`, `components/store/product-carousel.tsx`, `components/store/newsletter-section.tsx`, `components/store/language-switcher.tsx`, `components/store/cart-drawer.tsx`

### Páginas (~15 archivos/carpetas)
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx` (Home)
- `app/(public)/productos/page.tsx`
- `app/(public)/productos/[category]/page.tsx`
- `app/(public)/productos/[category]/[slug]/page.tsx`
- `app/(public)/quienes-somos/page.tsx`
- `app/(public)/downloads/page.tsx`
- `app/(public)/donde-estamos/page.tsx`
- `app/(public)/carrito/page.tsx`
- `app/(public)/checkout/page.tsx`
- `app/(public)/cuenta/layout.tsx`
- `app/(public)/cuenta/page.tsx`
- `app/(public)/cuenta/direcciones/page.tsx`
- `app/(public)/cuenta/pedidos/page.tsx`
- `app/(public)/cuenta/pedidos/[id]/page.tsx`
- `app/(public)/cuenta/wishlist/page.tsx`
- `app/not-found.tsx`

---

## Archivos a Modificar (existentes)

- `app/layout.tsx` — Agregar StoreProviders wrapper
- `globals.css` — Agregar custom properties de la paleta interbrasGreen completa si se necesitan
- `middleware.ts` — Agregar rutas de `/cuenta/*` como protegidas (requieren auth)

---

## Verificación

1. `pnpm dev` — Verificar que compila sin errores
2. `pnpm typecheck` — Sin errores de tipos
3. `pnpm lint` — Sin errores de linting
4. Navegar todas las páginas manualmente: Home → Productos → Categoría → Producto → Carrito → Checkout → Cuenta → Downloads → Quiénes somos → Dónde estamos → 404
5. Verificar dark mode en todas las páginas (toggle)
6. Verificar responsive en viewport mobile (375px) y tablet (768px)
7. Verificar que imágenes de productos cargan correctamente desde `/public/productos/`
8. Verificar que los iconos SVG de categorías cargan desde `/public/newVersion/icons/`
9. Verificar cart drawer desde header
10. Verificar navegación mobile (hamburger menu)

---

## Decisiones

- **State management**: Zustand (instalar `zustand` como dependencia)
- **Routing**: Route group `(public)` separado de `(auth)` y `dashboard` existentes
- **i18n**: Solo visual — selector de idioma que cambia locale en store, los textos mock tendrán `{es: "...", pt: "..."}` y se mostrarán según locale seleccionado. No configurar next-intl routing completo.
- **Imágenes**: Usar las 153 imágenes reales existentes + Next Image optimization
- **La paleta interbrasGreen del todo.md**: Ya está mapeada como `--primary` en OKLch en globals.css. Se usará via las clases de Tailwind (`bg-primary`, `text-primary`, etc.)
- **Scope excluido**: Backend real, API calls reales, pagos, SEO, i18n routing, tests

## Consideraciones

1. **Embla Carousel**: El componente `carousel.tsx` de shadcn ya existe e internamente usa embla-carousel-react. ¿Se confirma usarlo para todos los carousels, o se prefiere otra librería?
2. **Galería de producto**: Para zoom de imagen se necesitaría una librería adicional o implementación custom con CSS transform. Recomendación: implementar zoom básico con CSS transform/scale al hover, sin librería extra.
3. **Mapa en "Dónde Estamos"**: Usar imagen estática placeholder. Integrar Google Maps o Leaflet queda fuera del scope actual.
