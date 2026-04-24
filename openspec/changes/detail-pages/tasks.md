# Tasks: detail-pages — Detail Pages for News, Events, and Products

## Phase 1: GraphQL Query

- [ ] **1** — `cfs/client/src/graphql/queries.ts`  
  Add `PRODUCT_QUERY` GraphQL query string export. Query should fetch: id, name, description, price, stock, limitedStock, imageUrl, and nested options with id, name, required, values (id, value, stock).

- [ ] **2** — `cfs/client/src/graphql/queries.ts`  
  Add `useProductQuery(id: string)` hook function that wraps `useQuery` with `PRODUCT_QUERY` and variables `{ id }`.

---

## Phase 2: New Page Components

- [ ] **3** — `cfs/client/src/pages/NewsDetail.tsx`  
  Create `NewsDetail` page component:  
  - Use `useParams` to get `id` from URL  
  - Use `useNewsItemQuery(id!)` hook to fetch news data  
  - Render: back button (navigates -1), `<h1>` title, full-width image (if `imageUrl` exists), content (preserve line breaks via `white-space: pre-wrap`), date formatted as "25 de abril de 2026" via `toLocaleDateString('es-ES')`  
  - Loading state: centered spinner `⏳` + "Cargando..."  
  - Error/404 state: "Noticia no encontrada" or "Esta noticia no existe" + back button  
  - Layout: max-width 800px container, `theme.spacing.xl` horizontal padding  
  - Detect `?from=admin` via `useSearchParams` and show "Modo Admin" badge

- [ ] **4** — `cfs/client/src/pages/EventDetail.tsx`  
  Create `EventDetail` page component:  
  - Use `useParams` to get `id` from URL  
  - Use `useEventQuery(id!)` hook to fetch event data  
  - Render: back button, `<h1>` name, location with "📍" prefix, datetime range (e.g., "25 de abril de 2026, 18:00 - 21:00"), description (only if exists)  
  - Loading state: centered spinner `⏳` + "Cargando..."  
  - Error state: "Evento no encontrado" + back button  
  - Same max-width 800px container and padding/margins as NewsDetail  
  - Detect `?from=admin` and show "Modo Admin" badge

- [ ] **5** — `cfs/client/src/pages/ProductDetail.tsx`  
  Create `ProductDetail` page component:  
  - Use `useParams` to get `id` from URL  
  - Use `useProductQuery(id!)` hook to fetch product data  
  - Render: back button, `<h1>` name, full-width image (if `imageUrl` exists), price (large, accent color, formatted as "29.90€"), stock status badge (green "En stock" | red "Sin stock" | gray "Stock infinito"), options badges (each option shows name + value chips), description  
  - Stock logic: `limitedStock === false` → "Stock infinito" (gray), `stock === 0` → "Sin stock" (red), otherwise → "En stock" (green)  
  - Options render as rows: option name label + flex container of value badges styled with `theme.colors.surface`, `theme.borderRadius.sm`  
  - Loading state: centered spinner `⏳` + "Cargando..."  
  - Error state: "Producto no encontrado" + back button  
  - Detect `?from=admin` and show "Modo Admin" badge

---

## Phase 3: Routes (App.tsx)

- [ ] **6** — `cfs/client/src/App.tsx`  
  Add import statements for `NewsDetail`, `EventDetail`, `ProductDetail` page components.

- [ ] **7** — `cfs/client/src/App.tsx`  
  Add route `<Route path="/news/:id" element={<NewsDetail />} />` after `/verification` route.

- [ ] **8** — `cfs/client/src/App.tsx`  
  Add route `<Route path="/events/:id" element={<EventDetail />} />` after `/news/:id` route.

- [ ] **9** — `cfs/client/src/App.tsx`  
  Add route `<Route path="/products/:id" element={<ProductDetail />} />` after `/events/:id` route.

---

## Phase 4: Landing Navigation

- [ ] **10** — `cfs/client/src/pages/Landing.tsx`  
  Wire up `NewsCard` onClick: change `<NewsCard key={item.id} news={item} />` to `<NewsCard key={item.id} news={item} onClick={() => navigate(`/news/${item.id}`)} />`.

- [ ] **11** — `cfs/client/src/pages/Landing.tsx`  
  Add `onClick` to event cards: add `onClick={() => navigate(`/events/${event.id}`)}` and `cursor: pointer` style to the existing `<div key={event.id} ...>` wrapper around event cards.

- [ ] **12** — `cfs/client/src/pages/Landing.tsx`  
  Change product preview card onClick: find `onClick={() => navigate('/catalog')}` around line 215 and change to `onClick={() => navigate(`/products/${product.id}`)}`.

---

## Phase 5: Admin Navigation

- [x] **13** — `cfs/client/src/pages/admin/NewsPage.tsx`  
  Make table rows clickable: change `<tr key={item.id} ...>` to `<tr key={item.id} onClick={() => navigate(`/news/${item.id}?from=admin`)} style={{ cursor: 'pointer' }}>`.

- [x] **14** — `cfs/client/src/pages/admin/EventsPage.tsx`  
  Make table rows clickable: add `onClick={() => navigate(`/events/${event.id}?from=admin`)}` and `style={{ cursor: 'pointer' }}` to `<tr>` elements.

- [x] **15** — `cfs/client/src/pages/admin/ProductsPage.tsx`  
  Make table rows clickable: add `onClick={() => navigate(`/products/${product.id}?from=admin`)}` and `style={{ cursor: 'pointer' }}` to `<tr>` elements.

---

## Phase 6: Tests

- [x] **16** — `cfs/client/src/__tests__/pages/NewsDetail.test.tsx`  
  Add tests for NewsDetail page: loading state, error state, not found state, content rendering (title, content, date), image rendering, back button presence.

- [x] **17** — `cfs/client/src/__tests__/pages/EventDetail.test.tsx`  
  Add tests for EventDetail page: loading state, error state, event details rendering (name, location, datetime range), datetime formatting, description handling, back button presence.

- [x] **18** — `cfs/client/src/__tests__/pages/ProductDetail.test.tsx`  
  Add tests for ProductDetail page: loading state, error state, product details (name, price, description), stock badges (en stock, sin stock, stock infinito), options as badges, options not rendered when empty, back button presence.

---

## Summary

| Phase | Tasks |
|-------|-------|
| Phase 1: GraphQL Query | 1–2 |
| Phase 2: Page Components | 3–5 |
| Phase 3: Routes | 6–9 |
| Phase 4: Landing Navigation | 10–12 |
| Phase 5: Admin Navigation | 13–15 |
| Phase 6: Tests | 16–18 |

**Total: 18 tasks**