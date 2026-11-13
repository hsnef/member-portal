// The docs-kit layout check as a test. Written by `docs-kit init`.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL("../", import.meta.url));

test('docs/ follows the docs-kit layout', () => {
  const r = spawnSync(process.execPath, ["node_modules/docs-kit/scripts/docs-kit.mjs", 'check'], { cwd: ROOT, encoding: 'utf8' });
  expect(r.status, r.stdout + r.stderr).toBe(0);
});
