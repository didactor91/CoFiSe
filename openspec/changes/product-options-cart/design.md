# Design: Product Options + Cart + Checkout Anti-Fraud

## Technical Approach

This change adds product options (size/color selectors), anonymous cart (localStorage), and checkout with 4-layer anti-fraud verification. Products gain optional single-selector options with per-value stock tracking. Cart persists in localStorage with session ID. Checkout flow creates PENDING_UNVERIFIED reservations until 4-digit code verification succeeds.

Maps to proposal approach: pivot tables for options, localStorage cart, GraphQL mutations for cart operations, new `/checkout` route with multi-step flow.

## Architecture Decisions

### Decision: Cart Storage Strategy

**Choice**: localStorage for anonymous users, session-based with UUID  
**Alternatives**: server-side sessions with cookies, JWT in localStorage  
**Rationale**: Simpler backend (no session table), works without login, survives page reloads. Session ID in localStorage enables cart merge on same browser.

### Decision: Stock Tracking

**Choice**: Option-level stock with NULL = infinite, product-level fallback  
**Alternatives**: Matrix approach (size × color grid), product-level only  
**Rationale**: Meets single-selector requirement, NULL explicitly means infinite (vs -1 which requires code handling), simpler than matrix for one selector per product.

### Decision: Single Selector per Product

**Choice**: `type TEXT CHECK(type IN ('SIZE', 'COLOR'))` on product_options  
**Alternatives**: Generic selector with typed values  
**Rationale**: DB-level constraint enforces business rule, simpler UI (chip group vs dropdown), fits the "no multiple selectors" requirement cleanly.

### Decision: Anti-Fraud Layering

**Choice**: 4 layers (honeypot → timing → rate limit → verification code)  
**Alternatives**: Single anti-fraud mechanism  
**Rationale**: Defense in depth — each layer catches different attack vectors. Honeypot catches bots, timing catches fast scripters, rate limit catches repeat abuse, code verification ensures human email ownership.

### Decision: Cart Expiration

**Choice**: 7 days inactivity, cleared on read  
**Alternatives**: Fixed 7-day absolute expiry, never expire  
**Rationale**: Balances storage cleanup with user convenience. Absolute expiry penalizes users who bookmark and return. Inactivity-based is fairer.

## Data Flow

**Add to Cart Flow**:
```
User → Catalog → OptionSelector (if product has options)
     → CartContext.addToCart() → localStorage
     → CartDrawer updates (slide-out)
```

**Checkout Flow**:
```
Cart (/checkout) → Contact Form (honeypot + timing)
     → Rate Limit Check (3/IP/hour)
     → submitCartForVerification → Reservation (PENDING_UNVERIFIED)
     → Generate 4-digit code → Display to user
     → verifyReservationCode → Reservation PENDING
     → Staff sees in Admin
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/database/schema.sql` | Modify | Add tables: product_options, option_values, carts, cart_items, verification_codes, reservation_items |
| `cfs/database/migrations.ts` | Modify | Add migration v2 for new tables |
| `cfs/server/src/graphql/schema.ts` | Modify | Add ProductOption, OptionValue, Cart, CartItem, VerificationResult types; Add queries: cart, productOptions; Add mutations: addToCart, updateCartItem, removeFromCart, clearCart, submitCartForVerification, verifyReservationCode |
| `cfs/server/src/graphql/resolvers.ts` | Modify | Implement cart CRUD, anti-fraud checks, verification resolvers |
| `cfs/server/src/middleware/antiFraud.ts` | Create | Honeypot validation, timing check, rate limiting by IP |
| `cfs/server/src/auth/permissions.ts` | Modify | Add cart.read/write permissions if needed (cart ops are public) |
| `cfs/client/src/context/CartContext.tsx` | Create | Cart state, localStorage sync, session ID generation |
| `cfs/client/src/components/CartDrawer.tsx` | Create | Slide-out cart panel with items, quantities, totals |
| `cfs/client/src/components/OptionSelector.tsx` | Create | Size/color chip selector with stock display |
| `cfs/client/src/pages/Catalog.tsx` | Modify | Add to cart button, option modal trigger |
| `cfs/client/src/pages/Checkout.tsx` | Create | Multi-step checkout (review, contact, verify, confirm) |
| `cfs/client/src/pages/Verification.tsx` | Create | Code entry and verification result |
| `cfs/client/src/graphql/generated-types.ts` | Regenerate | Include new types post-migration |
| `cfs/client/src/App.tsx` | Modify | Add routes for /checkout, /verification |
| `cfs/client/src/graphql/queries.ts` | Modify | Add cart query, productOptions query |
| `cfs/client/src/graphql/mutations.ts` | Modify | Add cart mutations, checkout mutations |

