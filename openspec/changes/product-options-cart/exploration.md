# Exploration: Product Options + Cart Reservation System

## Current State

### How the System Works Today

**Products (Flat Model)**
- Products have a simple flat structure: `id, name, description, price, stock, imageUrl`
- Stock is managed at the **product level** only
- No concept of product options (sizes, colors, etc.)
- No variants or combinations

**Reservations (Direct One-Shot)**
- User browses catalog → clicks product → sees ReservationForm directly
- ReservationForm captures: `productId, quantity, name, email, phone, notes`
- Immediate `createReservation` mutation → status `PENDING`
- Staff later confirms/cancels via admin panel
- **No cart, no multi-item checkout**

**Key Files**
- `cfs/database/schema.sql` — Products and reservations tables (no options)
- `cfs/server/src/graphql/schema.ts` — Product type has no options field
- `cfs/server/src/graphql/resolvers.ts` — createReservation takes single productId
- `cfs/client/src/pages/Catalog.tsx` — Single-product click → ReservationForm
- `cfs/client/src/components/ReservationForm.tsx` — Single-product form
- `cfs/server/src/auth/permissions.ts` — Existing permissions: `product.*`, `reservation.*`

---

## Affected Areas

| File | Why Affected |
|------|--------------|
| `cfs/database/schema.sql` | Need new tables: `product_options`, `option_values`, `carts`, `cart_items`, `reservation_selections` |
| `cfs/server/src/graphql/schema.ts` | New types: `ProductOption`, `OptionValue`, `Cart`, `CartItem`. Extend `Product` with `options`. New mutations: `addToCart`, `updateCartItem`, `removeFromCart`, `createReservationFromCart` |
| `cfs/server/src/graphql/resolvers.ts` | New resolvers for cart operations, option queries, stock checking per option combination |
| `cfs/client/src/graphql/generated-types.ts` | Auto-generated types will include new types |
| `cfs/client/src/pages/Catalog.tsx` | Needs cart UI: "Add to Cart" vs "Reserve Now" |
| `cfs/client/src/components/ReservationForm.tsx` | May need refactor to support cart checkout flow |
| `cfs/client/src/components/CartDrawer.tsx` | **New** — slide-out cart panel |
| `cfs/client/src/components/OptionSelector.tsx` | **New** — UI for selecting options (size, color) |
| `cfs/client/src/context/CartContext.tsx` | **New** — cart state management |
| `cfs/server/src/auth/permissions.ts` | May need `cart.*` permissions if cart operations are authenticated |

---

## Approaches Considered

### 1. **Option A: Pivot Tables (Normalized)**

```
product_options: id, product_id, name, type (SELECT/TEXT), required, position
option_values: id, option_id, value, price_modifier, stock
carts: id, session_id, user_id (nullable), expires_at
cart_items: id, cart_id, product_id, option_value_ids (JSON), quantity
reservation_selections: id, reservation_id, option_value_id, quantity
```

| Pros | Cons |
|------|------|
| Full normalization, flexible queries | More joins, more complex mutations |
| Can filter products by option (e.g., "all red shirts") | Need to handle option combination stock |
| Price modifiers per option value | More tables = more migrations |
| Industry standard approach (Spree, Solidus) | |

**Effort**: High — requires new schema, all new resolvers, new UI components

---

### 2. **Option B: JSONB in Product (Denormalized)**

```
products: id, name, ..., options_json (TEXT as JSONB)
carts: id, session_id, items_json
cart_items: id, cart_id, product_id, selected_options (JSON), quantity
```

| Pros | Cons |
|------|------|
| Simpler schema, fewer tables | Cannot filter/query options in SQL easily |
| Easy to serialize/deserialize | Must load product to parse options |
| Faster reads for display | Stock management per combination harder |

**Effort**: Medium — simpler schema but still need cart UI and checkout flow

---

### 3. **Option C: Stock Matrix (Variant-Level)**

```
product_variants: id, product_id, sku, price, stock, options_json
```

Each combination (e.g., "Red Shirt, Size M") is its own row with its own stock.

| Pros | Cons |
|------|------|
| Perfect for e-commerce with sizes/colors | SKU management complexity |
| Stock at combination level (no partial stock) | Admin must create every combination |
| Simple queries: find variant by options | Doesn't support "notify me if out of stock" |

**Effort**: Medium-High — good for simple cases, harder for complex products

---

## Recommended Data Model

**Recommendation: Option A (Pivot Tables)** with a pragmatic simplification.

### Rationale

For a reservation system (not e-commerce), we need:
1. Products with configurable options (tallas, colores)
2. Stock checking per option combination
3. Multi-item cart for a checkout session
4. Convert cart → reservation

Pivot tables give us the most flexibility for:
- Filtering "show me all products with size L in stock"
- Price modifiers per option ("+5€ for XL")
- Staff management of options per product

### Proposed Schema

