import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRootEnv = resolve(__dirname, '../../../.env');

if (existsSync(monorepoRootEnv)) {
  config({ path: monorepoRootEnv });
}
