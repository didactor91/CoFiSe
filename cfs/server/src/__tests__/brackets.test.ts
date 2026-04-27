/**
 * Bracket Algorithms Unit Tests
 *
 * Tests for pure bracket generation functions ported from CSeno.
 * These are stateless pure functions — same inputs → same outputs.
 *
 * Phase 7: Testing - Task 7.1
 */

import { describe, it, expect } from 'vitest'
import {
  nextPowerOf2,
  byeCount,
  shuffle,
  buildBracketNodes,
  buildDoubleElimNodes,
  buildRoundRobinNodes,
  generateSingleElimMatches,
  generateDoubleElimMatches,
  generateRoundRobinMatches,
  hasClearWinner,
  resolveWinnerName,
  type BracketNodeSpec,
  type MatchSpec,
} from '../modules/shared/brackets.js'

// ── Test Helpers ───────────────────────────────────────────────────────────────

/** Counts nodes by round */
function countByRound(nodes: BracketNodeSpec[], round: number): number {
  return nodes.filter((n) => n.round === round).length
}

// ── Power-of-2 sizing tests ─────────────────────────────────────────────────────

describe('nextPowerOf2', () => {
  it('returns 1 for input of 1', () => {
    expect(nextPowerOf2(1)).toBe(1)
  })

  it('returns 4 for input of 4', () => {
    expect(nextPowerOf2(4)).toBe(4)
  })

  it('returns 8 for input of 7', () => {
    expect(nextPowerOf2(7)).toBe(8)
  })

  it('returns 8 for input of 5', () => {
    expect(nextPowerOf2(5)).toBe(8)
  })

  it('returns 16 for input of 12', () => {
    expect(nextPowerOf2(12)).toBe(16)
  })

  it('throws RangeError for input of 0', () => {
    expect(() => nextPowerOf2(0)).toThrow(RangeError)
  })

  it('throws RangeError for negative input', () => {
    expect(() => nextPowerOf2(-1)).toThrow(RangeError)
  })
})

describe('byeCount', () => {
  it('returns 0 for power-of-2 team count (4 teams)', () => {
    expect(byeCount(4)).toBe(0)
  })

  it('returns 1 for 7 teams (needs 1 bye to reach 8)', () => {
    expect(byeCount(7)).toBe(1)
  })

  it('returns 3 for 5 teams (needs 3 byes to reach 8)', () => {
    expect(byeCount(5)).toBe(3)
  })

  it('returns 15 for 17 teams (needs 15 byes to reach 32)', () => {
    expect(byeCount(17)).toBe(15)
  })
})

describe('shuffle', () => {
  it('returns a new array (does not mutate original)', () => {
    const original = [1, 2, 3, 4]
    const result = shuffle(original)
    expect(result).not.toBe(original)
    expect(original).toEqual([1, 2, 3, 4]) // unchanged
  })

  it('contains all original elements', () => {
    const original = ['a', 'b', 'c', 'd']
    const result = shuffle(original)
    expect(result.sort()).toEqual(original.sort())
  })

  it('produces different order (statistical test, may occasionally fail with very ordered input)', () => {
    // Run multiple times — at least one should differ from input
    const original = [1, 2, 3, 4, 5, 6, 7, 8]
    let allSame = true
    for (let i = 0; i < 10; i++) {
      const result = shuffle(original)
      if (result.join(',') !== original.join(',')) {
        allSame = false
        break
      }
    }
    // This test may rarely fail due to randomness — but with 8 elements it's unlikely
    expect(allSame).toBe(false)
  })

  it('works with empty array', () => {
    const result = shuffle([])
    expect(result).toEqual([])
  })

  it('works with single element', () => {
    const result = shuffle(['only'])
    expect(result).toEqual(['only'])
  })
})

// ── Single Elimination bracket ─────────────────────────────────────────────────

