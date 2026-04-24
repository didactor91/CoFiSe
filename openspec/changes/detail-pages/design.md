# Design: detail-pages — Detail Pages for News, Events, and Products

## Technical Approach

Three new public detail pages (`/news/:id`, `/events/:id`, `/products/:id`) implemented as stateless components that read URL params and fetch data via existing GraphQL queries. Navigation wired from Landing page cards and admin table rows.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component structure | Stateless, URL params via `useParams()` | Follows existing patterns; data fetching via `useQuery` hooks |
| Layout container | Max-width 800px, centered, `theme.spacing.xl` horizontal padding | Consistent with spec requirements |
| Error handling | Inline error state with back button | Simple, matches existing patterns |
| Admin mode detection | `useSearchParams()` to detect `?from=admin` | Lightweight approach, no auth changes needed |

## Data Flow

```
User clicks card/row
        │
        ▼
navigate(`/news/${id}`) or navigate(`/events/${id}`) or navigate(`/products/${id}`)
        │
        ▼
DetailPage useParams() extracts :id
        │
        ▼
useNewsItemQuery(id) / useEventQuery(id) / useProductQuery(id)
        │
        ▼
urql fetches GraphQL → returns data to component
        │
        ▼
Render: loading spinner | error | content
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/client/src/pages/NewsDetail.tsx` | Create | News detail page |
| `cfs/client/src/pages/EventDetail.tsx` | Create | Event detail page |
| `cfs/client/src/pages/ProductDetail.tsx` | Create | Product detail page |
| `cfs/client/src/graphql/queries.ts` | Modify | Add `PRODUCT_QUERY` + `useProductQuery` hook |
| `cfs/client/src/App.tsx` | Modify | Add imports + 3 routes |
| `cfs/client/src/pages/Landing.tsx` | Modify | Wire NewsCard onClick, event div onClick, product onClick |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Modify | Add onClick + cursor to `<tr>` |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Modify | Add onClick + cursor to `<tr>` |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Modify | Add onClick + cursor to `<tr>` |

## Interfaces / Contracts

### NewsDetail.tsx
```typescript
// Props: none (reads id from URL via useParams)
const { id } = useParams<{ id: string }>()
const [result] = useNewsItemQuery(id!)
// States: fetching → data | error
// Layout: Back button → h1 → img (conditional) → content (white-space: pre-wrap) → date footer
```

### EventDetail.tsx
```typescript
const { id } = useParams<{ id: string }>()
const [result] = useEventQuery(id!)
// Layout: Back button → h1 → 📍 location → 🗓 start-end datetime → description (conditional)
```

### ProductDetail.tsx
```typescript
const { id } = useParams<{ id: string }>()
const [result] = useProductQuery(id!)  // NEW hook
// Layout: Back button → h1 → img (conditional) → price (large, €) → stock badge → options badges → description
// Stock badge: green "En stock" | red "Sin stock" | gray "Stock infinito"
```

### New Query (queries.ts)
```typescript
export const PRODUCT_QUERY = `
  query Product($id: ID!) {
    product(id: $id) {
      id, name, description, price, stock, limitedStock, imageUrl,
      options { id, name, required, values { id, value, stock } }
    }
  }
`

export function useProductQuery(id: string): UseQueryResponse<ProductQueryResult> {
  return useQuery<ProductQueryResult>({ query: PRODUCT_QUERY, variables: { id } })
}
```
Note: `ProductQueryResult` already exists in `generated-types.ts` (line 215-217).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Detail pages render correct data | Test with mocked urql results |
| Integration | Navigation flows from Landing/admin | Test click handlers call navigate |
| E2E | Full flow: click card → view detail → back | Playwright |

## Open Questions

- [ ] None — all decisions documented in spec

## Migration / Rollout

No migration required. New pages are additive; no existing data or behavior changes.