## Database Schema

```sql
-- Product Options (one selector per product: SIZE or COLOR)
CREATE TABLE product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('SIZE', 'COLOR')),
    required INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0
);

CREATE TABLE option_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER REFERENCES product_options(id),
    value TEXT NOT NULL,
    stock INTEGER,
    position INTEGER DEFAULT 0
);

CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER REFERENCES carts(id),
    product_id INTEGER REFERENCES products(id),
    option_value_id INTEGER REFERENCES option_values(id),
    quantity INTEGER DEFAULT 1,
    UNIQUE(cart_id, product_id, option_value_id)
);

CREATE TABLE verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER REFERENCES reservations(id),
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0
);

CREATE TABLE reservation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER REFERENCES reservations(id),
    product_id INTEGER REFERENCES products(id),
    option_value_id INTEGER REFERENCES option_values(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
);

ALTER TABLE reservations ADD COLUMN cart_id INTEGER REFERENCES carts(id);
ALTER TABLE reservations ADD COLUMN verified_at DATETIME;
ALTER TABLE reservations ADD COLUMN status TEXT DEFAULT 'pending_unverified' 
    CHECK(status IN ('pending_unverified', 'pending', 'confirmed', 'cancelled', 'completed'));
ALTER TABLE reservations ADD COLUMN ip_address TEXT;

CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_option_values_option ON option_values(option_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_verification_codes_reservation ON verification_codes(reservation_id);
CREATE INDEX idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX idx_reservations_ip_created ON reservations(ip_address, created_at);
```

## GraphQL Schema Changes

```graphql
enum OptionType { SIZE COLOR }

type ProductOption {
  id: ID!; productId: ID!; name: String!; type: OptionType!
  required: Boolean!; values: [OptionValue!]!
}

type OptionValue {
  id: ID!; optionId: ID!; value: String!; stock: Int; available: Boolean!
}

type Cart {
  id: ID!; sessionId: String!; items: [CartItem!]!
  totalItems: Int!; createdAt: DateTime!; expiresAt: DateTime
}

type CartItem {
  id: ID!; product: Product!; optionValue: OptionValue; quantity: Int!; subtotal: Float!
}

type VerificationResult {
  success: Boolean!; message: String!; reservationId: ID
}

type Query {
  cart: Cart
  productOptions(productId: ID!): [ProductOption!]
}

type Mutation {
  addToCart(input: AddToCartInput!): Cart!
  updateCartItem(itemId: ID!, quantity: Int!): Cart!
  removeFromCart(itemId: ID!): Cart!
  clearCart: Boolean!
  submitCartForVerification(input: CheckoutInput!): VerificationResult!
  verifyReservationCode(reservationId: ID!, code: String!): VerificationResult!
}

input AddToCartInput {
  productId: ID!; optionValueId: ID; quantity: Int!
}

input CheckoutInput {
  name: String!; email: String!; phone: String!; notes: String
  honeypot: String; formRenderTime: Float!
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (backend) | Honeypot logic, timing calc, rate limit, code generation | vitest with mocks |
| Unit (frontend) | CartContext add/remove/update, localStorage sync | vitest + React Testing Library |
| Integration | Full cart → checkout → verify flow | vitest + supertest against test DB |
| E2E | User browses, adds to cart, checks out, verifies | Playwright |

## Migration / Rollout

- **Migration v2**: Adds new tables only; ALTER reservations only (add new columns)
- **Feature flag**: `/checkout` route vs existing `ReservationForm` (direct)
- **Backwards compatible**: Existing `createReservation` mutation and `ReservationForm` remain functional
- **Deploy order**: DB migration → restart backend → deploy frontend
- **Rollback**: Reverse migration drops new tables, removes added columns

## Open Questions

- [ ] Should we auto-expire carts after 7 days or keep forever? (Design uses 7-day inactivity)
- [ ] Should 4-digit code be shown on screen (demo) or sent via email (production)? (Design shows on screen with note)
- [ ] Do we need to notify staff when a new reservation is verified?