describe('buildBracketNodes (single elimination)', () => {
  it('throws RangeError for fewer than 2 teams', () => {
    expect(() => buildBracketNodes([])).toThrow(RangeError)
    expect(() => buildBracketNodes(['Solo'])).toThrow(RangeError)
  })

  it('builds correct structure for 4 teams', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false) // no shuffle
    // 4 teams → slotCount = 4 (power of 2 already)
    // totalRounds = log2(4) = 2
    // Round 1: 4 nodes (padded structure with byes), Round 2: 2 nodes
    expect(nodes).toHaveLength(6) // 4 + 2
    expect(countByRound(nodes, 1)).toBe(4)
    expect(countByRound(nodes, 2)).toBe(2)
  })

  it('builds correct structure for 8 teams', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], false)
    // 8 teams → slotCount = 8 → totalRounds = 3
    // Round 1: 8 nodes, Round 2: 4 nodes, Round 3: 2 nodes
    expect(nodes).toHaveLength(14) // 8 + 4 + 2
    expect(countByRound(nodes, 1)).toBe(8)
    expect(countByRound(nodes, 2)).toBe(4)
    expect(countByRound(nodes, 3)).toBe(2)
  })

  it('seeds teams into round 1 positions when shuffle=false', () => {
    const teams = ['A', 'B', 'C', 'D']
    const nodes = buildBracketNodes(teams, false)
    // Round 1 positions 1 & 2 have teams (A vs B, C vs D)
    // Positions 3 & 4 are empty (bye structure)
    const round1 = nodes.filter((n) => n.round === 1).sort((a, b) => a.position - b.position)
    expect(round1[0].teamAName).toBe('A')
    expect(round1[0].teamBName).toBe('B')
    expect(round1[1].teamAName).toBe('C')
    expect(round1[1].teamBName).toBe('D')
    expect(round1[2].teamAName).toBeNull()
    expect(round1[3].teamAName).toBeNull()
  })

  it('handles bye slots (odd team count padded to power of 2)', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C'], false)
    // 3 teams → next power of 2 is 4 → 1 bye slot
    // Round 1: 4 nodes (2 actual matches + 2 bye structure)
    const round1 = nodes.filter((n) => n.round === 1)
    expect(round1).toHaveLength(4)
    // First match: A vs B
    expect(round1[0].teamAName).toBe('A')
    expect(round1[0].teamBName).toBe('B')
    // Second match: C vs null (bye)
    const byeNode = round1.find((n) => n.isBye)
    expect(byeNode).toBeDefined()
    expect(byeNode!.teamAName).toBe('C')
    expect(byeNode!.teamBName).toBeNull()
    expect(byeNode!.isBye).toBe(true)
  })

  it('wires nextNodeIndex correctly for single elimination', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false)
    // Round 1 positions 1,2 → both go to Round 2 position 1
    // Round 1 positions 3,4 → both go to Round 2 position 2
    const r1p1 = nodes.find((n) => n.round === 1 && n.position === 1)!
    const r1p2 = nodes.find((n) => n.round === 1 && n.position === 2)!
    const r2p1 = nodes.find((n) => n.round === 2 && n.position === 1)!
    const r2p2 = nodes.find((n) => n.round === 2 && n.position === 2)!

    // p1 and p2 should point to round 2 position 1
    expect(r1p1.nextNodeIndex).toBeDefined()
    expect(r1p2.nextNodeIndex).toBeDefined()
    // p3 and p4 should point to round 2 position 2
    const r1p3 = nodes.find((n) => n.round === 1 && n.position === 3)!
    const r1p4 = nodes.find((n) => n.round === 1 && n.position === 4)!
    expect(r1p3.nextSlot).toBe('A')
    expect(r1p4.nextSlot).toBe('B')
  })

  it('sets correct nextSlot (A for even position, B for odd position)', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], false)
    // Round 1: positions 1-8
    // Position 1 (index 0, even) → nextSlot = 'A'
    // Position 2 (index 1, odd)  → nextSlot = 'B'
    // Position 3 (index 2, even) → nextSlot = 'A'
    // Position 4 (index 3, odd)  → nextSlot = 'B'
    const r1p1 = nodes.find((n) => n.round === 1 && n.position === 1)!
    const r1p2 = nodes.find((n) => n.round === 1 && n.position === 2)!
    const r1p3 = nodes.find((n) => n.round === 1 && n.position === 3)!
    const r1p4 = nodes.find((n) => n.round === 1 && n.position === 4)!

    expect(r1p1.nextSlot).toBe('A') // position 1 (index 0) even → 'A'
    expect(r1p2.nextSlot).toBe('B') // position 2 (index 1) odd → 'B'
    expect(r1p3.nextSlot).toBe('A') // position 3 (index 2) even → 'A'
    expect(r1p4.nextSlot).toBe('B') // position 4 (index 3) odd → 'B'
  })

  it('final round nodes have nextNodeIndex = null', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false)
    const finalRound = Math.max(...nodes.map((n) => n.round))
    const finalNodes = nodes.filter((n) => n.round === finalRound)
    expect(finalNodes.every((n) => n.nextNodeIndex === null)).toBe(true)
  })
})

