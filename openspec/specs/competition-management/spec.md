# Competition Management Specification

## Purpose

The competition-management domain provides CRUD operations for knockout tournaments including competition creation, participant management, and bracket generation with automatic bye handling.

## Requirements

### Requirement: Competition Data Model

The system SHALL store competitions with the following fields:
- id: unique identifier (integer, auto-increment)
- name: competition title (text, required, max 200 chars)
- description: tournament details (text, optional)
- match_type: SINGLE_LEG or HOME_AND_AWAY (enum, required)
- status: DRAFT, ACTIVE, or COMPLETED (enum, default DRAFT)
- participant_count: number of participants (integer, required at creation, min 2, max 16)
- created_at: record creation timestamp
- updated_at: record modification timestamp

#### Scenario: Create competition with valid data

- GIVEN the authenticated user has competition.create permission
- WHEN the user submits a valid competition with name, description, match_type, and participant_count
- THEN the system creates the competition record with status=DRAFT
- AND returns the created competition

#### Scenario: Reject competition with invalid participant count

- GIVEN the authenticated user has competition.create permission
- WHEN the user submits a competition with participant_count < 2 or > 16
- THEN the system rejects with validation error

#### Scenario: List all competitions as admin

- GIVEN the authenticated user has competition.read permission
- WHEN the user requests all competitions
- THEN the system returns all competitions ordered by created_at descending

### Requirement: Participant Management

The system SHALL allow adding participants to a competition with an alias.

#### Scenario: Add participants to competition in DRAFT status

- GIVEN a competition exists with status=DRAFT and participant_count=4
- WHEN the admin adds 4 participants with unique aliases
- THEN each participant is created with competition_id and alias
- AND the competition remains in DRAFT status

#### Scenario: Reject adding more participants than configured

- GIVEN a competition exists with participant_count=4
- WHEN the admin attempts to add a 5th participant
- THEN the system rejects with validation error indicating max participants reached

#### Scenario: Participants locked after bracket generation

- GIVEN a competition has status=ACTIVE (bracket generated)
- WHEN the admin attempts to add or remove participants
- THEN the system rejects with validation error "Participants locked after bracket generation"

### Requirement: Bracket Generation

The system SHALL generate a single-elimination bracket using Fisher-Yates shuffle when the admin triggers generation.

#### Scenario: Generate bracket with even participant count

- GIVEN a competition exists with status=DRAFT and exactly participant_count participants
- WHEN the admin triggers bracket generation
- THEN the system shuffles participants using Fisher-Yates
- AND creates round 1 matches pairing position i with position (n-1-i)
- AND sets competition status to ACTIVE

#### Scenario: Generate bracket with odd participant count (bye handling)

- GIVEN a competition exists with 5 participants
- WHEN the admin triggers bracket generation
- THEN the last participant (after shuffle) receives a bye
- AND that participant advances to round 2 without a match
- AND round 1 has 2 matches (4 participants) + 1 bye

#### Scenario: Bracket generation requires minimum participants

- GIVEN a competition has fewer than 2 participants added
- WHEN the admin triggers bracket generation
- THEN the system rejects with error "Minimum 2 participants required"

### Requirement: Competition Deletion

The system SHALL allow deletion of a competition, cascading to all participants and matches.

#### Scenario: Delete competition with cascade

- GIVEN a competition exists with id, participants, and generated matches
- WHEN the admin deletes the competition
- THEN all matches for that competition are deleted
- AND all participants for that competition are deleted
- AND the competition record is deleted
- AND returns success

#### Scenario: Only ADMIN can delete competitions

- GIVEN the user is authenticated with STAFF role
- WHEN the staff user submits a delete competition request
- THEN the system returns permission denied error

## Permissions

| Action | ADMIN | STAFF |
|--------|-------|-------|
| competition.read | Yes | Yes |
| competition.create | Yes | Yes |
| competition.update | Yes | Yes |
| competition.delete | Yes | No |