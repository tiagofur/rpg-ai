const UINT32_MAX = 0xffffffff;
const A = 1664525;
const C = 1013904223;

/**
 * Creates a simple deterministic pseudo-random number generator (LCG) that
 * returns floating point numbers between 0 and 1. The generator matches the
 * semantics we need for reproducible dice rolls and attribute shuffles.
 */
export function createSeededRng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (A * state + C) >>> 0;
    return state / UINT32_MAX;
  };
}

export function randomIntFromSeed(seed: number, maxExclusive: number) {
  const rng = createSeededRng(seed);
  return Math.floor(rng() * maxExclusive);
}
