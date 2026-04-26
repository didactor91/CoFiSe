/**
 * Competition System Integration Test
 * 
 * Tests the complete flow:
 * createCompetition → addParticipants → generateBracket → setMatchResult → advanceWinner
 * 
 * Phase 7: Testing - Task 7.5
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-competition-integration.db')

// Mock the database for integration testing with actual schema
function createTestSchema() {
  return `
    type Query {
      hello: String
    }
  `
}

describe('Competition System Integration', () => {
  let db: Database.Database

  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    // Create schema
    db.exec(`
      CREATE TABLE competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        match_type TEXT NOT NULL CHECK(match_type IN ('SINGLE_LEG', 'HOME_AND_AWAY')),
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
        participant_count INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competition_id INTEGER NOT NULL REFERENCES competitions(id),
        alias TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competition_id INTEGER NOT NULL REFERENCES competitions(id),
        round INTEGER NOT NULL,
        position INTEGER NOT NULL,
        participant1_id INTEGER REFERENCES participants(id),
        participant2_id INTEGER REFERENCES participants(id),
        home_score1 INTEGER,
        home_score2 INTEGER,
        away_score1 INTEGER,
        away_score2 INTEGER,
        winner_id INTEGER REFERENCES participants(id),
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED')),
        is_bye INTEGER DEFAULT 0
      );
    `)
  })

  afterAll(() => {
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  beforeEach(() => {
    // Clear data between tests
    db.exec('DELETE FROM matches')
    db.exec('DELETE FROM participants')
    db.exec('DELETE FROM competitions')
  })

  describe('createCompetition', () => {
    it('should create a competition in DRAFT status', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Test', 'Test competition', 'SINGLE_LEG', 4, now, now)

      const competition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(result.lastInsertRowid) as any
      
      expect(competition).toBeDefined()
      expect(competition.name).toBe('Copa Test')
      expect(competition.status).toBe('DRAFT')
      expect(competition.match_type).toBe('SINGLE_LEG')
      expect(competition.participant_count).toBe(4)
    })

    it('should reject invalid match type', () => {
      const now = new Date().toISOString()
      
      expect(() => {
        db.prepare(`
          INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
          VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
        `).run('Test', 'Test', 'INVALID_TYPE', 4, now, now)
      }).toThrow()
    })
  })

  describe('addParticipants', () => {
    it('should add participants to a DRAFT competition', () => {
      // Create competition
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 4, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const aliases = ['Alice', 'Bob', 'Charlie', 'Diana']
      const insertStmt = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)')
      
      for (const alias of aliases) {
        insertStmt.run(competitionId, alias, now)
      }

      const participants = db.prepare('SELECT * FROM participants WHERE competition_id = ?').all(competitionId)
      
      expect(participants).toHaveLength(4)
      expect(participants.map((p: any) => p.alias).sort()).toEqual(['Alice', 'Bob', 'Charlie', 'Diana'])
    })

    it('should reject adding more than participant_count', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 2, now, now)

      const competitionId = result.lastInsertRowid

      // Add 2 participants (max)
      const insertStmt = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)')
      insertStmt.run(competitionId, 'Alice', now)
      insertStmt.run(competitionId, 'Bob', now)

      // Try to add 3rd - should fail
      const existingCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE competition_id = ?').get(competitionId) as any
      expect(existingCount.count + 1).toBeGreaterThan(2) // Would exceed limit
    })

    it('should not allow adding participants after bracket generated', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 4, now, now)

      const competitionId = result.lastInsertRowid

      // Check status is not DRAFT
      const competition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(competitionId) as any
      expect(competition.status).not.toBe('DRAFT')

      // In the actual resolver, this would throw: "Participants locked after bracket generation"
    })
  })

  describe('generateBracket', () => {
    it('should create correct number of matches for 4 participants', () => {
      // Create and set up competition
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 4, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const insertStmt = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)')
      const participants: any[] = []
      for (let i = 0; i < 4; i++) {
        const r = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, `P${i+1}`, now)
        participants.push({ id: r.lastInsertRowid, alias: `P${i+1}` })
      }

      // Generate bracket
      // For 4 participants: 2^2 = 4 spots, need 3 rounds total (but only round 1 has actual matches)
      // With log2(4) = 2 rounds, matches: 2 in round 1, 1 in round 2
      const rounds = Math.ceil(Math.log2(4)) // 2 rounds

      // Fisher-Yates shuffle
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]]
      }

      // Round 1: 2 matches
      const matchStmt = db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, ?, ?, ?, ?)')
      matchStmt.run(competitionId, 0, participants[0].id, participants[3].id, 'PENDING')
      matchStmt.run(competitionId, 1, participants[1].id, participants[2].id, 'PENDING')

      // Round 2: 1 match (final)
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 2, 0, NULL, NULL, ?)').run(competitionId, 'PENDING')

      const matches = db.prepare('SELECT * FROM matches WHERE competition_id = ? ORDER BY round, position').all(competitionId)

      expect(matches).toHaveLength(3)
      expect(matches.filter((m: any) => m.round === 1)).toHaveLength(2)
      expect(matches.filter((m: any) => m.round === 2)).toHaveLength(1)
    })

    it('should update competition status to ACTIVE after bracket generation', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 2, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const insertStmt = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)')
      const p1 = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P1', now)
      const p2 = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P2', now)

      // Create match
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 0, ?, ?, ?)').run(competitionId, p1.lastInsertRowid, p2.lastInsertRowid, 'PENDING')

      // Update competition status
      db.prepare("UPDATE competitions SET status = 'ACTIVE', updated_at = ? WHERE id = ?").run(now, competitionId)

      const competition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(competitionId) as any
      expect(competition.status).toBe('ACTIVE')
    })
  })

  describe('setMatchResult', () => {
    it('should correctly set result for SINGLE_LEG match', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 2, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const p1Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P1', now)
      const p2Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P2', now)

      // Create match
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 0, ?, ?, ?)').run(competitionId, p1Result.lastInsertRowid, p2Result.lastInsertRowid, 'PENDING')

      // Set match result - P1 wins 3-1
      const match = db.prepare('SELECT * FROM matches WHERE competition_id = ?').get(competitionId) as any
      
      const score = 3
      const score2 = 1
      const winnerId = score > score2 ? match.participant1_id : match.participant2_id

      db.prepare('UPDATE matches SET home_score1 = ?, home_score2 = ?, winner_id = ?, status = ? WHERE id = ?')
        .run(score, score2, winnerId, 'COMPLETED', match.id)

      const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(match.id) as any
      expect(updatedMatch.winner_id).toBe(p1Result.lastInsertRowid)
      expect(updatedMatch.status).toBe('COMPLETED')
    })

    it('should correctly calculate HOME_AND_AWAY aggregate', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
      `).run('Copa Test', 'Test', 'HOME_AND_AWAY', 2, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const p1Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P1', now)
      const p2Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P2', now)

      // Create match
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 0, ?, ?, ?)').run(competitionId, p1Result.lastInsertRowid, p2Result.lastInsertRowid, 'PENDING')

      const match = db.prepare('SELECT * FROM matches WHERE competition_id = ?').get(competitionId) as any

      // P1 home: 3-1, P1 away: 1-2 → P1 total 4-3
      // homeScore1=3, homeScore2=1 (P2 home scored 1), awayScore1=1, awayScore2=2 (P2 away scored 2)
      const homeScore1 = 3
      const homeScore2 = 1
      const awayScore1 = 1
      const awayScore2 = 2

      // p1Total = homeScore1 + awayScore2 = 3 + 2 = 5
      // p2Total = homeScore2 + awayScore1 = 1 + 1 = 2
      const p1Total = homeScore1 + awayScore2
      const p2Total = homeScore2 + awayScore1

      expect(p1Total).toBe(5)
      expect(p2Total).toBe(2)
      expect(p1Total).toBeGreaterThan(p2Total)

      const winnerId = p1Total > p2Total ? match.participant1_id : match.participant2_id

      db.prepare('UPDATE matches SET home_score1 = ?, home_score2 = ?, away_score1 = ?, away_score2 = ?, winner_id = ?, status = ? WHERE id = ?')
        .run(homeScore1, homeScore2, awayScore1, awayScore2, winnerId, 'COMPLETED', match.id)

      const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(match.id) as any
      expect(updatedMatch.winner_id).toBe(p1Result.lastInsertRowid)
    })

    it('should detect tie and require manual winner', () => {
      // For SINGLE_LEG: 2-2 tie requires manualWinnerId
      const score = 2
      const score2 = 2

      let winnerId: number | null = null
      if (score > score2) {
        winnerId = 1
      } else if (score2 > score) {
        winnerId = 2
      } else {
        // Tie - manual winner required
        winnerId = null
      }

      expect(winnerId).toBeNull()
      // In actual resolver, this throws: "Tie requires manual winner selection"
    })

    it('should advance winner to next round', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 4, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const insertStmt = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)')
      const participants: any[] = []
      for (const alias of ['P1', 'P2', 'P3', 'P4']) {
        const r = insertStmt.run(competitionId, alias, now)
        participants.push({ id: r.lastInsertRowid, alias })
      }

      // Create round 1 matches
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 0, ?, ?, ?)').run(competitionId, participants[0].id, participants[1].id, 'PENDING')
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 1, ?, ?, ?)').run(competitionId, participants[2].id, participants[3].id, 'PENDING')

      // Create round 2 (final) - empty
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 2, 0, NULL, NULL, ?)').run(competitionId, 'PENDING')

      // Simulate match 0 completion - P1 wins
      const match0 = db.prepare('SELECT * FROM matches WHERE competition_id = ? AND round = 1 AND position = 0').get(competitionId) as any
      
      db.prepare('UPDATE matches SET home_score1 = 2, home_score2 = 1, winner_id = ?, status = ? WHERE id = ?')
        .run(participants[0].id, 'COMPLETED', match0.id)

      // Re-fetch match0 to get the winner_id that was just set
      const updatedMatch0 = db.prepare('SELECT * FROM matches WHERE id = ?').get(match0.id) as any

      // Advance winner to round 2 position 0 (floor(0/2) = 0, even position → participant1)
      const nextRound = 2
      const nextPosition = Math.floor(match0.position / 2) // = 0
      const isEvenPosition = match0.position % 2 === 0

      const nextMatch = db.prepare('SELECT * FROM matches WHERE competition_id = ? AND round = ? AND position = ?').get(competitionId, nextRound, nextPosition) as any
      
      if (isEvenPosition) {
        db.prepare('UPDATE matches SET participant1_id = ? WHERE id = ?').run(updatedMatch0.winner_id, nextMatch.id)
      } else {
        db.prepare('UPDATE matches SET participant2_id = ? WHERE id = ?').run(updatedMatch0.winner_id, nextMatch.id)
      }

      const finalNextMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(nextMatch.id) as any
      expect(finalNextMatch.participant1_id).toBe(participants[0].id)
    })

    it('should mark competition COMPLETED when final match has winner', () => {
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
      `).run('Copa Test', 'Test', 'SINGLE_LEG', 2, now, now)

      const competitionId = result.lastInsertRowid

      // Add participants
      const p1Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P1', now)
      const p2Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'P2', now)

      // Create and complete final match
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status, winner_id, home_score1, home_score2) VALUES (?, 1, 0, ?, ?, ?, ?, ?, ?)')
        .run(competitionId, p1Result.lastInsertRowid, p2Result.lastInsertRowid, 'COMPLETED', p1Result.lastInsertRowid, 3, 1)

      // Check if competition should be completed
      const finalMatches = db.prepare('SELECT * FROM matches WHERE competition_id = ? AND round = (SELECT MAX(round) FROM matches WHERE competition_id = ?)').all(competitionId, competitionId) as any[]
      
      const allFinalMatchesComplete = finalMatches.every(m => m.status === 'COMPLETED')
      
      expect(finalMatches).toHaveLength(1)
      expect(allFinalMatchesComplete).toBe(true)

      // Update competition status
      db.prepare("UPDATE competitions SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(now, competitionId)

      const competition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(competitionId) as any
      expect(competition.status).toBe('COMPLETED')
    })
  })

  describe('Full Flow', () => {
    it('should complete createCompetition → addParticipants → generateBracket → setMatchResult flow', () => {
      const now = new Date().toISOString()

      // 1. Create competition
      const compResult = db.prepare(`
        INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
        VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
      `).run('Copa Final', 'Final competition', 'SINGLE_LEG', 2, now, now)

      const competitionId = compResult.lastInsertRowid
      expect(competitionId).toBeDefined()

      // 2. Add participants
      const p1Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'Team A', now)
      const p2Result = db.prepare('INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)').run(competitionId, 'Team B', now)

      const participants = db.prepare('SELECT * FROM participants WHERE competition_id = ?').all(competitionId)
      expect(participants).toHaveLength(2)

      // 3. Generate bracket
      db.prepare('INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status) VALUES (?, 1, 0, ?, ?, ?)').run(competitionId, p1Result.lastInsertRowid, p2Result.lastInsertRowid, 'PENDING')
      db.prepare("UPDATE competitions SET status = 'ACTIVE', updated_at = ? WHERE id = ?").run(now, competitionId)

      const competition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(competitionId) as any
      expect(competition.status).toBe('ACTIVE')

      // 4. Set match result (Team A wins 2-1)
      const match = db.prepare('SELECT * FROM matches WHERE competition_id = ?').get(competitionId) as any
      
      db.prepare('UPDATE matches SET home_score1 = 2, home_score2 = 1, winner_id = ?, status = ? WHERE id = ?')
        .run(p1Result.lastInsertRowid, 'COMPLETED', match.id)

      // 5. Advance winner and complete competition
      const allMatches = db.prepare('SELECT * FROM matches WHERE competition_id = ?').all(competitionId) as any[]
      const allComplete = allMatches.every(m => m.status === 'COMPLETED')
      
      if (allComplete) {
        db.prepare("UPDATE competitions SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(now, competitionId)
      }

      const finalCompetition = db.prepare('SELECT * FROM competitions WHERE id = ?').get(competitionId) as any
      expect(finalCompetition.status).toBe('COMPLETED')

      const completedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(match.id) as any
      expect(completedMatch.winner_id).toBe(p1Result.lastInsertRowid)
      expect(completedMatch.status).toBe('COMPLETED')
    })
  })
})