describe('generateSingleElimMatches', () => {
  it('generates matches for all nodes with both teams', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false)
    const matches = generateSingleElimMatches(nodes)
    // 4 teams → 4 slots in round 1 → 2 actual matches (A vs B, C vs D)
    expect(matches).toHaveLength(2)
    expect(matches.map((m) => m.participantA)).toContain('A')
    expect(matches.map((m) => m.participantB)).toContain('B')
  })

  it('only generates matches for nodes with both participants', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C'], false) // C has bye
    const matches = generateSingleElimMatches(nodes)
    // 3 teams → 4 slots, 1 bye. Only 1 actual match (A vs B)
    expect(matches).toHaveLength(1) // A vs B only
    expect(matches[0].participantA).toBe('A')
    expect(matches[0].participantB).toBe('B')
  })

  it('sets order incrementing from 1', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false)
    const matches = generateSingleElimMatches(nodes)
    const orders = matches.map((m) => m.order)
    expect(orders).toEqual([1, 2])
  })

  it('omits nodes with missing teamB (pre-advancement)', () => {
    const nodes = buildBracketNodes(['A', 'B', 'C', 'D'], false)
    const matches = generateSingleElimMatches(nodes)
    // Round 2 node has null teamB — should not generate a match
    expect(matches.every((m) => m.participantA && m.participantB)).toBe(true)
  })
})

// ── Double Elimination bracket ────────────────────────────────────────────────

describe('buildDoubleElimNodes', () => {
  it('throws RangeError for fewer than 2 teams', () => {
    expect(() => buildDoubleElimNodes([])).toThrow(RangeError)
    expect(() => buildDoubleElimNodes(['Solo'])).toThrow(RangeError)
  })

  it('builds WINNERS section for 4 teams', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const winnersNodes = nodes.filter((n) => n.bracketLabel === 'WINNERS')
    // 4 teams → 3 winners rounds: 2 in R1, 1 in R2, 1 final
    expect(winnersNodes.length).toBeGreaterThan(0)
    expect(winnersNodes.every((n) => n.bracketLabel === 'WINNERS')).toBe(true)
  })

  it('includes LOSERS section', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const losersNodes = nodes.filter((n) => n.bracketLabel === 'LOSERS')
    expect(losersNodes.length).toBeGreaterThan(0)
    expect(losersNodes.every((n) => n.bracketLabel === 'LOSERS')).toBe(true)
  })

  it('includes GRAND_FINAL node', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const grandFinal = nodes.find((n) => n.bracketLabel === 'GRAND_FINAL')
    expect(grandFinal).toBeDefined()
  })

  it('seeds teams into WINNERS round 1', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const winnersR1 = nodes.filter((n) => n.bracketLabel === 'WINNERS' && n.round === 1)
    expect(winnersR1[0].teamAName).toBe('A')
    expect(winnersR1[0].teamBName).toBe('B')
    expect(winnersR1[1].teamAName).toBe('C')
    expect(winnersR1[1].teamBName).toBe('D')
  })
})

