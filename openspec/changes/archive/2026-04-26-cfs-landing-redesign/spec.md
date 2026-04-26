# Spec: cfs-landing-redesign

## Overview

This change introduces proper visual hierarchy to the Landing page (Header, Hero, ProductCard grid) and adds back navigation to the Catalog page. It also enhances the ProductCard component with optional cart functionality.

## Scope

### In Scope
- Create `Header` component with logo, nav links, and auth state display
- Create `Hero` component for Landing page
- Enhance `ProductCard` with optional `onAddToCart` callback prop
- Add back navigation to Catalog page
- Update Landing to use `Header` + `Hero` + `ProductCard`
- Apply consistent card treatment to EventCard

### Out of Scope
- Backend GraphQL schema changes
- New authentication logic
- Admin navbar changes

---

## 1. Header Component Specification

### File Location
`src/components/Header.tsx`

### Component Structure

```tsx
interface HeaderProps {
  // No props required - reads auth state internally via useAuth()
}

interface NavLink {
  label: string;
  href: string;
}
```

### Features

| Element | Specification |
|---------|---------------|
| **Logo** | Text "CFS" linking to `/` |
| **Nav Links** | Inicio (`/`), Catálogo (`/catalog`) |
| **Auth Section** | If authenticated: user email + logout button. If not: "Iniciar sesión" link to `/login` |

### Behavior

- **Authenticated state**: Display user email (truncated if > 20 chars) and a logout button that calls auth logout function
- **Unauthenticated state**: Display "Iniciar sesión" link pointing to `/login`
- **Mobile**: Hamburger menu or simplified layout (defer to CSS for responsiveness)

### Styling

- Logo: Bold, prominent positioning (left side or centered on mobile)
- Nav links: Horizontal on desktop, stacked or hamburger on mobile
- Auth section: Right-aligned on desktop, below nav on mobile

---

## 2. Hero Section Specification

### File Location
`src/components/Hero.tsx`

### Props

```tsx
interface HeroProps {
  headline?: string;      // default: "Tu comunidad, tu pasión"
  subtext?: string;       // default: "Explora productos, eventos y noticias de CFS"
  ctaText?: string;       // default: "Ver Catálogo"
  ctaHref?: string;       // default: "/catalog"
}
```

### Features

| Element | Specification |
|---------|---------------|
| **Headline** | "Tu comunidad, tu pasión" (configurable via prop) |
| **Subtext** | "Explora productos, eventos y noticias de CFS" |
| **CTA Button** | "Ver Catálogo" → navigates to `/catalog` |
| **Background** | Gradient or subtle pattern, centered content |
| **Alignment** | Vertically and horizontally centered |

### Behavior

- CTA button navigates to `/catalog` using `navigate()`
- All text content configurable via props for reusability

---

## 3. ProductCard Enhancement Specification

### File Location
`src/components/ProductCard.tsx` (existing, modified)

### Props

```tsx
interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  variant?: 'default' | 'compact';  // default: 'default'
  showAddToCart?: boolean;           // default: false
  onAddToCart?: () => void;          // optional callback
}
```

### Feature Behavior

| Condition | Result |
|-----------|--------|
| `onAddToCart` not provided | No button rendered |
| `onAddToCart` provided AND `showAddToCart` is true | Show "Añadir" button |
| `onAddToCart` provided but `showAddToCart` is false | No button rendered |
| `variant='compact'` | Compact layout (smaller image, less padding) |
| `variant='default'` | Default layout with full details |

### Button Configuration

- **Button text**: "Añadir"
- **Visibility**: Only when `onAddToCart` is provided AND `showAddToCart` is true
- **Action**: Calls `onAddToCart()` callback when clicked

### Stock Badge

- Display stock count if `stock` is defined
- Show "Sin stock" if stock is 0
- Show "stock" label with count (e.g., "5 en stock")

---

## 4. Landing Page Layout Specification

