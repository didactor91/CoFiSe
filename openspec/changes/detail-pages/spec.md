# Spec: detail-pages — Detail Pages for News, Events, and Products

## Overview

This change adds dedicated detail pages for News, Events, and Products. Each entity gets a public route (`/news/:id`, `/events/:id`, `/products/:id`) with a clean display layout showing full item details. Navigation is wired from both the Landing page and admin list pages.

## Language

- Web UI text in Spanish
- Code/technical docs in English

---

## 1. Functional Requirements

### 1.1 NewsDetail Page (`/news/:id`)

**Route**: `/news/:id`

**Query**: `useNewsItemQuery(id)` → `NEWS_ITEM_QUERY`

**Data Displayed**:
| Field | Format | Notes |
|-------|--------|-------|
| Title | `<h1>` | Full title text |
| Image | Full-width img | Only if `imageUrl` exists |
| Content | Paragraphs | Preserve line breaks via CSS white-space or mapped paragraphs |
| Created date | "25 de abril de 2026" | `toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' })` |
| "Volver" button | Button | `navigate(-1)` |

**States**:
| State | Render |
|-------|--------|
| Loading | Centered spinner: `⏳` emoji + "Cargando..." text |
| Error | "Noticia no encontrada" + back button |
| Empty/404 | "Esta noticia no existe" + back button |

**Layout**: Max-width 800px container, `theme.spacing.xl` horizontal padding, sections separated by `theme.spacing.lg` margin.

### 1.2 EventDetail Page (`/events/:id`)

**Route**: `/events/:id`

**Query**: `useEventQuery(id)` → `EVENT_QUERY` (already exists untyped)

**Data Displayed**:
| Field | Format | Notes |
|-------|--------|-------|
| Name | `<h1>` | Full event name |
| Location | "📍 {location}" | Location prefix with pin emoji |
| Start/End datetime | "25 de abril de 2026, 18:00 - 21:00" | Single line, start date + both times |
| Description | Full text | Only if `description` exists |

**States**:
| State | Render |
|-------|--------|
| Loading | Centered spinner: `⏳` + "Cargando..." |
| Error | "Evento no encontrado" + back button |

**Layout**: Same max-width 800px container, same padding/margins.

### 1.3 ProductDetail Page (`/products/:id`)

**Route**: `/products/:id`

**Query**: `useProductQuery(id)` → `PRODUCT_QUERY` (NEW — must be defined)

**Data Displayed**:
| Field | Format | Notes |
|-------|--------|-------|
| Name | `<h1>` | Full product name |
| Image | Full-width img | Only if `imageUrl` exists |
| Price | "29.90€" | Large, accent color, formatted with 2 decimal places + € symbol |
| Description | Full text | Product description |
| Stock status | Text badge | "En stock" (green), "Sin stock" (red), "Stock infinito" (gray) |
| Options | Badge chips | If product has options, show each option's values as styled badges (e.g., "S" "M" "L" for Size option) |

**States**:
| State | Render |
|-------|--------|
| Loading | Centered spinner: `⏳` + "Cargando..." |
| Error | "Producto no encontrado" + back button |

**Stock Status Logic**:
- If `limitedStock === false` → "Stock infinito" (gray, `theme.colors.textSecondary`)
- If `stock === 0` → "Sin stock" (red, `theme.colors.error`)
- Otherwise → "En stock" (green, `theme.colors.success`)

**Options Display**:
- Each option renders as a row: `{optionName}:` label followed by value badges
- Badges styled with `theme.colors.surface`, `theme.borderRadius.sm`, `theme.spacing.xs` padding
- Multiple options show all with spacing between groups

---

## 2. Navigation Integration

### 2.1 From Landing (`/`)

#### News Cards
- `NewsCard` already has `onClick?: () => void` prop
- Wire each card: `onClick={() => navigate(`/news/${news.id}`)}`
- **File**: `cfs/client/src/pages/Landing.tsx`
- **Change**: `<NewsCard key={item.id} news={item} />` → `<NewsCard key={item.id} news={item} onClick={() => navigate(`/news/${item.id}`)} />`

#### Event Cards
- Event cards are `<div>` elements without onClick
- Wrap each card's content in a clickable element (inline style `cursor: pointer`)
- Add `onClick={() => navigate(`/events/${event.id}`)}` to the existing `<div key={event.id} ...>`
- **File**: `cfs/client/src/pages/Landing.tsx`
- **Change**: Add onClick to the existing `<div>` wrapper (line ~104)