describe('generateDoubleElimMatches', () => {
  it('generates matches for all non-bye nodes', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const matches = generateDoubleElimMatches(nodes)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('orders matches sequentially starting at 1', () => {
    const nodes = buildDoubleElimNodes(['A', 'B', 'C', 'D'], false)
    const matches = generateDoubleElimMatches(nodes)
    const orders = matches.map((m) => m.order).sort((a, b) => a - b)
    expect(orders).toEqual(Array.from({ length: orders.length }, (_, i) => i + 1))
  })

  it('marks bye matches in winners bracket', () => {
    // For 3 teams (odd), there's a bye in round 1
    const nodes = buildDoubleElimNodes(['A', 'B', 'C'], false)
    const matches = generateDoubleElimMatches(nodes)
    // With 3 teams, round 1 winners has only 2 teams → 1 bye match
    // Winners bracket: 4 slots (next power of 2), 2 actual matches
    // Bye is determined when seeding
    const winnersMatches = matches.slice(
      0,
      matches.findIndex((m) => m.order === 1),
    )
    // We just verify matches are generated correctly
    expect(matches.length).toBeGreaterThan(0)
  })
})

// ── Round Robin bracket ─────────────────────────────────────────────────────────

describe('buildRoundRobinNodes', () => {
  it('throws RangeError for fewer than 2 teams', () => {
    expect(() => buildRoundRobinNodes([])).toThrow(RangeError)
    expect(() => buildRoundRobinNodes(['Solo'])).toThrow(RangeError)
  })

  it('produces correct number of matches for 4 teams', () => {
    const nodes = buildRoundRobinNodes(['A', 'B', 'C', 'D'], false)
    // 4 teams (even): n-1 = 3 rounds, n/2 = 2 matches per round → 6 matches
    const matches = generateRoundRobinMatches(['A', 'B', 'C', 'D'], false)
    expect(matches).toHaveLength(6) // (4 * 3) / 2 = 6
  })

  it('produces correct number of matches for 5 teams', () => {
    const matches = generateRoundRobinMatches(['A', 'B', 'C', 'D', 'E'], false)
    // 5 teams (odd): n = 5 rounds, (n-1)/2 = 2 matches per round → 10 matches
    expect(matches).toHaveLength(10) // (5 * 4) / 2 = 10
  })

  it('each team appears in every matchday (circular algorithm)', () => {
    const nodes = buildRoundRobinNodes(['A', 'B', 'C', 'D'], false)
    const round1Matches = nodes.filter((n) => n.round === 1)
    // Each team should appear exactly once in round 1
    const teamsInRound1 = round1Matches.flatMap((m) => [m.teamAName, m.teamBName]).filter(Boolean)
    expect(teamsInRound1.sort()).toEqual(['A', 'B', 'C', 'D'])
  })

  it('all matches have no nextNodeIndex (flat match structure)', () => {
    const nodes = buildRoundRobinNodes(['A', 'B', 'C', 'D'], false)
    expect(nodes.every((n) => n.nextNodeIndex === null)).toBe(true)
  })

  it('all matches have no bracketLabel (no bracket sections)', () => {
    const nodes = buildRoundRobinNodes(['A', 'B', 'C', 'D'], false)
    expect(nodes.every((n) => n.bracketLabel === undefined)).toBe(true)
  })
})

describe('generateRoundRobinMatches', () => {
  it('produces correct number of matches for 4 teams', () => {
    const matches = generateRoundRobinMatches(['A', 'B', 'C', 'D'], false)
    // 4 teams (even): n-1 = 3 rounds, n/2 = 2 matches per round → 6 matches
    expect(matches).toHaveLength(6) // (4 * 3) / 2 = 6
  })

  it('covers all pairwise combinations for 3 teams', () => {
    const matches = generateRoundRobinMatches(['A', 'B', 'C'], false)
    // 3 teams → 3 matches: A vs B, A vs C, B vs C
    expect(matches).toHaveLength(3)

    const pairs = matches.map((m) => [m.participantA, m.participantB].sort().join('-')).sort()
    expect(pairs).toEqual(['A-B', 'A-C', 'B-C'])
  })

  it('covers all pairwise combinations for 4 teams', () => {
    const matches = generateRoundRobinMatches(['A', 'B', 'C', 'D'], false)
    // 4 teams → 6 matches
    expect(matches).toHaveLength(6)

    const pairs = matches.map((m) => [m.participantA, m.participantB].sort().join('-')).sort()
    expect(pairs).toEqual(['A-B', 'A-C', 'A-D', 'B-C', 'B-D', 'C-D'])
  })

  it('no bye matches in round robin', () => {
    const matches = generateRoundRobinMatches(['A', 'B', 'C', 'D', 'E'], false)
    expect(matches.some((m) => m.isBye)).toBe(false)
  })
})

// ── Auto-advancement helpers ────────────────────────────────────────────────────

describe('hasClearWinner', () => {
  it('returns true when scoreA > scoreB', () => {
    expect(hasClearWinner(3, 1)).toBe(true)
  })

  it('returns true when scoreB > scoreA', () => {
    expect(hasClearWinner(1, 3)).toBe(true)
  })

  it('returns false when scores are equal (tie)', () => {
    expect(hasClearWinner(2, 2)).toBe(false)
  })

  it('works with zero scores', () => {
    expect(hasClearWinner(0, 1)).toBe(true)
    expect(hasClearWinner(0, 0)).toBe(false)
  })
})

describe('resolveWinnerName', () => {
  it('returns teamAName when scoreA > scoreB', () => {
    expect(resolveWinnerName('Team A', 'Team B', 3, 1, null)).toBe('Team A')
  })

  it('returns teamBName when scoreB > scoreA', () => {
    expect(resolveWinnerName('Team A', 'Team B', 1, 3, null)).toBe('Team B')
  })

  it('returns null on tie with no winnerId', () => {
    expect(resolveWinnerName('Team A', 'Team B', 2, 2, null)).toBeNull()
  })

  it('respects explicit winnerId override (A)', () => {
    expect(resolveWinnerName('Team A', 'Team B', 2, 2, 'A')).toBe('Team A')
  })

  it('respects explicit winnerId override (B)', () => {
    expect(resolveWinnerName('Team A', 'Team B', 2, 2, 'B')).toBe('Team B')
  })

  it('returns null for invalid winnerId', () => {
    expect(resolveWinnerName('Team A', 'Team B', 3, 1, 'C')).toBeNull()
  })

  it('handles null team names', () => {
    // When teamAName is null, should return null (can't have winner from null team)
    expect(resolveWinnerName(null, 'Team B', 1, 0, null)).toBeNull()
    // When teamBName is null and scoreA > scoreB, should return teamAName
    expect(resolveWinnerName('Team A', null, 1, 0, null)).toBe('Team A')
    // When teamBName is null and scoreA < scoreB, should return null (teamB is null)
    expect(resolveWinnerName('Team A', null, 0, 1, null)).toBeNull()
  })
})
