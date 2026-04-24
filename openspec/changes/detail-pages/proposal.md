# Proposal: detail-pages

## Intent

Create reusable detail pages for News, Events, and Products accessible from both the public landing page and the admin panel. Each entity gets a dedicated route (`/news/:id`, `/events/:id`, `/products/:id`) with a clean display layout. This closes the navigation gap between list views and individual item views.

## Scope

### In Scope
- `NewsDetail` page at `/news/:id` — displays full news item
- `EventDetail` page at `/events/:id` — displays full event details
- `ProductDetail` page at `/products/:id` — displays full product with options
- `PRODUCT_QUERY` and `useProductQuery` hook in `queries.ts`
- Routes in `App.tsx` for all three detail pages
- Wire up Landing navigation (NewsCard onClick, Event/Product card clicks)
- Wire up admin page navigation (table rows → detail page, "Edit" returns to list)

### Out of Scope
- Admin-specific detail pages with edit functionality
- Modifying Catalog page behavior
- Authentication on detail pages (they read public data)

## Capabilities

### New Capabilities
- `news-detail-page`: Public news item detail view at `/news/:id`
- `event-detail-page`: Public event detail view at `/events/:id`
- `product-detail-page`: Public product detail view at `/products/:id`
- `product-item-query`: GraphQL query + hook to fetch single product by id

### Modified Capabilities
- None (this is pure additive work)

## Approach

### Architecture
- Each detail page is a standalone route component
- Uses existing single-item GraphQL queries (`useNewsItemQuery`, `useEventQuery`, `new `useProductQuery`)
- Loading/error states handled inline with consistent visual style from `theme.ts`

### Query Hooks
| Hook | Status | Notes |
|------|--------|-------|
| `useNewsItemQuery(id)` | EXISTS | Returns `UseQueryResponse<NewsItemQueryResult>` |
| `useEventQuery(id)` | EXISTS | Untyped return, use `EventQueryResult` |
| `useProductQuery(id)` | MISSING | Must create `PRODUCT_QUERY` + hook |

### Component Structure
```
pages/
├── NewsDetail.tsx      # /news/:id
├── EventDetail.tsx     # /events/:id
└── ProductDetail.tsx    # /products/:id
```

### Navigation Pattern
- **Landing → Detail**: NewsCard gets onClick prop to navigate, Event cards wrapped in clickable div, Product preview cards wrapped in clickable div
- **Admin → Detail**: Table rows in NewsPage/EventsPage/ProductsPage become clickable, navigate to detail page. Admin detail pages show "Back to list" button and "Edit" button that opens the existing inline form

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/client/src/graphql/queries.ts` | Modified | Add `PRODUCT_QUERY` and `useProductQuery` hook |
| `cfs/client/src/pages/NewsDetail.tsx` | New | News detail page component |
| `cfs/client/src/pages/EventDetail.tsx` | New | Event detail page component |
| `cfs/client/src/pages/ProductDetail.tsx` | New | Product detail page component |
| `cfs/client/src/pages/Landing.tsx` | Modified | Wire up clickable navigation |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Modified | Make table rows clickable |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Modified | Make table rows clickable |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Modified | Make table rows clickable |
| `cfs/client/src/App.tsx` | Modified | Add 3 new routes |
| `cfs/client/src/components/NewsCard.tsx` | Modified | Add onClick navigation prop |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing NewsCard behavior | Low | Make onClick optional prop with fallback |
| useEventQuery not typed | Low | Use existing `EventQueryResult` type |
| Admin → Detail page has no "Edit" return path | Medium | "Edit" button closes inline form and returns to list state |

## Rollback Plan

1. Remove 3 new routes from `App.tsx`
2. Delete `NewsDetail.tsx`, `EventDetail.tsx`, `ProductDetail.tsx`
3. Revert `Landing.tsx` to remove click handlers
4. Revert admin pages to remove row click handlers
5. Remove `PRODUCT_QUERY` and `useProductQuery` from `queries.ts`
6. Revert `NewsCard.tsx` if onClick prop was added

## Dependencies

- `NewsCard.tsx` must accept optional `onClick` prop (or use wrapper div approach)
- `useEventQuery` return type should be typed as `UseQueryResponse<EventQueryResult>`

## Success Criteria

- [ ] `/news/:id` renders full news item for valid id
- [ ] `/events/:id` renders full event details for valid id  
- [ ] `/products/:id` renders product with options for valid id
- [ ] Clicking news on Landing navigates to detail page
- [ ] Clicking event card on Landing navigates to detail page
- [ ] Clicking product preview on Landing navigates to detail page
- [ ] Clicking row in admin news list navigates to `/news/:id`
- [ ] Clicking row in admin events list navigates to `/events/:id`
- [ ] Clicking row in admin products list navigates to `/products/:id`
- [ ] Admin detail pages show "Back to list" button
- [ ] "Edit" button on admin detail pages reopens the inline form