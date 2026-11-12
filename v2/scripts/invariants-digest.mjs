// Prints PASS/FAIL and the canonical invariant digest (seed 1, 1000 samples) for the running engine.
import { verifyInvariants } from '../src/core/index.js';
const r = verifyInvariants({ seed: 1, samples: 1000 });
console.log((r.allPassed ? 'PASS ' : 'FAIL ') + r.digest);
