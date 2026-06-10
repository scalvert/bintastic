const { setupProject, teardownProject, runBin } = createBintastic({
  importMeta: import.meta,
  binPath: './bin/my-cli.js', // resolved relative to this module
  staticArgs: ['--verbose'], // args passed to every invocation
});
