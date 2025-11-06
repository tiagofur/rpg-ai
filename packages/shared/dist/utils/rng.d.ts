/**
 * Creates a simple deterministic pseudo-random number generator (LCG) that
 * returns floating point numbers between 0 and 1. The generator matches the
 * semantics we need for reproducible dice rolls and attribute shuffles.
 */
export declare function createSeededRng(seed: number): () => number;
export declare function randomIntFromSeed(seed: number, maxExclusive: number): number;
//# sourceMappingURL=rng.d.ts.map