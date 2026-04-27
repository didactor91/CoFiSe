/**
 * Pure bracket-generation helpers.
 *
 * All functions here are stateless: same inputs → same outputs, no side effects.
 * This makes them trivially unit-testable without mocks.
 *
 * Ported from CSeno/apps/api/src/graphql/brackets.ts
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BracketNodeSpec {
  round: number
  position: number
  teamAName: string | null
  teamBName: string | null
  /** Index into the flat nodes array for the parent node this winner advances to */
  nextNodeIndex: number | null
  /** Which slot (A | B) of the parent node this winner fills */
  nextSlot: 'A' | 'B' | null
  isBye: boolean
  /** Discriminator for double-elimination bracket sections */
  bracketLabel?: 'WINNERS' | 'LOSERS' | 'GRAND_FINAL'
}

export interface MatchSpec {
  participantA: string
  participantB: string
  order: number
  isBye: boolean
}

// ── Power-of-2 sizing ──────────────────────────────────────────────────────────

/**
 * Returns the smallest power of 2 >= n (n > 0).
 */
export function nextPowerOf2(n: number): number {
  if (n <= 0) throw new RangeError('n must be a positive integer')
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Returns the number of bye slots needed so that team count pads to a
 * power-of-2 bracket size.
 */
export function byeCount(teamCount: number): number {
  return nextPowerOf2(teamCount) - teamCount
}

// ── Shuffle ────────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle. Returns a NEW array; original is not mutated.
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Bracket generation ────────────────────────────────────────────────────────

/**
 * Builds the full bracket node specification for a single-elimination (or
 * home/away) tournament.
 */
export function buildBracketNodes(teams: readonly string[], doShuffle = true): BracketNodeSpec[] {
  if (teams.length < 2) {
    throw new RangeError('A bracket requires at least 2 teams')
  }

  const seededTeams = doShuffle ? shuffle(teams) : [...teams]
  const slotCount = nextPowerOf2(seededTeams.length)
  const totalRounds = Math.log2(slotCount)

  // Build empty round structure: round → list of node specs
  const rounds: BracketNodeSpec[][] = []
  for (let r = 1; r <= totalRounds; r++) {
    const nodesInRound = slotCount / Math.pow(2, r - 1)
    rounds.push(
      Array.from({ length: nodesInRound }, (_, pos) => ({
        round: r,
        position: pos + 1,
        teamAName: null,
        teamBName: null,
        nextNodeIndex: null,
        nextSlot: null,
        isBye: false,
      })),
    )
  }

  // Wire up nextNodeIndex and nextSlot for every round except the final
  for (let r = 0; r < totalRounds - 1; r++) {
    for (let pos = 0; pos < rounds[r].length; pos++) {
      const parentPos = Math.floor(pos / 2)
      rounds[r][pos].nextNodeIndex = flatIndex(r + 1, parentPos, rounds)
      rounds[r][pos].nextSlot = pos % 2 === 0 ? 'A' : 'B'
    }
  }

  // Seed round-1 nodes: teams first, then byes at the end
  const round1 = rounds[0]
  for (let i = 0; i < round1.length; i++) {
    const aIdx = i * 2
    const bIdx = i * 2 + 1
    round1[i].teamAName = seededTeams[aIdx] ?? null
    round1[i].teamBName = seededTeams[bIdx] ?? null
    // A node is a bye when teamA exists but teamB is missing
    if (round1[i].teamAName !== null && round1[i].teamBName === null) {
      round1[i].isBye = true
    }
  }

  return rounds.flat()
}

/** Helper: returns the flat array index for a node at (round, positionIndex) */
function flatIndex(roundIndex: number, posIndex: number, rounds: BracketNodeSpec[][]): number {
  let offset = 0
  for (let r = 0; r < roundIndex; r++) {
    offset += rounds[r].length
  }
  return offset + posIndex
}

// ── Double Elimination ────────────────────────────────────────────────────────

/**
 * Builds the full bracket node specification for a double-elimination tournament.
 */
export function buildDoubleElimNodes(
  teams: readonly string[],
  doShuffle = true,
): BracketNodeSpec[] {
  if (teams.length < 2) {
    throw new RangeError('A bracket requires at least 2 teams')
  }

  const seededTeams = doShuffle ? shuffle(teams) : [...teams]
  const slotCount = nextPowerOf2(seededTeams.length)
  const winnersRounds = Math.log2(slotCount)

  // ── Winners bracket ─────────────────────────────────────────────────────────
  const winnersNodes: BracketNodeSpec[] = []
  for (let r = 1; r <= winnersRounds; r++) {
    const nodesInRound = slotCount / Math.pow(2, r)
    for (let pos = 1; pos <= nodesInRound; pos++) {
      const node: BracketNodeSpec = {
        round: r,
        position: pos,
        teamAName: null,
        teamBName: null,
        nextNodeIndex: null,
        nextSlot: null,
        isBye: false,
        bracketLabel: 'WINNERS',
      }
      // Wire to next round
      if (r < winnersRounds) {
        const parentPosIdx = pos - 1
        const nextRoundOffset = Array.from(
          { length: r },
          (_, rr) => slotCount / Math.pow(2, rr + 1),
        ).reduce((a, b) => a + b, 0)
        node.nextNodeIndex = nextRoundOffset + Math.floor(parentPosIdx / 2)
        node.nextSlot = parentPosIdx % 2 === 0 ? 'A' : 'B'
      }
      winnersNodes.push(node)
    }
  }

  // Seed round-1 Winners nodes: teams first, byes at the end
  const round1Winners = winnersNodes.filter((n) => n.round === 1)
  for (let i = 0; i < round1Winners.length; i++) {
    const aIdx = i * 2
    const bIdx = i * 2 + 1
    round1Winners[i].teamAName = seededTeams[aIdx] ?? null
    round1Winners[i].teamBName = seededTeams[bIdx] ?? null
    if (round1Winners[i].teamAName !== null && round1Winners[i].teamBName === null) {
      round1Winners[i].isBye = true
    }
  }

  // ── Losers bracket ─────────────────────────────────────────────────────────
  const losersNodes: BracketNodeSpec[] = []

  for (let wr = 1; wr < winnersRounds; wr++) {
    const dropCount = slotCount / Math.pow(2, wr)
    const nodesInThisLosersRound = dropCount

    for (let pos = 1; pos <= nodesInThisLosersRound; pos++) {
      const node: BracketNodeSpec = {
        round: wr,
        position: pos,
        teamAName: null,
        teamBName: null,
        nextNodeIndex: null,
        nextSlot: null,
        isBye: false,
        bracketLabel: 'LOSERS',
      }

      // Wire to next losers round if not the last
      if (wr < winnersRounds - 1) {
        const nextRoundOffset = losersNodes.length + nodesInThisLosersRound
        const nextPos = Math.floor((pos - 1) / 2)
        node.nextNodeIndex = nextRoundOffset + nextPos
        node.nextSlot = (pos - 1) % 2 === 0 ? 'A' : 'B'
      }

      losersNodes.push(node)
    }
  }

  // ── Grand Final ─────────────────────────────────────────────────────────────
  const grandFinal: BracketNodeSpec = {
    round: winnersRounds + 1,
    position: 1,
    teamAName: null,
    teamBName: null,
    nextNodeIndex: null,
    nextSlot: null,
    isBye: false,
    bracketLabel: 'GRAND_FINAL',
  }

  return [...winnersNodes, ...losersNodes, grandFinal]
}

/**
 * Generates match records from a double-elimination node structure.
 */
export function generateDoubleElimMatches(nodes: BracketNodeSpec[]): MatchSpec[] {
  const matches: MatchSpec[] = []
  let order = 1

  const winners = nodes.filter((n) => n.bracketLabel === 'WINNERS')
  const losers = nodes.filter((n) => n.bracketLabel === 'LOSERS')
  const grandFinal = nodes.filter((n) => n.bracketLabel === 'GRAND_FINAL')

  for (const node of winners) {
    if (node.teamAName !== null && node.teamBName !== null) {
      matches.push({
        participantA: node.teamAName,
        participantB: node.teamBName,
        order: order++,
        isBye: node.isBye,
      })
    }
  }

  for (const node of losers) {
    if (node.teamAName !== null && node.teamBName !== null) {
      matches.push({
        participantA: node.teamAName,
        participantB: node.teamBName,
        order: order++,
        isBye: node.isBye,
      })
    }
  }

  for (const node of grandFinal) {
    if (node.teamAName !== null && node.teamBName !== null) {
      matches.push({
        participantA: node.teamAName,
        participantB: node.teamBName,
        order: order++,
        isBye: false,
      })
    }
  }

  return matches
}

// ── Round Robin ────────────────────────────────────────────────────────────────

/**
 * Builds bracket node specification for a round-robin tournament.
 * For N teams: exactly (N × (N-1)) / 2 matches grouped by round (matchday).
 * No nextNodeIndex — this is a match-based structure, not an elimination tree.
 *
 * Algorithm: For odd n, add a dummy team to make it even, then use the
 * standard circular pairing. This ensures n rounds × (n/2) matches = unique pairs.
 */
export function buildRoundRobinNodes(
  teams: readonly string[],
  doShuffle = true,
): BracketNodeSpec[] {
  if (teams.length < 2) {
    throw new RangeError('A round-robin requires at least 2 teams')
  }

  const seededTeams = doShuffle ? shuffle(teams) : [...teams]
  const n = seededTeams.length

  // For odd n, add a dummy team to make it even
  // We'll filter out matches involving the dummy
  const useDummy = n % 2 === 1
  const totalTeams = useDummy ? n + 1 : n

  const nodes: BracketNodeSpec[] = []

  // Circular algorithm: fix team[0], rotate the rest
  const roundRobinTeams = [...seededTeams]
  const matchups: Array<[string, string]> = []

  // For odd n, add dummy at the end
  if (useDummy) {
    roundRobinTeams.push('__DUMMY__')
  }

  const numRounds = totalTeams - 1
  const matchesPerRound = totalTeams / 2

  if (n % 2 === 0) {
    // Even: n teams, n-1 rounds, each round n/2 matches
    for (let r = 0; r < numRounds; r++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const team1 = roundRobinTeams[i]
        const team2 = roundRobinTeams[totalTeams - 1 - i]
        if (team1 !== team2) {
          matchups.push([team1, team2])
        }
      }
      // Rotate: pop last element and insert after first position
      const last = roundRobinTeams.pop()
      if (last) roundRobinTeams.splice(1, 0, last)
    }
  } else {
    // Odd with dummy: totalTeams is even
    // Same algorithm but we'll filter out dummy matches
    for (let r = 0; r < numRounds; r++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const team1 = roundRobinTeams[i]
        const team2 = roundRobinTeams[totalTeams - 1 - i]
        if (team1 !== team2 && team1 !== '__DUMMY__' && team2 !== '__DUMMY__') {
          matchups.push([team1, team2])
        }
      }
      // Rotate
      const last = roundRobinTeams.pop()
      if (last) roundRobinTeams.splice(1, 0, last)
    }
  }

  // Group matchups by round
  let round = 1
  let idx = 0
  const matchesPerRoundFinal = n % 2 === 0 ? n / 2 : (n - 1) / 2

  while (idx < matchups.length) {
    const roundMatches: Array<[string, string]> = []
    for (let m = 0; m < matchesPerRoundFinal && idx < matchups.length; m++) {
      roundMatches.push(matchups[idx++])
    }

    for (const [teamA, teamB] of roundMatches) {
      nodes.push({
        round,
        position: roundMatches.indexOf([teamA, teamB]) + 1,
        teamAName: teamA,
        teamBName: teamB,
        nextNodeIndex: null,
        nextSlot: null,
        isBye: false,
        bracketLabel: undefined,
      })
    }
    round++
  }

  return nodes
}

