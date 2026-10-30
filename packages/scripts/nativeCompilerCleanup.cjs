// Existing test fixtures return projects to their callers. Keep them alive for
// the whole test, then close every native session even when an assertion fails.
const constructors = new Set([
  require("../common/src/typescript/NativeCompilerSession.ts").NativeCompilerSession,
  require("@ts-morph/common").NativeCompilerSession,
]);
const sessions = new Set();
const sharedSessions = new Set();
let inTest = false;
const originals = new Map();
for (const constructor of constructors) {
  const parse = constructor.prototype.parse;
  originals.set(constructor, parse);
  constructor.prototype.parse = function (...args) {
    if (!sharedSessions.has(this))
      (inTest ? sessions : sharedSessions).add(this);
    return Reflect.apply(parse, this, args);
  };
}

exports.mochaHooks = {
  beforeEach() { inTest = true; },
  afterEach() {
    const errors = [];
    for (const session of sessions) {
      try { session.dispose(); } catch (error) { errors.push(error); }
    }
    sessions.clear();
    inTest = false;
    if (errors.length > 0)
      throw new AggregateError(errors, "Failed to close native test sessions.");
  },
  afterAll() {
    for (const session of sharedSessions) session.dispose();
    sharedSessions.clear();
    for (const [constructor, parse] of originals)
      constructor.prototype.parse = parse;
  },
};