### File Location
`src/pages/Landing.tsx` (modified)

### Section Order

1. **Header** - Render `<Header />` component
2. **Hero** - Render `<Hero />` component
3. **Noticias Section** - News cards grid with "Ver todo" button
4. **Eventos Section** - Event cards grid with "Ver todo" button
5. **Catálogo Preview** - Product cards grid with "Ver todo" button
6. **Footer** - Simple copyright text

### Section Structure

```tsx
interface SectionProps {
  title: string;
  children: React.ReactNode;
  showViewAll?: boolean;
  viewAllHref?: string;
}
```

### Layout Details

| Section | Title | Content | View All Link |
|---------|-------|---------|---------------|
| News | "Noticias" | NewsCard grid (3 items) | `/news` |
| Events | "Eventos" | EventCard grid (3 items) | `/events` |
| Catalog | "Productos" | ProductCard grid (6 items, no cart button) | `/catalog` |

### Footer

- Single line: "© 2024 CFS. Todos los derechos reservados."

---

## 5. Catalog Back Navigation Specification

### File Location
`src/pages/Catalog.tsx` (modified)

### Implementation

```tsx
const navigate = useNavigate();

// In the component render, before the product grid:
<button 
  onClick={() => navigate('/')} 
  className="btn-secondary"
  style={{ marginBottom: '1rem' }}
>
  ← Inicio
</button>
```

### Features

| Aspect | Specification |
|--------|---------------|
| **Button text** | "← Inicio" |
| **Navigation** | Fixed to home (`navigate('/')`) |
| **Styling** | `btn-secondary` class for consistency |
| **Position** | Top-left of Catalog page content |
| **Spacing** | Margin-bottom of 1rem |

---

## 6. EventCard Consistency Specification

### File Location
`src/components/EventCard.tsx` (modified if exists)

### Pattern

EventCard should follow the same visual treatment as NewsCard:
- Consistent card styling (padding, border radius, shadow)
- Image handling (if applicable)
- Title and description formatting
- Date/time display if relevant

---

## 7. Component Inventory

| Component | File | Status |
|-----------|------|--------|
| Header | `src/components/Header.tsx` | New |
| Hero | `src/components/Hero.tsx` | New |
| ProductCard | `src/components/ProductCard.tsx` | Modified |
| Landing | `src/pages/Landing.tsx` | Modified |
| Catalog | `src/pages/Catalog.tsx` | Modified |
| EventCard | `src/components/EventCard.tsx` | Modified |

---

## 8. Acceptance Criteria

| # | Criterion | Verification Method |
|---|-----------|-------------------|
| AC1 | Header visible on all public pages (Landing, Catalog, etc.) | Visual inspection |
| AC2 | Hero section visible on Landing with correct headline and CTA | Visual inspection |
| AC3 | Products on Landing use ProductCard component (no raw divs) | Code review |
| AC4 | ProductCard shows Add to Cart button only when `onAddToCart` prop provided | Component test |
| AC5 | Catalog has back button that navigates to `/` using useNavigate | Functional test |
| AC6 | News section renders correctly with NewsCard components | Visual inspection |
| AC7 | Events section renders correctly with EventCard components | Visual inspection |
| AC8 | Mobile responsive design works on all sections | Responsive test |

---

## 9. Dependencies

- `useAuth` hook must exist in the codebase for Header auth state
- React Router `useNavigate` must be available
- Existing auth context must be accessible

---

## 10. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/Header.tsx` | Create | Logo + nav + auth status component |
| `src/components/Hero.tsx` | Create | Landing hero section component |
| `src/components/ProductCard.tsx` | Modify | Add `onAddToCart`, `variant`, `showAddToCart` props |
| `src/pages/Landing.tsx` | Modify | Integrate Header, Hero, ProductCard grid |
| `src/pages/Catalog.tsx` | Modify | Add back navigation button |
| `src/components/EventCard.tsx` | Modify | Consistent card styling (if exists) |