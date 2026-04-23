# Delta for reservation-management

## MODIFIED Requirements

### Requirement: Reservation Structure with Cart Items

(Previously: Single product reservation with direct fields)

Reservations MUST support multiple items from cart, each with optional product option. Each reservation item stores product_id, option_value_id (NULL if product has no options), quantity, and unit_price at time of reservation.

#### Scenario: Create reservation from cart

- GIVEN a cart with 2 items: "Corbata" (Rojo, qty2) and "Gorro" (no options, qty1)
- WHEN checkout completes successfully
- THEN reservation is created with 2 reservation_items
- AND item 1: product_id="corbata", option_value_id="rojo", quantity=2, unit_price=current
- AND item 2: product_id="gorro", option_value_id=null, quantity=1, unit_price=current

#### Scenario: Reservation stores option value reference

- GIVEN a reservation for product with options
- WHEN reservation_items are queried
- THEN each item includes the option_value_id that was selected
- AND staff can see which size/color was reserved

#### Scenario: Reservation captures price at checkout time

- GIVEN product "Corbata" priced at €25
- WHEN reservation is created at checkout
- THEN each reservation_item.unit_price = €25 (price at that moment)
- AND if product price changes later, reservation item price remains unchanged

### Requirement: Reservation Status States

(Previously: Simple PENDING | CONFIRMED | CANCELLED)

The system MUST support additional status PENDING_UNVERIFIED for reservations awaiting email verification.

#### Scenario: New reservation is unverified

- GIVEN checkout completes contact form submission
- WHEN reservation is created
- THEN status = PENDING_UNVERIFIED
- AND verified_at = null

#### Scenario: Verified reservation becomes pending

- GIVEN reservation with status PENDING_UNVERIFIED
- WHEN correct verification code is entered
- THEN status changes to PENDING
- AND verified_at = now()

#### Scenario: Unverified reservation times out

- GIVEN reservation with status PENDING_UNVERIFIED
- WHEN verification code expires without successful verification
- THEN reservation status changes to CANCELLED
- AND cart is cleared

#### Scenario: All status transitions

- PENDING_UNVERIFIED → PENDING (verification success)
- PENDING_UNVERIFIED → CANCELLED (expiry or max attempts)
- PENDING → CONFIRMED (staff action)
- PENDING → CANCELLED (customer/staff cancellation)
- CONFIRMED → CANCELLED (rare reversal case)

### Requirement: Reservation Stock Deduction

(Previously: Direct product stock decrement)

Stock is deducted when reservation status changes to CONFIRMED. Each item deducts from its corresponding stock level (product-level or option-level).

#### Scenario: Deduct stock for option-level product

- GIVEN reservation item for "Corbata" in "Rojo" with quantity 2
- WHEN reservation confirms
- THEN option_value "Rojo" stock decrements by 2
- AND product-level stock is NOT affected

#### Scenario: Deduct stock for product without options

- GIVEN reservation item for "Gorro" (no options) with quantity 3
- WHEN reservation confirms
- THEN product stock decrements by 3

#### Scenario: Stock deduction prevents overselling

- GIVEN option_value "Rojo" has stock = 5
- AND existing confirmed reservations consume 3
- WHEN new reservation requests 3 units of "Rojo"
- THEN available stock check passes (5 - 3 = 2 remaining >= 3? No)
- AND reservation is accepted (deduction happens at confirm, not at create)

## ADDED Requirements

### Requirement: Cart Reference in Reservation

Reservations created from checkout MUST reference the originating cart_id.

#### Scenario: Reservation linked to cart

- GIVEN cart with id "cart-uuid-123"
- WHEN checkout completes
- THEN reservation.cart_id = "cart-uuid-123"
- AND reservation contains all items from that cart

### Requirement: Contact Information Stored on Reservation

Reservation MUST store customer contact details captured at checkout.

#### Scenario: Contact fields stored

- GIVEN contact form with name="Juan", email="juan@test.com", phone="123456789", notes="Sin notas"
- WHEN reservation is created
- THEN reservation.name = "Juan"
- AND reservation.email = "juan@test.com"
- AND reservation.phone = "123456789"
- AND reservation.notes = "Sin notas"