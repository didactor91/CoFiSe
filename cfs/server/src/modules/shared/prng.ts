/**
 * Pseudo-Random Number Generator (PRNG) Utilities
 * 
 * Provides both:
 * 1. Crypto-based PRNG for production (cryptographically secure)
 * 2. Seeded PRNG for deterministic testing
 */

/**
 * Crypto-based random number generator (production use)
 * Uses crypto.getRandomValues() for cryptographically secure random numbers
 */
export function cryptoRandom(): () => number {
  return () => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] / (4294967296) // Normalize to [0, 1)
  }
}

/**
 * Seeded Linear Congruential Generator (LCG) for deterministic randomness
 * Used in tests when deterministic behavior is required
 * 
 * @param seed - Initial seed value
 * @returns PRNG function that produces deterministic sequence
 */
export function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * Fisher-Yates shuffle using provided RNG function
 * 
 * @param array - Array to shuffle (will be mutated!)
 * @param rng - Random number generator function returning [0, 1)
 */
export function shuffleWith<T>(array: T[], rng: () => number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Fisher-Yates shuffle using crypto random (production default)
 */
export function shuffle<T>(array: T[]): T[] {
  return shuffleWith(array, cryptoRandom())
}
