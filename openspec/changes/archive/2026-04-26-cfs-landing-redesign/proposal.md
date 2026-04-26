# Proposal: cfs-landing-redesign

## Intent

The Landing page lacks structural components (no Header, no Hero) and renders products with raw divs instead of the ProductCard component. The Catalog page lacks back navigation. Product display is inconsistent between Landing and Catalog. This change introduces proper visual hierarchy, unified components, and working navigation.

## Scope

### In Scope
- Create `Header` component with logo, nav links, and auth state display
- Create `Hero` component for Landing page
- Enhance `ProductCard` with optional `onAddToCart` callback prop
- Add back navigation to Catalog page (using `useNavigate` to `/`)
- Update Landing to use `Header` + `Hero` + `ProductCard` for products
- Update Catalog to use the same `ProductCard` as Landing
- Apply consistent card treatment to EventCard (same pattern as NewsCard)

### Out of Scope
- Backend GraphQL schema changes
- New authentication logic
- Admin navbar changes (separate `admin-navbar` spec covers this)

## Capabilities

### New Capabilities
- `landing-redesign`: Unified landing page with Header, Hero, and consistent product/event cards
- `product-card-enhancement`: ProductCard component with optional onAddToCart button support

### Modified Capabilities
- `product-management`: ProductCard UI rendering (no spec-level requirement change, just component unification)

## Approach

1. **Header Component**: Create `components/Header.tsx` with logo (text-based), nav links (Home, Catálogo, Eventos, Noticias), and auth state (login/logout button or user name)

2. **Hero Component**: Create `components/Hero.tsx` with headline, subheadline, and CTA button

3. **ProductCard Enhancement**: Modify existing ProductCard to accept optional `onAddToCart?: () => void` prop. When provided, render an "Añadir al carrito" button. When absent, render no button (Landing use case).

4. **Catalog Back Navigation**: In `pages/Catalog.tsx`, add `useNavigate` hook and a "Volver al inicio" button fixed to route `/`

5. **Landing Page Update**: Replace raw product divs with `Header` + `Hero` + `ProductCard` grid

6. **EventCard Consistency**: Apply same card pattern as NewsCard to EventCard rendering

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/Header.tsx` | New | Logo + nav + auth status |
| `src/components/Hero.tsx` | New | Landing hero section |
| `src/components/ProductCard.tsx` | Modified | Add optional onAddToCart prop |
| `src/pages/Landing.tsx` | Modified | Use Header, Hero, ProductCard |
| `src/pages/Catalog.tsx` | Modified | Add back button with useNavigate |
| `src/components/EventCard.tsx` | Modified | Consistent card styling (if exists) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ProductCard breaking existing usages | Low | Verify all ProductCard consumers before deploy |
| Header nav links routing conflicts | Low | Test all nav routes after implementation |
| Auth state not accessible in Header | Medium | Check auth context exists before building |

## Rollback Plan

- Keep backup copies of modified files in `backup/` directory until verification passes
- Revert file swaps if navigation breaks or ProductCard fails to render
- No feature flag needed; UI-only change with low blast radius

## Dependencies

- Auth context must be accessible for Header (verify `useAuth` hook exists)

## Success Criteria

- [ ] Landing page displays Header, Hero, and ProductCard grid
- [ ] Catalog page has visible "Volver al inicio" button that navigates to `/`
- [ ] ProductCard on Landing has no cart button; ProductCard in Catalog has cart button
- [ ] Event cards on Landing match NewsCard visual treatment
- [ ] No console errors on Landing or Catalog pages
