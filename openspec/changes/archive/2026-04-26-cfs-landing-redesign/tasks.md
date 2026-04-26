# Implementation Tasks: cfs-landing-redesign

## Overview

Break down of the cfs-landing-redesign change into executable implementation tasks, derived from spec.md and design.md.

---

## Phase 1: Layout Foundation

- [x] 1.1 Create `internal/auth/middleware.go` with JWT validation
- [x] 1.2 Add `AuthConfig` struct to `internal/config/config.go`
- [x] 1.3 Add auth routes to `internal/server/server.go`

---

## Phase 2: ProductCard Enhancement

- [x] 2.1 Add `onAddToCart?: () => void` prop to ProductCard
- [x] 2.2 Add `variant?: 'default' | 'compact'` prop
- [x] 2.3 Render "Añadir" button when onAddToCart + showAddToCart are provided

---

## Phase 3: Landing Page Redesign

- [x] 3.1 Create Hero component with headline and CTA buttons
- [x] 3.2 Update Landing.tsx with Layout, Hero, ProductCard grid
- [x] 3.3 Remove raw div product rendering, use ProductCard

---

## Phase 4: Catalog Improvements

- [x] 4.1 Import useNavigate in Catalog.tsx
- [x] 4.2 Add back button "← Inicio"
- [x] 4.3 Pass onAddToCart to ProductCard, remove external absolute button

---

## Phase 5: App Integration

- [x] 5.1 Update App.tsx with PublicLayout wrapper for public routes
- [x] 5.2 Login and Checkout remain WITHOUT Layout

---

## Phase 6: Testing & Verification

- [x] 6.1 Run tests to verify no regressions

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/Header.tsx` | CREATE | Logo + nav + auth status |
| `src/components/layout/Footer.tsx` | CREATE | Simple footer |
| `src/components/layout/Layout.tsx` | CREATE | Layout wrapper |
| `src/components/landing/Hero.tsx` | CREATE | Hero section |
| `src/components/ProductCard.tsx` | MODIFY | Add onAddToCart + variant props |
| `src/pages/Landing.tsx` | MODIFY | Use Layout, Hero, ProductCard grid |
| `src/pages/Catalog.tsx` | MODIFY | Add back button, ProductCard onAddToCart |
| `src/App.tsx` | MODIFY | PublicLayout wrapper for routes |

---

## Dependencies

- `useAuth()` hook from `hooks/useAuth.ts`
- `useNavigate()` from react-router-dom
- Existing AuthContext from `context/AuthContext.tsx`
- Existing CSS classes: `.app-shell`, `.btn-primary`, `.btn-secondary`, `.section-title`

---

## Implementation Order

1. Phase 1: Create Header, Footer, Layout components
2. Phase 2: Enhance ProductCard with new props
3. Phase 3: Create Hero and update Landing
4. Phase 4: Update Catalog with back button
5. Phase 5: Update App.tsx with PublicLayout wrapper
6. Phase 6: Run tests and manual verification