/**
 * Generates match records for a round-robin tournament.
 */
export function generateRoundRobinMatches(teams: readonly string[], doShuffle = true): MatchSpec[] {
  const nodes = buildRoundRobinNodes(teams, doShuffle)
  const matches: MatchSpec[] = []
  let order = 1

  const roundGroups = new Map<number, BracketNodeSpec[]>()
  for (const node of nodes) {
    if (!roundGroups.has(node.round)) {
      roundGroups.set(node.round, [])
    }
    roundGroups.get(node.round)?.push(node)
  }

  for (const [_round, roundNodes] of [...roundGroups.entries()].sort((a, b) => a[0] - b[0])) {
    for (const node of roundNodes) {
      if (node.teamAName && node.teamBName) {
        matches.push({
          participantA: node.teamAName,
          participantB: node.teamBName,
          order: order++,
          isBye: false,
        })
      }
    }
  }

  return matches
}

// ── Single Elimination match generation ───────────────────────────────────────

/**
 * Generates match records from a single-elimination bracket node structure.
 */
export function generateSingleElimMatches(nodes: BracketNodeSpec[]): MatchSpec[] {
  const matches: MatchSpec[] = []
  let order = 1

  for (const node of nodes) {
    if (node.teamAName !== null && node.teamBName !== null) {
      matches.push({
        participantA: node.teamAName,
        participantB: node.teamBName,
        order: order++,
        isBye: node.isBye,
      })
    }
  }

  return matches
}

// ── Auto-advancement helpers ───────────────────────────────────────────────────

/**
 * Determines whether a match in a SINGLE_ELIMINATION bracket has a clear
 * winner based on scores alone (scoreA !== scoreB).
 */
export function hasClearWinner(scoreA: number, scoreB: number): boolean {
  return scoreA !== scoreB
}

/**
 * Returns the winning team name from a bracket node's current match result.
 * Returns null if it's a tie (needs admin decision for HOME_AWAY format).
 */
export function resolveWinnerName(
  teamAName: string | null,
  teamBName: string | null,
  scoreA: number,
  scoreB: number,
  winnerId: string | null,
): string | null {
  if (winnerId !== null) {
    return winnerId === 'A' ? teamAName : winnerId === 'B' ? teamBName : null
  }
  if (scoreA > scoreB) return teamAName
  if (scoreB > scoreA) return teamBName
  return null
}
