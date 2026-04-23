# Anonymous Cart Specification

## Purpose

Anonymous users can add products to a cart persisted in localStorage. Cart is session-based and expires after 7 days of inactivity. Multiple items supported, each with optional option value reference.

## Requirements

### Requirement: Cart Persistence

The system MUST store cart data in localStorage under key `senocom_cart`. Cart data MUST include sessionId, items array, and timestamps.

Cart MUST survive page reloads and browser restarts.

#### Scenario: Cart persists across page reload

- GIVEN a user has added 2 items to cart
- WHEN the user refreshes the page
- THEN all cart items remain intact
- AND sessionId is unchanged

#### Scenario: Cart initialized with new session

- GIVEN a new browser with no cart in localStorage
- WHEN the user visits the catalog
- THEN a new sessionId is generated (UUID)
- AND empty cart is initialized

### Requirement: Cart Session Management

Each cart has a unique sessionId used for identification. Cart expires after 7 days of inactivity.

#### Scenario: Cart expiration check on read

- GIVEN a cart with lastActivity older than 7 days
- WHEN any cart operation occurs
- THEN the cart is cleared
- AND a new empty cart is initialized

#### Scenario: Session ID collision handling (unlikely)

- GIVEN two browser tabs generating UUIDs
- WHEN UUIDs collide (extremely rare)
- THEN the second tab's cart merges with existing cart items
- AND quantities for duplicate product+option combinations are summed

### Requirement: Add to Cart

The system MUST support adding products to cart with optional option_value_id.

When adding same product+option twice, quantities MUST be merged.

#### Scenario: Add product without options

- GIVEN a product "Gorro" with no options (id: "p1")
- WHEN user clicks "Añadir al carrito" for this product
- THEN cart item is added: { product_id: "p1", option_value_id: null, quantity: 1 }

#### Scenario: Add product with options

- GIVEN a product "Corbata" (id: "p2") with color option "Rojo" (ov_id: "ov1")
- WHEN user selects "Rojo" and clicks add to cart
- THEN cart item: { product_id: "p2", option_value_id: "ov1", quantity: 1 }

#### Scenario: Merge quantities for same item

- GIVEN cart has { product_id: "p2", option_value_id: "ov1", quantity: 2 }
- WHEN user adds same product+option again with quantity 1
- THEN cart item quantity becomes 3
- AND only one cart item exists for that combination

#### Scenario: Add different option values

- GIVEN cart has { product_id: "p2", option_value_id: "ov1" (Rojo), quantity: 2 }
- WHEN user adds "Corbata" with "Verde" (ov2)
- THEN cart has 2 items: Rojo(qty:2) and Verde(qty:1)

### Requirement: Update Cart Item Quantity

Cart item quantities MUST be updateable. Setting quantity to 0 removes the item.

#### Scenario: Increase quantity

- GIVEN cart item for "Corbata" / "Rojo" with quantity 1
- WHEN user changes quantity to 3
- THEN cart item quantity = 3

#### Scenario: Set quantity to zero removes item

- GIVEN cart has item with quantity 2
- WHEN user sets quantity to 0
- THEN the cart item is removed
- AND cart no longer contains this product+option

### Requirement: Remove Cart Item

Users MUST be able to remove individual items from cart.

#### Scenario: Remove item by clicking delete

- GIVEN cart has 3 items
- WHEN user clicks delete icon on one item
- THEN that item is removed
- AND remaining 2 items persist

### Requirement: Clear Cart

Users MUST be able to clear all items from cart at once.

#### Scenario: Clear all items

- GIVEN cart has multiple items
- WHEN user clicks "Vaciar carrito"
- THEN all items are removed
- AND cart is empty

### Requirement: Stale Cart Item Cleanup

When reading cart, the system MUST silently remove items for products that no longer exist in database.

#### Scenario: Remove deleted product from cart

- GIVEN cart contains item for product_id "deleted-product"
- WHEN cart is loaded
- THEN the stale item is silently removed
- AND valid items remain

### Requirement: Cart Item Structure

Each cart item MUST contain: cart_id, product_id, option_value_id (NULL if product has no options), quantity, added_at.

#### Scenario: Cart item structure

- GIVEN a cart with 1 item
- WHEN cart is serialized to localStorage
- THEN each item contains: product_id, option_value_id, quantity, added_at