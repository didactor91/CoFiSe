# Tasks: Competition System

## Phase 1: Database & Migration
- [x] 1.1: Add competitions table to migrations.ts (id, name, description, match_type, status, created_at, updated_at)
- [x] 1.2: Add participants table to migrations.ts (id, competition_id FK, alias, created_at)
- [x] 1.3: Add matches table to migrations.ts (id, competition_id FK, round, position, participant1_id, participant2_id, home_score1, home_score2, away_score1, away_score2, winner_id, status)
- [x] 1.4: Add foreign key indexes (idx_participants_competition, idx_matches_competition, idx_matches_round_position)

## Phase 2: GraphQL Schema
- [x] 2.1: Add MatchType enum (SINGLE_LEG, HOME_AND_AWAY) to schema.ts
- [x] 2.2: Add CompetitionStatus enum (DRAFT, ACTIVE, COMPLETED) to schema.ts
- [x] 2.3: Add MatchStatus enum (PENDING, COMPLETED) to schema.ts
- [x] 2.4: Add Competition type with all fields (id, name, description, matchType, status, participants, matches, createdAt, updatedAt)
- [x] 2.5: Add Participant type (id, competitionId, alias, createdAt)
- [x] 2.6: Add Match type with all fields including isBye computed field
- [x] 2.7: Add CreateCompetitionInput and UpdateCompetitionInput input types
- [x] 2.8: Add SetMatchResultInput input type
- [x] 2.9: Add queries (competitions, competition, publicCompetitions) to schema.ts
- [x] 2.10: Add mutations (createCompetition, updateCompetition, deleteCompetition, addParticipants, generateBracket, setMatchResult) to schema.ts

## Phase 3: Server Resolver
- [x] 3.1: Create cfs/server/src/modules/competitions/resolvers.ts with all mutation/query implementations
- [x] 3.2: Implement createCompetition resolver with validation (participant_count 2-16)
- [x] 3.3: Implement updateCompetition resolver with status checks
- [x] 3.4: Implement deleteCompetition resolver with cascade delete
- [x] 3.5: Implement addParticipants resolver with DRAFT status check and max limit validation
- [x] 3.6: Implement generateBracket with Fisher-Yates shuffle algorithm
- [x] 3.7: Implement bye handling in bracket generation (odd participant count)
- [x] 3.8: Implement setMatchResult resolver for SINGLE_LEG matches with auto-winner
- [x] 3.9: Implement setMatchResult for HOME_AND_AWAY with aggregate calculation
- [x] 3.10: Implement tie handling with manual winner override prompt
- [x] 3.11: Implement winner advancement to next round match
- [x] 3.12: Add competitionFromRow, participantFromRow, matchFromRow mappers to shared/mappers.ts
- [x] 3.13: Import and merge competitionsResolvers in resolvers.ts

## Phase 4: Frontend - Admin
- [x] 4.1: Add "Competiciones" nav link to AdminLayout.tsx
- [x] 4.2: Create CompetitionsPage.tsx with competition list table
- [x] 4.3: Create CompetitionCard component for admin list
- [x] 4.4: Create CompetitionForm component (create/edit with name, description, match_type, participant_count)
- [x] 4.5: Create ParticipantList component (add/remove aliases with validation)
- [x] 4.6: Create BracketPreview component (small admin SVG view)
- [x] 4.7: Create MatchResultModal component (score entry with Ida/Vuelta labels)
- [x] 4.8: Wire up allCompetitions query and mutations in CompetitionsPage

## Phase 5: Frontend - Public
- [x] 5.1: Create CompetitionDetail.tsx page at /competitions/:id
- [x] 5.2: Create BracketView SVG component with horizontal round layout
- [x] 5.3: Create MatchCard component (participant names, scores, winner highlight, bye state)
- [x] 5.4: Add route for /competitions/:id in App.tsx
- [x] 5.5: Implement competition not found error state with "Volver" button
- [x] 5.6: Display match_type badge (Eliminatoria única / Ida y Vuelta)

## Phase 6: Permissions
- [ ] 6.1: Add competition permissions to auth/permissions.ts (competition.read, competition.create, competition.update, competition.delete)
- [ ] 6.2: Add permission checks to GraphQL resolvers
- [ ] 6.3: Verify ADMIN can delete, STAFF cannot delete

## Phase 7: Testing
- [ ] 7.1: Add unit tests for Fisher-Yates shuffle with seeded random
- [ ] 7.2: Add unit tests for bracket generation with 2-16 participants (odd/even)
- [ ] 7.3: Add unit tests for HOME_AND_AWAY aggregate calculation
- [ ] 7.4: Add unit tests for bye propagation (odd counts)
- [ ] 7.5: Add integration tests for createCompetition → addParticipants → generateBracket → setMatchResult flow
- [ ] 7.6: Add E2E tests for admin CRUD (create competition, add participants, generate bracket, enter results)
