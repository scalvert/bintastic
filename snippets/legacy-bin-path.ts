import { fileURLToPath } from 'node:url';

// Without `importMeta`, `binPath` must be an absolute path. Pre-resolve it yourself:
const { setupProject, teardownProject, runBin } = createBintastic({
  binPath: fileURLToPath(new URL('./bin/my-cli.js', import.meta.url)),
});
