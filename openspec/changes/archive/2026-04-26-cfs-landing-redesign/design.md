# Technical Design: cfs-landing-redesign

## Context

The Landing page lacks structural components (no Header, no Hero) and renders products/events with raw divs instead of reusable components. The Catalog page lacks page-level back navigation. This design specifies the component architecture and implementation approach to unify the public-facing UI.

## Component Architecture

```
cfs/client/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # NEW - logo, nav, auth
│   │   ├── Footer.tsx        # NEW - simple footer
│   │   └── Layout.tsx        # NEW - wrapper with Header/Footer
│   ├── landing/
│   │   └── Hero.tsx          # NEW - hero section
│   └── ui/
│       └── ProductCard.tsx    # MODIFIED - add onAddToCart, variant
├── pages/
│   ├── Landing.tsx           # MODIFIED - use Header, Hero, ProductCard
│   └── Catalog.tsx           # MODIFIED - add back button
└── context/
    └── AuthContext.tsx       # EXISTING - for auth state in Header
```

### File Summary

| File | Action | Change |
|------|--------|--------|
| `src/components/layout/Header.tsx` | CREATE | New header component |
| `src/components/layout/Footer.tsx` | CREATE | Simple footer |
| `src/components/layout/Layout.tsx` | CREATE | Layout wrapper |
| `src/components/landing/Hero.tsx` | CREATE | Hero section |
| `src/components/ProductCard.tsx` | MODIFY | Add onAddToCart + variant props |
| `src/pages/Landing.tsx` | MODIFY | Use Header, Hero, ProductCard, Layout |
| `src/pages/Catalog.tsx` | MODIFY | Add back button |
| `src/App.tsx` | MODIFY | Add Layout wrapper for public routes |

## Design Specifications

### 1. Header Component (`src/components/layout/Header.tsx`)

**Purpose**: Persistent navigation bar with logo, nav links, and auth state.

**Interface**:
```tsx
interface HeaderProps {
  // No props - uses useAuth() internally
}
```

**Structure**:
```tsx
<header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
  <nav className="app-shell flex items-center justify-between h-16">
    <div className="flex items-center gap-8">
      <a href="/" className="text-xl font-bold text-slate-900">CFS</a>
      <div className="hidden md:flex items-center gap-6">
        <a href="/" className="text-sm font-medium hover:text-slate-600">Inicio</a>
        <a href="/catalog" className="text-sm font-medium hover:text-slate-600">Catálogo</a>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {isAuthenticated ? (
        <>
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button onClick={logout} className="btn-secondary text-xs">Cerrar sesión</button>
        </>
      ) : (
        <a href="/login" className="btn-primary text-xs">Iniciar sesión</a>
      )}
    </div>
  </nav>
</header>
```

**Implementation details**:
- Uses `useAuth()` hook to get `isAuthenticated`, `user`, `logout`
- Auth section shows email + logout button when authenticated
- Shows login link when unauthenticated
- Sticky positioning with backdrop blur for modern glass effect
- Responsive: nav links hidden on mobile (`hidden md:flex`)

### 2. Footer Component (`src/components/layout/Footer.tsx`)

**Purpose**: Simple footer for public pages.

**Structure**:
```tsx
<footer className="border-t border-slate-200 bg-white/60">
  <div className="app-shell py-6 text-center text-sm text-slate-500">
    <p>© {new Date().getFullYear()} CFS. Todos los derechos reservados.</p>
  </div>
</footer>
```

### 3. Layout Component (`src/components/layout/Layout.tsx`)

**Purpose**: Wrapper component that composes Header + main content + Footer.

**Interface**:
```tsx
interface LayoutProps {
  children: React.ReactNode
}
```

**Structure**:
```tsx
export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

### 4. Hero Component (`src/components/landing/Hero.tsx`)

**Purpose**: Hero section for the landing page with welcome message and CTA.

**Interface**:
```tsx
interface HeroProps {
  // No props - content is static
}
```

**Structure**:
```tsx
export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16 text-white sm:px-12 sm:py-24">
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Bienvenido a CFS
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Explora nuestro catálogo de productos, consulta las últimas noticias y mantente al día con nuestros eventos.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/catalog" className="btn-primary bg-white text-slate-900 hover:bg-slate-100">
            Ver catálogo
          </a>
          <a href="/login" className="btn-secondary border-white/30 text-white hover:bg-white/10">
            Iniciar sesión
          </a>
        </div>
      </div>
    </section>
  )
}
```

**Styling notes**:
- Gradient background from slate-900 to slate-800
- Decorative blur circles for depth
- Two CTAs: primary for catalog, secondary ghost style for login
- Responsive padding and text sizes

### 5. ProductCard Enhancement (`src/components/ProductCard.tsx`)

**Purpose**: Add optional cart action and layout variant support.

**Updated Interface**:
```tsx
interface ProductCardProps {
  product: Product
  onClick?: () => void
  onAddToCart?: () => void  // NEW - optional add to cart handler
  variant?: 'default' | 'compact'  // NEW - layout variant
}
```

**Implementation**:
- When `onAddToCart` is provided, render "Añadir al carrito" button:
  ```tsx
  {onAddToCart && (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onAddToCart()
      }}
      className="btn-primary text-xs mt-2"
    >
      Añadir al carrito
    </button>
  )}
  ```
- `variant` prop adjusts layout (default: standard card, compact: smaller padding/images)
- When `variant='compact'`, image height reduces to `h-32` instead of `h-40`
- Backward compatible: existing callers without `onAddToCart` continue working

### 6. Landing Page Update (`src/pages/Landing.tsx`)

**Changes**:
1. Wrap content with `<Layout>` component
2. Add `<Hero />` at top
3. Replace raw product divs with `ProductCard` components
4. Events section remains with raw divs (no EventCard component exists)

**Updated Structure**:
```tsx
import Layout from '../components/layout/Layout'
import Hero from '../components/landing/Hero'
import ProductCard from '../components/ProductCard'
// ... existing imports