#### Product Preview Cards
- Product preview cards already have `cursor: 'pointer'` and an `onClick` to `/catalog`
- Change to: `onClick={() => navigate(`/products/${product.id}`)}`
- **File**: `cfs/client/src/pages/Landing.tsx`
- **Change**: Line ~215 `onClick={() => navigate('/catalog')}` → `onClick={() => navigate(`/products/${product.id}`)}`

### 2.2 From Admin Pages

#### NewsPage (`/admin/news`)
- Table rows are currently plain `<tr>` elements
- Make entire row clickable: `cursor: pointer` on `<tr>`
- Click handler: `navigate(`/news/${item.id}?from=admin`)`
- **File**: `cfs/client/src/pages/admin/NewsPage.tsx`
- **Change**: `<tr key={item.id} ...>` → `<tr key={item.id} onClick={() => navigate(`/news/${item.id}?from=admin`)} style={{ cursor: 'pointer' }}>`

#### EventsPage (`/admin/events`)
- Same pattern: make table rows clickable with `cursor: pointer`
- Click handler: `navigate(`/events/${event.id}?from=admin`)`
- **File**: `cfs/client/src/pages/admin/EventsPage.tsx`
- **Change**: Add onClick + cursor style to `<tr>` elements

#### ProductsPage (`/admin/products`)
- Same pattern: make table rows clickable with `cursor: pointer`
- Click handler: `navigate(`/products/${product.id}?from=admin`)`
- **File**: `cfs/client/src/pages/admin/ProductsPage.tsx`
- **Change**: Add onClick + cursor style to `<tr>` elements

### 2.3 Admin Mode (`?from=admin`)

When a detail page is navigated to with `?from=admin` query param:
- Display a badge "Modo Admin" in the header area
- Add an "Editar" button that navigates back to the admin list AND triggers the edit state
- Simpler approach: detect `from=admin` and show a prominent "Modo Admin" badge and an "Editar" button that navigates to the admin page with the edit form pre-opened

For simplicity, the detail page shows:
- "Modo Admin" badge (styled with `theme.colors.warning` or accent background)
- "Volver" button that goes `navigate(-1)` (back to admin list)
- The admin list pages already have edit functionality inline

**Note**: The admin detail page does NOT have a dedicated edit form. The "Editar" button navigates back to the admin list with `?edit=id` or similar. For this phase, just show the badge and ensure "Volver" returns to admin.

---

## 3. Visual Design

### 3.1 Theme Integration

All detail pages MUST use `theme` object for all styling values:
- Colors: `theme.colors.background`, `theme.colors.surface`, `theme.colors.text`, `theme.colors.textSecondary`, `theme.colors.accent`, `theme.colors.border`, `theme.colors.success`, `theme.colors.error`
- Spacing: `theme.spacing.xs`, `theme.spacing.sm`, `theme.spacing.md`, `theme.spacing.lg`, `theme.spacing.xl`, `theme.spacing['2xl']`
- Typography: `theme.typography.fontSize`, `theme.typography.fontWeight`, `theme.typography.fontFamily`
- Border radius: `theme.borderRadius.sm`, `theme.borderRadius.md`

### 3.2 Layout Container

```tsx
<div style={{
  maxWidth: '800px',
  margin: '0 auto',
  padding: `0 ${theme.spacing.xl}`,
}}>
  {/* content */}
</div>
```

### 3.3 Loading State

```tsx
<div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
  <span style={{ fontSize: '2rem' }}>⏳</span>
  <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
</div>
```

### 3.4 Error State

```tsx
<div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
  <p style={{ color: theme.colors.error }}>{errorMessage}</p>
  <button
    onClick={() => navigate(-1)}
    style={{
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: theme.colors.accent,
      color: theme.colors.background,
      border: 'none',
      borderRadius: theme.borderRadius.sm,
      cursor: 'pointer',
    }}
  >
    Volver
  </button>
</div>
```

### 3.5 Image Display

```tsx
{imageUrl && (
  <img
    src={imageUrl}
    alt={title}
    style={{
      width: '100%',
      maxHeight: '400px',
      objectFit: 'cover',
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    }}
  />
)}
```

### 3.6 Option Badges

```tsx
{product.options && product.options.map((option) => (
  <div key={option.id} style={{ marginBottom: theme.spacing.sm }}>
    <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
      {option.name}:
    </span>
    <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
      {option.values.map((val) => (
        <span
          key={val.id}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text,
          }}
        >
          {val.value}
        </span>
      ))}
    </div>
  </div>
))}
```

---

## 4. Technical Requirements

### 4.1 New Query — `PRODUCT_QUERY`

**File**: `cfs/client/src/graphql/queries.ts`

Add the following export:

