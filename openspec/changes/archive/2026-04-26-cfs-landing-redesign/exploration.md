# Exploration: cfs-landing-redesign — Landing Page & Catalog UI Issues

## Current State

### Landing Page (Landing.tsx)
- **Structure**: No Header/Navbar exists. Page is just `<main className="app-shell space-y-12">` with 3 sections dumped on page
- **News section**: Uses `NewsCard` component ✅
- **Events section**: Uses raw `div.card` with inline styling (inconsistent)
- **Products section**: Uses raw `div.card` with inline HTML instead of `ProductCard` ❌

### Catalog (Catalog.tsx)
- Uses `ProductCard` component ✅
- Has "Volver al catálogo" back button (line 98) but ONLY for product detail view (`selectedProduct` state), NOT for page-level navigation
- When user navigates directly to `/catalog` (not from landing), no back navigation exists
- Has floating cart button and option selector modal

### ProductCard (ProductCard.tsx)
- Minimal implementation: image, name, description (truncated), price, stock status badge
- Has `card-hover` effect for interactivity
- No "Add to Cart" button — that's handled externally in Catalog
- Uses `data-testid` for testing

### NewsCard (NewsCard.tsx)
- Similar structure to ProductCard
- Formats date with Spanish locale
- Truncates content at 100 chars

### App.tsx (Routing)
```
/ → Landing
/catalog → Catalog
/login → Login
/checkout → Checkout
/verification → Verification
/news/:id → NewsDetail
/events/:id → EventDetail
/products/:id → ProductDetail
/competitions/:id → CompetitionDetail
/admin → Protected AdminLayout
```
No Header/Navbar component exists anywhere in the codebase.

### CSS (index.css)
- `.app-shell`: mx-auto, max-w-6xl, responsive padding
- `.card`: rounded-2xl, border, bg-white/95, shadow-sm, responsive padding
- `.card-hover`: hover translate + shadow
- `.btn-primary`, `.btn-secondary`: defined
- `.section-title`: text-xl/semibold, text-slate-900

### theme.ts
Contains color tokens, typography, spacing — but these aren't used in components directly (components use Tailwind classes)

### Product GraphQL Query
Returns: id, name, description, price, stock, limitedStock, imageUrl, createdAt, updatedAt, options (with values and stock)

---

## Affected Areas

| File | Issue |
|------|-------|
| `cfs/client/src/pages/Landing.tsx` | No Header, no Hero, uses raw divs for products instead of ProductCard |
| `cfs/client/src/pages/Catalog.tsx` | No back button for page-level navigation |
| `cfs/client/src/components/ProductCard.tsx` | Missing "Add to Cart" action; could be more flexible |
| `cfs/client/src/App.tsx` | No route guards for catalog back navigation context |
| `cfs/client/src/index.css` | No hero styles, no navbar styles |

---

## Approaches

### Approach 1: Incremental Fix (Low Effort, Low Impact)
- Add `useNavigate(-1)` back button to Catalog
- Replace raw product divs in Landing with ProductCard
- Keep current structure

**Pros**: Quick fix, minimal risk
**Cons**: Landing still looks dumped, no visual hierarchy, no hero

### Approach 2: Full Landing Redesign (Medium Effort, High Impact)
- Create `Header/Navbar` component with logo, nav links (Home, Catálogo, Login)
- Add `Hero` section to landing with welcome message and CTA
- Create `Footer` component
- Replace all raw product divs with ProductCard
- Add visual hierarchy with section spacing/contrast
- Add cart indicator to navbar

**Pros**: Proper landing page design, consistent product display
**Cons**: More components to maintain, need to decide on styling approach

### Approach 3: Shared Layout with Header (High Effort, Highest Impact)
- Create `Layout` component wrapping all public pages
- Include persistent Header with cart indicator
- Landing gets Hero, sections with proper visual treatment
- Catalog gets contextual back button based on referrer or fixed to home

**Pros**: Most polished, maintains consistency
**Cons**: Significant refactor, need to update all page wrappers

---

## Recommendation

**Approach 2** for the landing redesign — create a Header component (without full Layout wrapper to minimize coupling), add Hero section, and use ProductCard consistently.

**Catalog back navigation**: Use `useNavigate(-1)` with fallback to `/` since direct navigation to `/catalog` has no referrer context.

---

## Risks

- Adding Header/Navbar requires deciding how to handle auth state (show Login vs Logout)
- ProductCard may need props to support both "click to view" (Landing) and "click to select" (Catalog) modes
- Events section on Landing uses raw divs but there's no EventCard component — could create one or use same pattern as products

---

## Ready for Proposal

**Yes** — ready to create a change proposal for "landing-redesign" or similar. The issues are clearly defined and solutions are implementable.

Key decisions needed from user:
1. Should Header include auth state (Login/Logout button)?
2. Should ProductCard have an optional "Add to Cart" button for both pages?
3. Should there be a persistent Layout wrapper or just Header on landing?