```sql
-- Product Options (e.g., "Talla", "Color")
CREATE TABLE product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- "Talla", "Color"
    type TEXT DEFAULT 'SELECT',  -- SELECT or TEXT
    required INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Option Values (e.g., "M", "L", "XL" for Talla)
CREATE TABLE option_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER REFERENCES product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL,         -- "M", "L", "XL", "Rojo", "Azul"
    price_modifier REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,     -- Stock for THIS specific option
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Carts (session-based for anonymous, user_id for logged-in)
CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,             -- For anonymous users
    user_id INTEGER REFERENCES users(id),  -- For logged-in users (nullable)
    status TEXT DEFAULT 'active', -- active, converted, expired
    expires_at DATETIME,          -- Cart expiration (e.g., 7 days)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    selected_options TEXT,        -- JSON: [{"option_id": 1, "option_value_id": 3}, ...]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reservation Selections (replaces simple product_id + quantity)
CREATE TABLE reservation_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    selected_options TEXT,        -- JSON: [{"option_id": 1, "option_value_id": 3}, ...]
    unit_price REAL NOT NULL,     -- Price at time of reservation (base + modifiers)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Modify reservations table
ALTER TABLE reservations ADD COLUMN cart_id INTEGER REFERENCES carts(id);
```

---

## Cart System Design

### Cart Storage: Hybrid (localStorage + Server)

| User Type | Storage | Expiration |
|-----------|---------|------------|
| Anonymous | `localStorage` with session ID | 7 days |
| Logged-in | Server-side `carts` table | 30 days or until converted |

### Cart State Management

```
CartContext (React Context)
├── items: CartItem[]
├── addItem(product, options, quantity)
├── updateItem(itemId, quantity)
├── removeItem(itemId)
├── clearCart()
├── itemCount: number
├── subtotal: number
└── isOpen: boolean (drawer visibility)
```

### Cart Drawer UI

- Slide-out panel from right
- Shows items with selected options summary
- Quantity adjustment per item
- Remove item button
- "Finalizar Reserva" button → CheckoutForm
- Persists across page navigation

---

## Checkout Flow

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BROWSE CATALOG                                          │
│    User sees product cards with "Añadir al carrito" button │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SELECT OPTIONS (if product has options)                  │
│    Modal/expanded view shows option selectors:               │
│    - Talla: [M] [L] [XL] (radio buttons)                   │
│    - Color: [Rojo] [Azul] [Verde] (swatches)                │
│    - Stock checked per combination                          │
│    "Añadir" disabled if combination out of stock            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CART DRAWER                                             │
│    Items appear in slide-out cart                           │
│    User can: adjust quantities, remove items, continue       │
│    shopping or proceed to checkout                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CHECKOUT (convert cart → reservation)                    │
│    Form captures: name, email, phone, notes                  │
│    "Confirmar Reserva" creates:                              │
│    - reservation (status: PENDING)                         │
│    - reservation_selections (one per cart_item)             │
│    - marks cart as 'converted'                              │
│    - clears localStorage / server cart                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. STAFF VALIDATION (existing flow)                         │
│    Staff sees reservation with all selections               │
│    Staff confirms → stock decremented per selection          │
└─────────────────────────────────────────────────────────────┘
```

### GraphQL Mutations (New)

```graphql
type Mutation {
  # Cart operations (public)
  addToCart(input: AddToCartInput!): Cart!
  updateCartItem(itemId: ID!, quantity: Int!): Cart!
  removeFromCart(itemId: ID!): Cart!
  clearCart: Boolean!
  
  # Checkout (creates reservation from cart)
  createReservationFromCart(input: CreateReservationFromCartInput!): Reservation!
  
  # Staff: manage options
  createProductOption(input: CreateProductOptionInput!): ProductOption!
  addOptionValue(optionId: ID!, input: AddOptionValueInput!): OptionValue!
}

input AddToCartInput {
  productId: ID!
  quantity: Int = 1
  selectedOptions: [SelectedOptionInput!]!  # [{"optionId": "1", "optionValueId": "3"}]
}

input CreateReservationFromCartInput {
  name: String!
  email: String!
  phone: String!
  notes: String
}
```

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stock race conditions (2 users same option) | Medium | High | Optimistic locking + transaction isolation |
| Cart expiration edge cases | Low | Medium | Clear expired carts via cron/job |
| Complex migration with existing data | Medium | High | Test migration script on copy first |
| Option combinations explode (n×m variants) | Low | Low | Limit to 2-3 options per product |
| Breaking existing ReservationForm | High | Medium | Keep as fallback; new CartCheckout component |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stock race conditions | Medium | High | Use SQLite transactions with EXCLUSIVE mode |
| Cart expiration handling | Low | Medium | Background cleanup job |
| Complex migration | Medium | High | Test on staging first |
| Breaking existing reservation flow | High | Medium | New cart/checkout flow; keep ReservationForm for direct fallback |
| Admin UI for managing options | Medium | Medium | New admin section for product options |

---

## Ready for Proposal

**Yes** — Ready for `sdd-propose`.

The exploration confirms:
1. Current system is simple (flat products, direct reservations)
2. A pivot-table approach for options provides the most flexibility
3. Cart should be localStorage for anonymous + server for logged-in
4. Checkout converts cart to reservation via new mutation
5. UI needs: OptionSelector component, CartDrawer, CartContext

**Next Steps**:
- Create proposal with scope: Product Options + Cart + Checkout (3 phases)
- Phase 1: Database schema + GraphQL types + Cart backend
- Phase 2: Cart UI (drawer, context, option selector)
- Phase 3: Checkout flow + admin option management

**Orchestrator should tell user**:
"This is a significant feature that touches every layer. We should split into 3 phases: (1) backend schema + cart API, (2) cart UI + option selectors, (3) checkout flow + admin options. Which phase would you like to start with, or should I create a proposal for the full feature?"