```typescript
export const PRODUCT_QUERY = `
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      stock
      limitedStock
      imageUrl
      options {
        id
        name
        required
        values {
          id
          value
          stock
        }
      }
    }
  }
`
```

Add the hook:

```typescript
export function useProductQuery(id: string) {
  return useQuery({ query: PRODUCT_QUERY, variables: { id } })
}
```

### 4.2 New Routes

**File**: `cfs/client/src/App.tsx`

Add imports:
```typescript
import NewsDetail from './pages/NewsDetail'
import EventDetail from './pages/EventDetail'
import ProductDetail from './pages/ProductDetail'
```

Add routes after `/verification`:
```tsx
<Route path="/news/:id" element={<NewsDetail />} />
<Route path="/events/:id" element={<EventDetail />} />
<Route path="/products/:id" element={<ProductDetail />} />
```

---

## 5. File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `cfs/client/src/graphql/queries.ts` | Modify | Add `PRODUCT_QUERY` and `useProductQuery` hook |
| `cfs/client/src/App.tsx` | Modify | Add imports for detail pages + 3 new routes |
| `cfs/client/src/pages/Landing.tsx` | Modify | Wire up onClick for news cards, event cards, product cards |
| `cfs/client/src/pages/NewsDetail.tsx` | Create | News detail page component |
| `cfs/client/src/pages/EventDetail.tsx` | Create | Event detail page component |
| `cfs/client/src/pages/ProductDetail.tsx` | Create | Product detail page component |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Modify | Make table rows clickable, add cursor style and onClick |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Modify | Make table rows clickable, add cursor style and onClick |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Modify | Make table rows clickable, add cursor style and onClick |

---

## 6. Test Scenarios

### Scenario 1: News detail loads correctly

**Given**: A news item with id "abc" exists with title "Test News", content "Full content here", and imageUrl "https://example.com/img.jpg"
**When**: User navigates to `/news/abc`
**Then**: The page displays title as `<h1>Test News</h1>`, image as full-width img, content preserves paragraphs, date formatted as "25 de abril de 2026"

### Scenario 2: News detail handles 404

**Given**: No news item with id "xyz" exists
**When**: User navigates to `/news/xyz`
**Then**: "Noticia no encontrada" is displayed with a "Volver" button that navigates back

### Scenario 3: Event detail displays full datetime range

**Given**: An event exists with name "Concert", startTime "2026-04-25T18:00:00Z", endTime "2026-04-25T21:00:00Z"
**When**: User views `/events/:id`
**Then**: Location shows "📍 {location}", datetime shows "25 de abril de 2026, 18:00 - 21:00" in a single line

### Scenario 4: Product detail shows options as badges

**Given**: A product has options with name "Talla" and values ["S", "M", "L"]
**When**: User views `/products/:id`
**Then**: Below the price, a row shows "Talla:" followed by three badge chips: "S", "M", "L"

### Scenario 5: Product detail shows correct stock status

**Given**: A product with `limitedStock: true` and `stock: 0`
**When**: User views `/products/:id`
**Then**: Stock badge shows "Sin stock" in red

**Given**: A product with `limitedStock: false`
**When**: User views `/products/:id`
**Then**: Stock badge shows "Stock infinito" in gray

### Scenario 6: Landing news cards are clickable

**Given**: User is on the Landing page with news items displayed
**When**: User clicks a news card
**Then**: Browser navigates to `/news/:id`

### Scenario 7: Landing event cards are clickable

**Given**: User is on the Landing page with event cards displayed
**When**: User clicks an event card
**Then**: Browser navigates to `/events/:id`

### Scenario 8: Landing product cards navigate to product detail

**Given**: User is on the Landing page with product preview displayed
**When**: User clicks a product card
**Then**: Browser navigates to `/products/:id`

### Scenario 9: Admin news row navigates to detail

**Given**: User is on `/admin/news`
**When**: User clicks a table row
**Then**: Browser navigates to `/news/:id?from=admin`

### Scenario 10: Admin mode shows badge on detail page

**Given**: User navigates to `/news/abc?from=admin`
**Then**: A "Modo Admin" badge is displayed in the page header area

---

## 7. Edge Cases

| Case | Handling |
|------|----------|
| News item with no imageUrl | Don't render img element |
| Event with no description | Don't render description section |
| Product with no options | Don't render options section |
| Product with multiple options | Render all options in sequence |
| Null `limitedStock` | Treat as `true` (finite stock) |
| Negative stock value | Display as-is with warning color |

---

## 8. Out of Scope

- Admin-specific detail pages with edit functionality (detail pages are read-only public views)
- Modifying Catalog page behavior
- Authentication on detail pages (they read public data)
- Creating/editing from detail pages