# Product Options Specification

## Purpose

Products MAY have a single option selector (SIZE or COLOR) for variant selection. Each option value has independent stock tracking. Products without options use product-level stock.

## Requirements

### Requirement: Product Option Configuration

A product SHALL have zero or one option selector. The selector type MUST be either SIZE or COLOR, never both.

The system MUST store for each option: product_id, name, type (SIZE|COLOR), required flag, position.

#### Scenario: Add size selector to product

- GIVEN a product "Gorro" with no options
- WHEN staff adds an option with type SIZE and values ["S", "M", "L", "XL"]
- THEN the product now has one option selector with 4 values
- AND each value has NULL stock (infinite)

#### Scenario: Add color selector to product

- GIVEN a product "Corbata" with no options
- WHEN staff adds an option with type COLOR and values ["Rojo", "Verde", "Azul"]
- THEN the product now has one color selector with 3 values

#### Scenario: Product without options uses product-level stock

- GIVEN a product "Gorro" with no options and stock = 50
- WHEN stock is queried for this product
- THEN the available stock is 50 (product-level)

### Requirement: Option Value Stock Tracking

Each option value MUST have its own stock quantity. NULL or -1 stock means infinite.

Stock is decremented at RESERVATION CONFIRMATION time, not at cart add.

#### Scenario: Set finite stock per option value

- GIVEN a color option "Corbata" with value "Rojo"
- WHEN staff sets stock = 20 for "Rojo"
- THEN "Rojo" has 20 units available
- AND "Verde" (stock = 10) and "Azul" (stock = NULL) remain independent

#### Scenario: Infinite stock option

- GIVEN an option value with stock = NULL
- WHEN a user adds to cart
- THEN any quantity is allowed (no stock limit)

#### Scenario: Zero stock option

- GIVEN an option value with stock = 0
- WHEN a user attempts to add this option to cart
- THEN the system MUST show "Sin stock" and reject the add

### Requirement: Stock Display for Products with Options

When a product has options, the system MUST show stock per option value instead of product-level stock.

#### Scenario: Display stock per color

- GIVEN a "Corbata" product with color options
- WHEN the product is displayed in catalog
- THEN each color shows its own stock ("Rojo: 20", "Verde: 10", "Azul: ∞")

#### Scenario: All options out of stock

- GIVEN a "Corbata" where all color options have stock = 0
- WHEN the product is displayed
- THEN the product shows "Sin stock" overall
- AND add-to-cart is disabled

### Requirement: Option Validation

Products with options MUST require the user to select an option before adding to cart.

#### Scenario: Select option before add to cart

- GIVEN a product "Corbata" with color options
- WHEN user clicks "Añadir al carrito" without selecting a color
- THEN the system MUST show validation error "Selecciona un color"
- AND nothing is added to cart

### Requirement: Stock Deduction on Reservation Confirmation

When a reservation moves to CONFIRMED status, the system MUST decrement stock for each reserved option value.

#### Scenario: Deduct stock on confirmation

- GIVEN a reservation with 2 units of "Corbata" in "Rojo" (stock was 20)
- WHEN reservation status changes to CONFIRMED
- THEN "Rojo" stock decrements by 2
- AND "Rojo" new stock = 18

#### Scenario: Product without options deducts product-level stock

- GIVEN a reservation for product "Gorro" (no options) with quantity 3 (product stock was 50)
- WHEN reservation status changes to CONFIRMED
- THEN product stock decrements by 3
- AND new product stock = 47

## GraphQL Schema Additions

```graphql
enum OptionType {
  SIZE
  COLOR
}

type ProductOption {
  id: ID!
  productId: ID!
  name: String!
  type: OptionType!
  required: Boolean!
  position: Int!
  values: [OptionValue!]!
}

type OptionValue {
  id: ID!
  optionId: ID!
  value: String!
  stock: Int  # NULL means infinite
}

input CreateProductOptionInput {
  productId: ID!
  name: String!
  type: OptionType!
  required: Boolean
  values: [String!]!
}

type Product {
  # ... existing fields ...
  option: ProductOption  # null if no options configured
}
```

## UI Component Specifications

### OptionSelector Component

| State | Behavior |
|-------|----------|
| Default | Show option values as selectable chips/buttons |
| Selected | Highlight selected chip, enable Add to Cart |
| Out of stock | Show "Sin stock" label, disable chip |
| Required + not selected | Show error on submit attempt |

### Stock Display Format

- Finite stock: show number ("20 unidades")
- Infinite stock: show "∞" symbol
- Zero stock: show "Sin stock" in red