export default function Landing() {
  const navigate = useNavigate()
  // ... existing data fetching

  return (
    <Layout>
      <Hero />
      <section className="app-shell space-y-12">
        {/* News section - unchanged */}
        {/* Events section - unchanged */}
        
        {/* Products section - now uses ProductCard */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="section-title">Catálogo</h2>
            <button onClick={() => navigate('/catalog')} className="btn-secondary w-fit">
              Ver todo
            </button>
          </div>

          {catalogPreview.length === 0 ? (
            /* empty state */
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalogPreview.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </Layout>
  )
}
```

**Note**: Landing page ProductCards do NOT have `onAddToCart` prop (no cart button on landing preview).

### 7. Catalog Page Update (`src/pages/Catalog.tsx`)

**Changes**:
1. Add back button at top using `useNavigate`
2. Use `ProductCard` with `onAddToCart` prop (instead of external button overlay)

**Implementation**:
```tsx
import { useNavigate } from 'react-router-dom'
// ... existing imports

export default function Catalog() {
  const navigate = useNavigate()
  // ... existing state

  return (
    <main data-testid="catalog-page" className="app-shell min-h-svh">
      <button onClick={() => navigate('/')} className="btn-secondary mb-6">
        ← Inicio
      </button>
      
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Catálogo
      </h1>
      
      {/* Product grid with ProductCard + onAddToCart */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => handleProductClick(product)}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </div>
      
      {/* ... rest of CartDrawer, floating button, etc */}
    </main>
  )
}
```

**Changes from current**:
- Remove the wrapper div with absolute positioned button around ProductCard
- Move "Añadir al carrito" button inside ProductCard via `onAddToCart` prop
- Keep existing floating cart button and CartDrawer
- The "Volver al catálogo" button inside `selectedProduct` view is internal navigation, keep it

### 8. App.tsx Update (`src/App.tsx`)

**Purpose**: Apply Layout wrapper to all public routes.

**Current structure**:
```tsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/catalog" element={<Catalog />} />
  <Route path="/login" element={<Login />} />
  {/* ... other routes */}
</Routes>
```

**Change**: Create a `PublicLayout` wrapper that applies Layout to public routes.

**Implementation**:
```tsx
import Layout from './components/layout/Layout'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/catalog" element={<PublicLayout><Catalog /></PublicLayout>} />
      <Route path="/login" element={<Login />} /> {/* Login keeps its own layout */}
      <Route path="/checkout" element={<Checkout />} />
      {/* ... other routes */}
    </Routes>
  )
}
```

**Note**: Login, Checkout, Verification pages should NOT have the Header/Footer (they have their own auth-focused layouts). Only Landing and Catalog get the Layout wrapper.

## CSS/Tailwind Classes Used

Existing classes (no new CSS needed):
- `.app-shell` - responsive container with max-width
- `.btn-primary`, `.btn-secondary` - button styles
- `.card`, `.card-hover` - card styling with hover effect
- `.section-title` - section headings

## Dependencies

- No new npm dependencies required
- Uses existing `useAuth()` hook from `hooks/useAuth.ts`
- Uses existing `useNavigate()` from react-router-dom
- Uses existing `AuthContext` from `context/AuthContext.tsx`

## Testing Considerations

1. **Header component**: Test auth state display (login vs logout buttons)
2. **ProductCard enhancement**: Ensure existing tests pass with backward-compatible props
3. **Catalog**: Verify "Añadir al carrito" button triggers cart action via new prop
4. **Navigation**: Verify all nav links work correctly with Layout wrapper

## Implementation Order

1. Create `Header.tsx`, `Footer.tsx`, `Layout.tsx`
2. Create `Hero.tsx`
3. Update `ProductCard.tsx` with new props
4. Update `App.tsx` with PublicLayout wrapper
5. Update `Landing.tsx` with Layout, Hero, ProductCard
6. Update `Catalog.tsx` with back button and ProductCard onAddToCart
7. Run existing tests to verify no regressions