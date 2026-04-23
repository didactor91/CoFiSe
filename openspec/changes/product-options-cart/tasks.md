# Tasks: Product Options + Cart + Checkout Anti-Fraud

## Phase 1: Database & Schema

- [x] 1.1 Add `product_options` table to `cfs/database/schema.sql` — columns: id, product_id, name, type (CHECK IN('SIZE','COLOR')), required, position
- [x] 1.2 Add `option_values` table — columns: id, option_id, value, stock (NULL=infinite), position
- [x] 1.3 Add `carts` table — columns: id, session_id (UNIQUE), status, created_at, expires_at
- [x] 1.4 Add `cart_items` table — columns: id, cart_id, product_id, option_value_id, quantity, UNIQUE(cart_id, product_id, option_value_id)
- [x] 1.5 Add `verification_codes` table — columns: id, reservation_id, code, expires_at, used, attempts
- [x] 1.6 Add `reservation_items` table — columns: id, reservation_id, product_id, option_value_id, quantity, unit_price
- [x] 1.7 ALTER `reservations` table: add cart_id, verified_at, ip_address, status CHECK (include 'pending_unverified')
- [x] 1.8 Add indexes to `cfs/database/schema.sql` — idx_product_options_product, idx_option_values_option, idx_carts_session, idx_cart_items_cart, idx_verification_codes_reservation, idx_reservation_items_reservation, idx_reservations_ip_created
- [x] 1.9 RED: Write test for migration v2 — applies cleanly on fresh DB and is idempotent
- [x] 1.10 GREEN: Create migration v2 in `cfs/database/migrations.ts` with all new tables
- [x] 1.11 REFACTOR: Add rollback test for migration v2

## Phase 2: Backend GraphQL

- [x] 2.1 Add to `cfs/server/src/graphql/schema.ts` — enum OptionType { SIZE COLOR }, types ProductOption, OptionValue, Cart, CartItem, VerificationResult
- [x] 2.2 Add to schema — queries: cart, productOptions(productId)
- [x] 2.3 Add to schema — mutations: addToCart, updateCartItem, removeFromCart, clearCart, submitCartForVerification, verifyReservationCode
- [x] 2.4 Add input types — AddToCartInput, CheckoutInput
- [x] 2.5 RED: Write test for addToCart — rejects when required option not selected
- [x] 2.6 GREEN: Implement addToCart resolver validation in `cfs/server/src/graphql/resolvers.ts`
- [x] 2.7 RED: Write test for submitCartForVerification — rejects honeypot filled
- [x] 2.8 GREEN: Implement honeypot validation in submitCartForVerification resolver
- [x] 2.9 RED: Write test for rate limiting — 3rd reservation in 1 hour from same IP fails
- [x] 2.10 GREEN: Implement IP rate limiting in anti-fraud middleware `cfs/server/src/middleware/antiFraud.ts`
- [x] 2.11 RED: Write test for timing check — form submitted <3s rejected
- [x] 2.12 GREEN: Implement form render time validation in antiFraud middleware
- [x] 2.13 RED: Write test for verifyReservationCode — wrong code increments attempts, 3 failures cancels
- [x] 2.14 GREEN: Implement verifyReservationCode resolver with attempt tracking
- [x] 2.15 REFACTOR: Extract antiFraud logic to helper functions (validateHoneypot, checkRateLimit, validateTiming)

## Phase 3: Frontend Foundation

- [ ] 3.1 Create `cfs/client/src/context/CartContext.tsx` — state: items, sessionId, addToCart, updateQuantity, removeItem, clearCart
- [ ] 3.2 CartContext syncs to localStorage key `senocom_cart` on every change
- [ ] 3.3 CartContext initializes new UUID sessionId if none in localStorage
- [ ] 3.4 RED: Write test for CartContext — addToCart merges quantities for same product+option
- [ ] 3.5 GREEN: Implement addToCart merge logic in CartContext
- [ ] 3.6 RED: Write test for CartContext — stale products (deleted from DB) are silently removed on load
- [ ] 3.7 GREEN: Implement stale product cleanup in CartContext
- [ ] 3.8 REFACTOR: Extract cart session management to useCart hook

## Phase 4: Frontend Components

- [ ] 4.1 Create `cfs/client/src/components/OptionSelector.tsx` — chips for SIZE/COLOR values, shows stock per value
- [ ] 4.2 OptionSelector shows "∞" for NULL stock, "Sin stock" for 0, disables out-of-stock chips
- [ ] 4.3 RED: Write test for OptionSelector — required option shows error when submitting without selection
- [ ] 4.4 GREEN: Implement required option validation in OptionSelector
- [ ] 5 Create `cfs/client/src/components/CartDrawer.tsx` — slide-out panel, item list, +/- controls, delete button, total
- [ ] 5.1 RED: Write test for CartDrawer — displays product name + selected option value
- [ ] 5.2 GREEN: Implement CartDrawer item display with option value
- [ ] 5.3 Modify `cfs/client/src/pages/Catalog.tsx` — add option selector trigger, add-to-cart with selected option

## Phase 5: Checkout Flow

- [ ] 5.1 Create `cfs/client/src/pages/Checkout.tsx` — multi-step (cart review, contact form, verification, confirmation)
- [ ] 5.2 Add hidden honeypot field "website" to contact form (display:none)
- [ ] 5.3 Record form render timestamp on step 2 mount, include in submission
- [ ] 5.4 RED: Write test for checkout — empty cart shows message, checkout not accessible
- [ ] 5.5 GREEN: Implement empty cart guard in Checkout page
- [ ] 5.6 RED: Write test for anti-fraud — honeypot filled shows bot detection message
- [ ] 5.7 GREEN: Implement honeypot field validation in checkout form
- [ ] 5.8 Create `cfs/client/src/pages/Verification.tsx` — code entry (4 digits), display demo code, attempt counter
- [ ] 5.9 Add routes in `cfs/client/src/App.tsx` — /checkout, /verification
- [ ] 5.10 RED: Write test for verification — expired code shows "Código expirado"
- [ ] 5.11 GREEN: Implement code expiration check in Verification page

## Phase 6: Testing

- [ ] 6.1 Unit tests for antiFraud middleware — honeypot, timing, rate limit functions
- [ ] 6.2 Unit tests for CartContext — add/remove/update/clear operations
- [ ] 6.3 Integration tests for checkout flow — cart review → contact → verification → reservation created
- [ ] 6.4 RED: Integration test for full flow — cart with options → checkout → verify → reservation status=PENDING
- [ ] 6.5 GREEN: Implement full flow to pass integration test
- [ ] 6.6 E2E test with Playwright — browse → select option → add to cart → checkout → verify → confirmation
- [ ] 6.7 REFACTOR: Verify all spec scenarios covered by tests

### Implementation Order
Phase 1 (DB) first — all other phases depend on schema. Phase 2 (GraphQL) second — backend provides API for frontend. Phase 3 (CartContext) third — state management foundation. Phase 4 (Components) fourth — UI builds on state. Phase 5 (Checkout) fifth — flow connects components. Phase 6 (Testing) last — validates everything.

### Phase Summary
| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 11 | Database & Schema |
| 2 | 15 | Backend GraphQL |
| 3 | 8 | Frontend Foundation |
| 4 | 6 | Frontend Components |
| 5 | 11 | Checkout Flow |
| 6 | 7 | Testing |
| **Total** | **58** | |