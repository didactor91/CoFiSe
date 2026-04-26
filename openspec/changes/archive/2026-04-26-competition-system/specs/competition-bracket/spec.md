# Competition Bracket Specification

## Purpose

The competition-bracket domain provides public read-only access to competition brackets with round-by-round progression displayed horizontally.

## Requirements

### Requirement: Public Competition Page

The system SHALL provide a public page at `/competitions/:id` accessible to all users (authenticated or not).

#### Scenario: Display competition header

- GIVEN a competition exists with name="Copa 2026", description="Annual tournament", match_type=SINGLE_LEG
- WHEN user views `/competitions/:id`
- THEN the page displays name in `<h1>`
- AND description below the title
- AND a match_type badge (e.g., "Eliminatoria única" for SINGLE_LEG, "Ida y Vuelta" for HOME_AND_AWAY)

#### Scenario: Display full bracket horizontally

- GIVEN a competition has 4 participants and bracket generated
- WHEN user views the competition page
- THEN rounds are displayed as horizontal columns (Round 1 | Round 2 | Final)
- AND matches within each round are vertically stacked
- AND connector lines show bracket progression

#### Scenario: Completed match shows scores and winner

- GIVEN a match exists with participant1_id=1, participant2_id=2, home_score1=2, home_score2=1, winner_id=1, status=COMPLETED
- WHEN the bracket renders
- THEN both participant aliases are shown
- AND scores displayed (e.g., "2 - 1")
- AND winner highlighted with distinct styling (e.g., bold or color)

#### Scenario: Pending match shows placeholder

- GIVEN a match exists with participant1_id and participant2_id but status=PENDING
- WHEN the bracket renders
- THEN participant aliases are shown with "?" for scores
- AND match appears dimmed or with dashed border

#### Scenario: Bye match shows automatic advancement

- GIVEN a participant received a bye in round 1
- WHEN the bracket renders
- THEN a special bye indicator appears instead of a match
- AND the bye participant is shown in round 2

### Requirement: Bracket Structure

The system SHALL display rounds with correct match positioning following standard bracket tree structure.

#### Scenario: 8-participant bracket structure

- GIVEN a competition with 8 participants
- WHEN bracket is generated
- THEN round 1 has 4 matches
- AND round 2 (semifinals) has 2 matches
- AND round 3 (final) has 1 match

#### Scenario: 5-participant bracket with 2 byes in later rounds

- GIVEN a competition with 5 participants
- WHEN bracket is generated
- THEN round 1: 2 matches + 1 bye
- AND round 2: 1 match + 2 bye participants advance
- AND final: 1 match

### Requirement: Error States

The system SHALL handle non-existent competition gracefully.

#### Scenario: Competition not found

- GIVEN no competition exists with the given id
- WHEN user navigates to `/competitions/:id`
- THEN "Competición no encontrada" is displayed
- AND a "Volver" button is shown