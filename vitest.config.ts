import fs from 'fs';

import { defineConfig } from 'vitest/config';

/**
 * Per-machine test timeout. On hosts with slow fsync (small VMs, network
 * disks) the SQLite-backed tests exceed vitest's 5s default without being
 * wrong. Set NANOCLAW_TEST_TIMEOUT_MS in the environment or in the
 * (untracked) .env to raise the test and hook timeouts on that machine only.
 */
function testTimeoutMs(): number | undefined {
  let raw = process.env.NANOCLAW_TEST_TIMEOUT_MS;
  if (raw === undefined && fs.existsSync('.env')) {
    raw = fs
      .readFileSync('.env', 'utf8')
      .match(/^NANOCLAW_TEST_TIMEOUT_MS=\s*["']?(\d+)/m)?.[1];
  }
  const ms = Number(raw);
  return Number.isInteger(ms) && ms > 0 ? ms : undefined;
}

const timeout = testTimeoutMs();

export default defineConfig({
  test: {
    setupFiles: ['src/test-setup.ts'],
    ...(timeout && { testTimeout: timeout, hookTimeout: timeout }),
    // container/agent-runner tests run under Bun (they depend on bun:sqlite).
    // See container/agent-runner/package.json "test" script.
    // container/*.test.ts: top-level only — container/agent-runner tests run
    // under Bun (they depend on bun:sqlite) and must not be picked up here.
    include: [
      'src/**/*.test.ts',
      'setup/**/*.test.ts',
      'scripts/**/*.test.ts',
      'container/*.test.ts',
      // A gateway skill's own scripts, tested where they live. NOT its
      // `payload/` — those files import as if already installed under `src/`,
      // so they only resolve once the skill has been applied, and the skill
      // runs them itself as its `nc:run effect:test` step.
      '.claude/skills/*/scripts/**/*.test.ts',
    ],
  },
});
