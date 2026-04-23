# Cart Checkout Specification

## Purpose

Multi-step checkout flow captures customer contact information and triggers anti-fraud verification. Checkout creates a PENDING_UNVERIFIED reservation awaiting email code verification.

## Requirements

### Requirement: Multi-Step Checkout Flow

Checkout consists of 4 steps: Cart Review → Contact Form → Verification → Confirmation.

Each step must complete before proceeding to next.

#### Scenario: Successful checkout flow

- GIVEN a cart with items
- WHEN user proceeds to checkout
- THEN step 1 shows cart review with items and totals
- AND user clicks "Continuar"
- THEN step 2 shows contact form
- AND user fills and submits
- THEN step 3 shows verification code input
- AND user enters correct code
- THEN step 4 shows confirmation

#### Scenario: Cannot skip steps

- GIVEN user is on step 1 (Cart Review)
- WHEN user tries to jump to step 3
- THEN the system remains on step 1
- AND step navigation is sequential only

### Requirement: Cart Review Step

Step 1 displays all cart items with product names, selected options, quantities, and ability to update/remove items.

#### Scenario: Display cart items

- GIVEN a cart with "Corbata" / "Rojo" qty 2, and "Gorro" (no options) qty 1
- WHEN Cart Review is displayed
- THEN items show: "Corbata - Rojo x2", "Gorro x1"
- AND each item has +/- quantity controls and delete button

#### Scenario: Empty cart blocks checkout

- GIVEN a cart with no items
- WHEN user attempts to go to checkout
- THEN user sees message "Tu carrito está vacío"
- AND checkout is not accessible

#### Scenario: Update quantity from cart review

- GIVEN cart item with quantity 1
- WHEN user clicks "+" to increase to 2
- THEN quantity updates immediately
- AND localStorage is updated

#### Scenario: Remove item from cart review

- GIVEN a cart with 3 items
- WHEN user clicks delete on one item
- THEN item is removed
- AND cart review updates to show 2 items

### Requirement: Contact Form Fields

Contact form MUST capture: name, email, phone, notes (optional), honeypot field (hidden).

#### Scenario: Display contact form fields

- GIVEN checkout step 2
- THEN user sees: Name (required), Email (required), Phone (required), Notes (optional)
- AND hidden honeypot field "website" is present but invisible

#### Scenario: Honeypot field is hidden

- GIVEN the checkout page renders
- THEN the field named "website" has CSS `display: none` or `visibility: hidden`
- AND bots may still auto-fill it

#### Scenario: Form submission with honeypot filled

- GIVEN user submits contact form with honeypot field "website" containing text
- THEN the request is rejected with bot detection message
- AND no reservation is created

### Requirement: Anti-Fraud Timing Check

The system MUST record form render timestamp and reject submissions where time from render to submit is less than 3 seconds.

#### Scenario: Fast submission rejected

- GIVEN contact form renders at timestamp T
- WHEN user submits form at T + 2 seconds
- THEN the submission is rejected as likely bot
- AND user sees "Por favor, revisa el formulario antes de enviar"

#### Scenario: Normal submission accepted

- GIVEN contact form renders at timestamp T
- WHEN user submits form at T + 10 seconds
- THEN the submission timing is acceptable
- AND checkout proceeds

### Requirement: Contact Form Validation

Form fields MUST be validated before submission.

#### Scenario: Email format validation

- GIVEN user enters "not-an-email" in email field
- WHEN form is submitted
- THEN validation error shows "Email inválido"
- AND form is not submitted

#### Scenario: Required fields missing

- GIVEN name field is empty
- WHEN form is submitted
- THEN validation error shows "Nombre es obligatorio"
- AND form is not submitted

### Requirement: Rate Limiting Check

Before generating verification code, the system MUST check if the IP has exceeded 3 reservations per hour.

#### Scenario: Rate limit exceeded

- GIVEN IP "192.168.1.1" has made 3 reservations in the last hour
- WHEN a new checkout contact form is submitted
- THEN the request is rejected with friendly message "Algo salió mal, por favor intenta más tarde"
- AND no hint about rate limiting is given

### Requirement: Reservation Creation on Valid Submission

On valid contact form submission (passes honeypot, timing, rate limit), the system MUST create a reservation with status PENDING_UNVERIFIED.

#### Scenario: Create reservation on valid submission

- GIVEN valid contact form (name: "Juan", email: "juan@test.com", phone: "123456789")
- WHEN form is submitted and passes all checks
- THEN reservation is created with status PENDING_UNVERIFIED
- AND verification code is generated (4 digits)
- AND reservation contains all cart items
- AND user proceeds to verification step

### Requirement: Display Verification Code

In demo mode, the 4-digit code MUST be displayed on screen for user to copy.

#### Scenario: Display code on screen

- GIVEN verification step (step 3)
- THEN system displays "Tu código de verificación es: 1234"
- AND user can read and enter the code
- AND a note explains "En producción, este código se enviaría a tu email"

### Requirement: Reservation Status After Verification

After successful code verification, reservation status changes to PENDING.

#### Scenario: Verification updates reservation status

- GIVEN reservation in PENDING_UNVERIFIED status
- WHEN correct verification code is entered within time limit
- THEN reservation status changes to PENDING
- AND verified_at timestamp is set
- AND reservation is visible to staff

### Requirement: Checkout Page URL

Checkout page MUST be accessible at `/checkout` route.

#### Scenario: Checkout route accessible

- GIVEN user has items in cart
- WHEN user navigates to `/checkout`
- THEN checkout page renders with step 1 (Cart Review)