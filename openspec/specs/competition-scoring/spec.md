# Competition Scoring Specification

## Purpose

The competition-scoring domain provides result entry for matches with single-leg and home-and-away modes, including manual winner resolution for tied aggregates.

## Requirements

### Requirement: Match Result Entry (Single Leg)

The system SHALL allow admin to enter scores for single-leg matches.

#### Scenario: Enter single leg result with clear winner

- GIVEN a match exists with participant1_id=1, participant2_id=2, status=PENDING, competition match_type=SINGLE_LEG
- WHEN admin enters home_score1=3, home_score2=1
- THEN winner_id is automatically set to participant1 (higher score)
- AND status changes to COMPLETED
- AND the winner advances to the next round match

#### Scenario: Enter single leg result with tie (manual override required)

- GIVEN a match exists with participant1_id=1, participant2_id=2, status=PENDING, match_type=SINGLE_LEG
- WHEN admin enters home_score1=1, home_score2=1
- THEN the system prompts "Empate - seleccionar ganador manualmente"
- AND winner_id is NOT set automatically
- AND admin must select winner from dropdown

### Requirement: Match Result Entry (Home and Away)

The system SHALL calculate aggregate scores from two legs for HOME_AND_AWAY match type.

#### Scenario: Enter home-and-away result with clear winner

- GIVEN a match exists with participants 1 and 2, match_type=HOME_AND_AWAY, status=PENDING
- WHEN admin enters home_score1=2 (P1 home), home_score2=0 (P2 home), away_score1=0 (P1 away), away_score2=1 (P2 away)
- THEN aggregate is calculated: P1 = 2+1 = 3, P2 = 0+0 = 0
- AND winner_id is set to participant1
- AND status changes to COMPLETED

#### Scenario: Home-and-away tie requires manual winner selection

- GIVEN a match exists with participants 1 and 2, match_type=HOME_AND_AWAY, status=PENDING
- WHEN admin enters home_score1=1, home_score2=1, away_score1=1, away_score2=1
- THEN aggregate: P1 = 1+1 = 2, P2 = 1+1 = 2
- AND system prompts "Empate en agregado - seleccionar ganador manualmente"
- AND admin must select winner manually

### Requirement: Manual Winner Override

The system SHALL allow admin to manually set winner when automatic resolution is not possible.

#### Scenario: Admin selects winner from participants on tie

- GIVEN a match has tied aggregate scores
- WHEN admin selects participant1 from the winner dropdown
- THEN winner_id is set to participant1
- AND status changes to COMPLETED
- AND the selected participant advances to next round

### Requirement: Automatic Advancement to Next Round

The system SHALL automatically populate the next round match with the winner when a match is completed.

#### Scenario: Winner auto-populates next round match

- GIVEN a round 1 match completes with winner_id=participant1
- AND the next round match exists with participant2_id already set
- WHEN the round 1 match is saved
- THEN participant1_id of the round 2 match is set to winner_id

#### Scenario: Next round match created only when previous completes

- GIVEN a round 2 match requires winners from 2 round 1 matches
- WHEN only 1 round 1 match has been completed
- THEN participant slots remain empty until second match completes

### Requirement: Bye Advancement

The system SHALL handle automatic advancement for participants with byes.

#### Scenario: Bye participant automatically in round 2

- GIVEN a participant received a bye in round 1
- WHEN bracket generation completes
- THEN that participant's position in round 2 is pre-filled
- AND no match is created for that bye slot in round 1

### Requirement: Score Display After Completion

The system SHALL display both legs scores for HOME_AND_AWAY matches.

#### Scenario: Home-and-away match shows both legs

- GIVEN a HOME_AND_AWAY match is completed
- WHEN the bracket displays the match
- THEN both leg scores are visible (e.g., "Ida: 2-0, Vuelta: 0-1")
- AND aggregate total shown for clarity

## Permissions

Only users with competition.update permission can modify match results.