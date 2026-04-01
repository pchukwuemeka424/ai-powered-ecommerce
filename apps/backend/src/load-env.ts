import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, '../../../.env');
const backendEnv = resolve(__dirname, '../../.env');

if (existsSync(monorepoRoot)) {
  config({ path: monorepoRoot });
}
if (existsSync(backendEnv)) {
  config({ path: backendEnv, override: true });
}
