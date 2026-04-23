# Proposal: Product Options + Cart + Checkout with Anti-Fraud

## Intent

Products need configurable options (size/color selectors), anonymous cart for collecting items, and a checkout flow with anti-fraud protection before formal reservation. This changes the system from a direct one-shot reservation model to a cart-based flow.

## Scope

### In Scope
- Product options (single selector per product: size OR color, not both)
- Option-level stock tracking (product without options → product-level stock; with options → option-level stock)
- Anonymous cart (localStorage, session-based)
- Cart UI (drawer, option selectors)
- Checkout flow: contact form → email verification → reservation
- Anti-fraud: honeypot + timing analysis + rate limiting + 4-digit email verification

### Out of Scope
- Multiple selectors per product (size AND color)
- Price modifiers per option (NO price changes based on options)
- User accounts / login for cart
- Admin UI for managing options
- Infinite stock configuration UI (set NULL or -1 for infinite)

## Capabilities

### New Capabilities
- `product-options`: Product option configuration (selector type + values + stock per option)
- `anonymous-cart`: Cart management with localStorage persistence, session-based
- `cart-checkout`: Checkout flow with contact capture and 4-digit verification code
- `reservation-verification`: Anti-fraud email/verification layer

### Modified Capabilities
- `reservation-management`: Extended to support multiple cart items with options (instead of single product reservation)

## Approach

**Backend**: New tables for options, cart, verification codes. New GraphQL types and mutations for cart operations and checkout. Anti-fraud middleware for rate limiting and timing checks.

**Frontend**: CartContext for state management, CartDrawer for slide-out panel, OptionSelector for size/color selection. New Checkout page with multi-step flow.

**Flow**: Browse catalog → Select options (if product has options) → Add to cart → Review cart (drawer) → Checkout (contact + anti-fraud) → Email verification → Reservation created → Staff confirms

**Anti-Fraud Layers**:
1. Honeypot: Hidden email field bots fill, humans don't
2. Timing: Form submitted <3 seconds → likely bot, reject
3. Rate limiting: Max 3 reservations per IP per hour
4. Email verification: 4-digit code (10 min expiry) before reservation activates

## Data Model

```sql
product_options: id, product_id, name, type (SIZE/COLOR), required, position
option_values: id, option_id, value, stock (NULL = infinite)
carts: id, session_id, status, created_at, expires_at
cart_items: id, cart_id, product_id, option_value_id, quantity
verification_codes: id, reservation_id, code, expires_at, used
reservations: id, cart_id, name, email, phone, notes, status, created_at, verified_at
reservation_items: id, reservation_id, product_id, option_value_id, quantity, unit_price
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/database/schema.sql` | Modified | New tables: options, carts, cart_items, verification_codes, reservation_items |
| `cfs/server/src/graphql/schema.ts` | Modified | New types + cart/checkout/verification mutations |
| `cfs/server/src/graphql/resolvers.ts` | Modified | Cart + verification resolvers |
| `cfs/server/src/middleware/antiFraud.ts` | New | Honeypot + timing + rate limiting middleware |
| `cfs/client/src/context/CartContext.tsx` | New | Cart state + localStorage persistence |
| `cfs/client/src/components/CartDrawer.tsx` | New | Cart slide-out panel |
| `cfs/client/src/components/OptionSelector.tsx` | New | Size/color selector UI |
| `cfs/client/src/pages/Catalog.tsx` | Modified | Add to cart with option selection |
| `cfs/client/src/pages/Checkout.tsx` | New | Checkout page with anti-fraud flow |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing ReservationForm | High | Keep as fallback, show deprecation warning |
| Race condition on stock | Medium | SQLite transactions with EXCLUSIVE mode |
| Migration with existing data | Medium | New tables only, no existing schema changes |
| Cart expiration edge cases | Low | Clear expired carts on read |
| Rate limiting IP spoofing | Low | Rely on email verification as primary anti-fraud |

## Rollback Plan

- Migration adds new tables (no DDL changes to existing tables)
- Rollback: drop new tables, remove new GraphQL types
- Frontend: feature flag or separate routes for cart vs legacy flow

## Dependencies

- None external

## Success Criteria

- [ ] Staff can add options to products (single selector: size OR color)
- [ ] Stock tracked per option when product has options; product-level when not
- [ ] Users can add products to anonymous cart with option selection
- [ ] Cart persists across page reloads (localStorage)
- [ ] Checkout flow captures contact info and verifies via 4-digit code
- [ ] Anti-fraud honeypot + timing + rate limiting filter bots
- [ ] Staff sees reservations with selected options in admin panel
- [ ] Existing ReservationForm still works (backwards compatible)
