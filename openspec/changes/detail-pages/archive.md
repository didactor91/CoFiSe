# Archive: detail-pages — Detail Pages for News, Events, and Products

**Change**: detail-pages  
**Archived**: 2026-04-24  
**Status**: ✅ COMPLETE (VERIFIED)  
**Project**: seno-com

---

## Summary

Created 3 detail pages accessible from Landing and Admin:
- `/news/:id` → NewsDetail
- `/events/:id` → EventDetail
- `/products/:id` → ProductDetail

Navigation wired from:
- Landing: NewsCard clicks, event card clicks, product card clicks
- Admin: NewsPage/EventsPage/ProductsPage table row clicks (with `?from=admin`)

GraphQL additions:
- `PRODUCT_QUERY` + `useProductQuery` hook in `queries.ts`

Tests: 21 tests (6 NewsDetail + 6 EventDetail + 9 ProductDetail)
Total tests: 214 passing
Build: Pass

---

## What Was Created

### 3 Detail Pages

| Page | Route | File |
|------|-------|------|
| NewsDetail | `/news/:id` | `client/src/pages/NewsDetail.tsx` |
| EventDetail | `/events/:id` | `client/src/pages/EventDetail.tsx` |
| ProductDetail | `/products/:id` | `client/src/pages/ProductDetail.tsx` |

### Features Per Page

**NewsDetail**:
- Loading state with ⏳ spinner
- Error/not-found states with "Volver" button
- Title in `<h1>`, full-width image (if exists), content text
- Date formatting: "24 de abril de 2026"
- Admin badge when `?from=admin`

**EventDetail**:
- Loading state with ⏳ spinner
- Error states with "Volver" button
- Event name in `<h1>`, location with 📍 emoji
- Datetime range in single line: "25 de abril de 2026, 18:00 - 21:00"
- Description (if exists)
- Admin badge when `?from=admin`

**ProductDetail**:
- Loading state with ⏳ spinner
- Error states with "Volver" button
- Product name in `<h1>`, image (if exists)
- Price formatted: "45.00€"
- Stock badge: "En stock" (green) / "Sin stock" (red) / "Stock infinito" (gray)
- Options rendered as badge chips
- Admin badge when `?from=admin`

### 21 Tests (Integration)

| File | Tests | Coverage |
|------|-------|----------|
| `NewsDetail.test.tsx` | 6 | loading, error, not-found, content, image, date |
| `EventDetail.test.tsx` | 6 | loading, error (x2), name, location, datetime, description |
| `ProductDetail.test.tsx` | 9 | loading, error (x2), name, price, stock badges (3), options (2) |

---

## Navigation Wiring

### From Landing (`/`)
- `Landing.tsx` line 61: NewsCard `onClick` → `/news/:id`
- `Landing.tsx` line 104: Event card `onClick` → `/events/:id`
- `Landing.tsx` line 217: Product card `onClick` → `/products/:id`

### From Admin Pages
- `NewsPage.tsx` line 313: Table row `onClick` → `/news/:id?from=admin`
- `EventsPage.tsx` line 392: Table row `onClick` → `/events/:id?from=admin`
- `ProductsPage.tsx` line 732: Table row `onClick` → `/products/:id?from=admin`

---

## Files Created

```
client/src/pages/NewsDetail.tsx
client/src/pages/EventDetail.tsx
client/src/pages/ProductDetail.tsx
client/src/__tests__/pages/NewsDetail.test.tsx
client/src/__tests__/pages/EventDetail.test.tsx
client/src/__tests__/pages/ProductDetail.test.tsx
```

---

## Files Modified

```
client/src/graphql/queries.ts          (PRODUCT_QUERY + useProductQuery hook)
client/src/App.tsx                      (3 new routes: lines 43-45)
client/src/pages/Landing.tsx            (news/event/product click handlers)
client/src/pages/admin/NewsPage.tsx     (row click navigation)
client/src/pages/admin/EventsPage.tsx   (row click navigation)
client/src/pages/admin/ProductsPage.tsx (row click navigation)
```

---

## Verification Results

| Metric | Value |
|--------|-------|
| Tasks total | 18 |
| Tasks complete | 18 |
| Build | ✅ Passed |
| Tests | 214 passed / 0 failed / 0 skipped |
| TDD Compliance | 6/6 checks passed |
| Spec Compliance | 32/32 scenarios compliant |

### TDD Compliance
- RED confirmed: 3 test files exist before implementation
- GREEN confirmed: All 214 tests pass on execution
- Triangulation adequate: ProductDetail has 3 stock states + 2 options states
- Safety net: 193 pre-existing tests still pass

### Compliance Highlights
- All 3 detail pages implemented with loading/error/content states
- Routes registered in App.tsx
- Navigation fully wired from Landing and Admin
- `PRODUCT_QUERY` + `useProductQuery` hook defined
- Theme integration: all pages use theme spacing/colors
- Max-width 800px layout per spec Section 3.2
- Admin mode badge on all 3 pages

---

## Phase History

| Phase | Status | Notes |
|-------|--------|-------|
| Explore | ✅ Done | - |
| Proposal | ✅ Done | - |
| Spec | ✅ Done | 420 lines, 10 scenarios, 8 edge cases |
| Design | ✅ Done | Technical decisions documented |
| Tasks | ✅ Done | 18/18 tasks |
| Apply | ✅ Done | Implementation + 21 tests |
| Verify | ✅ PASS | 214 tests, build succeeds |

---

## Key Technical Decisions

1. **Stateless components + URL params**: All three pages use `useParams()` for clean URL-based routing
2. **`?from=admin` badge approach**: Detected via `URLSearchParams` on all detail pages
3. **Wrapped query returns `UseQueryResponse`**: `useProductQuery` follows same pattern as `useNewsItemQuery`
4. **Option badges layout**: Each option renders as a row with label + flex gap for value badges
5. **Stock status logic**: `limitedStock === false` → gray, `stock === 0` → red, else green

---

## Artifacts Location

All change artifacts stored in: `openspec/changes/detail-pages/`

| Artifact | Path |
|----------|------|
| Proposal | `openspec/changes/detail-pages/proposal.md` |
| Spec | `openspec/changes/detail-pages/spec.md` |
| Design | `openspec/changes/detail-pages/design.md` |
| Tasks | `openspec/changes/detail-pages/tasks.md` |
| Verify Report | `openspec/changes/detail-pages/verify-report.md` |
| **This Archive** | `openspec/changes/detail-pages/archive.md` |

---

*Archived by SDD Archive phase — 2026-04-24*
