# Reservation Verification Specification

## Purpose

Anti-fraud verification layer using 4-digit email codes with rate limiting and expiration. Ensures reservations are from real humans before activating.

## Requirements

### Requirement: Verification Code Generation

On valid contact form submission, the system MUST generate a random 4-digit code (0000-9999) and store it with the reservation_id and 10-minute expiry.

#### Scenario: Generate unique code

- GIVEN a new reservation being created
- WHEN code is generated
- THEN a random 4-digit string is created
- AND stored linked to reservation_id
- AND expires_at is set to now + 10 minutes

#### Scenario: Codes are unique per reservation

- GIVEN two reservations created within same second
- WHEN codes are generated
- THEN each reservation has a distinct code
- AND codes may be same or different (random)

### Requirement: Code Expiration

Verification code expires 10 minutes after generation.

#### Scenario: Expired code cannot verify

- GIVEN a verification code created at T
- WHEN user attempts verification at T + 11 minutes
- THEN verification fails with "Código expirado"
- AND user must restart verification process

#### Scenario: Code valid within window

- GIVEN a verification code created at T
- WHEN user attempts verification at T + 5 minutes
- THEN verification can proceed (unless attempts exceeded)

### Requirement: Maximum Verification Attempts

User has maximum 3 attempts to enter the correct code. Exceeding 3 failures cancels the reservation.

#### Scenario: Third attempt is final

- GIVEN user has entered 2 wrong codes
- WHEN user enters wrong code a third time
- THEN verification fails with "Código incorrecto"
- AND reservation is cancelled
- AND user must restart checkout process

#### Scenario: Successful verification resets attempts

- GIVEN user has entered 1 wrong code
- WHEN user enters correct code
- THEN verification succeeds
- AND attempt count is reset for future verifications

### Requirement: Successful Verification Activation

On correct code entry within attempt and time limits, the system MUST:
1. Mark verification code as used
2. Update reservation status to PENDING
3. Set verified_at timestamp

#### Scenario: Correct code verification

- GIVEN valid verification code for reservation "res-123"
- WHEN user enters the correct code
- THEN verification_code.used = true
- AND reservation.status = "PENDING"
- AND reservation.verified_at = now()

### Requirement: Failed Verification Handling

On failed verification (wrong code or expired), the system MUST provide feedback but not reveal which specific failure.

#### Scenario: Wrong code feedback

- GIVEN user enters wrong code
- THEN message shows "Código incorrecto"
- AND attempt count increments
- AND remaining attempts shown: "2 intentos restantes"

#### Scenario: Expired code feedback

- GIVEN user attempts with expired code
- THEN message shows "Código expirado"
- AND user must restart verification

#### Scenario: All attempts exhausted

- GIVEN user has used all 3 attempts with wrong codes
- THEN reservation is cancelled
- AND user sees "Ha ocurrido un error, por favor inicia el proceso de nuevo"
- AND user is redirected to cart (reservation cancelled, not completed)

### Requirement: Rate Limiting by IP

Maximum 3 reservations can be created per IP address per hour.

#### Scenario: Check rate limit before code generation

- GIVEN IP address has 2 existing reservations in past hour
- WHEN new contact form is submitted
- THEN rate limit check passes
- AND code generation proceeds

#### Scenario: Rate limit blocks new reservation

- GIVEN IP address already has 3 reservations in past hour
- WHEN new contact form is submitted
- THEN request is rejected
- AND user sees friendly error: "Algo salió mal, por favor intenta más tarde"
- AND no indication of rate limit is given

#### Scenario: Rate limit tracked by IP only

- GIVEN IP "192.168.1.1" has 3 reservations
- WHEN different IP "192.168.1.2" submits form
- THEN that IP has no existing reservations
- AND checkout proceeds normally

### Requirement: Verification Code Storage

Verification codes MUST be stored securely in database with: id, reservation_id, code (hashed), expires_at, used (boolean), attempts (count).

#### Scenario: Code stored hashed

- GIVEN verification code "1234"
- WHEN code is stored
- THEN it is stored as hash (e.g., bcrypt)
- AND plain text is only needed for comparison
- AND plain text is returned via API for demo display

### Requirement: Demo Mode Code Display

In development/demo mode, the code MUST be displayed on screen. In production, code would be sent via email (integration not in scope).

#### Scenario: Display code for user

- GIVEN verification step initiated
- THEN UI displays: "Tu código es: 1234" (prominent display)
- AND note: "En producción este código se enviaría a tu email"

## Anti-Fraud Layer Summary

| Layer | Implementation | Rejection Message |
|-------|----------------|-------------------|
| Honeypot | Hidden "website" field | "Por favor, completa el formulario correctamente" |
| Timing | Form render to submit < 3s | "Por favor, revisa el formulario antes de enviar" |
| Rate Limit | 3/IP/hour | "Algo salió mal, por favor intenta más tarde" |
| Email Code | 4-digit, 10min, 3 attempts | Context-specific |

## Data Model

```sql
verification_codes:
  id: TEXT PRIMARY KEY
  reservation_id: TEXT REFERENCES reservations(id)
  code: TEXT NOT NULL  -- hashed
  expires_at: DATETIME NOT NULL
  used: BOOLEAN DEFAULT FALSE
  attempts: INTEGER DEFAULT 0

reservations:
  -- existing fields ...
  status: TEXT  -- PENDING_UNVERIFIED | PENDING | CONFIRMED | CANCELLED
  verified_at: DATETIME  -- set on successful verification
```