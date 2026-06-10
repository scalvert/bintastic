# Getting Started

Testing a CLI isn't like testing a library—you can't just import functions and call them. You need to spawn your CLI as a subprocess, give it real files to work with, and capture its output. `bintastic` simplifies this: it creates a temporary project directory, runs your binary against it as a real subprocess, and hands back the exit code, stdout, and stderr for assertion.

::: tip Formerly `@scalvert/bin-tester`
This package was previously published as `@scalvert/bin-tester`.
:::

## Install

```bash
npm add bintastic --save-dev
```

## Quick start

Point `bintastic` at your binary, set up a project before each test, and run the bin against fixture files:

```ts snippet=basic-example.ts
import { createBintastic } from 'bintastic';

describe('my-cli', () => {
  const { setupProject, teardownProject, runBin } = createBintastic({
    importMeta: import.meta,
    binPath: './bin/my-cli.js', // resolved relative to this test module
  });

  let project;

  beforeEach(async () => {
    project = await setupProject();
  });

  afterEach(() => {
    teardownProject();
  });

  test('processes files', async () => {
    await project.write({ 'input.txt': 'hello' });

    const result = await runBin('input.txt');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('processed');
  });
});
```

`setupProject` creates a fresh temp directory, `project.write()` writes the fixtures your CLI should see, `runBin` executes the binary against them, and `teardownProject` cleans up.

From here, see [Usage](./usage) for the full set of options and helpers, [Debugging](./debugging) for inspecting failing runs, and the [API Reference](/api/) for generated type documentation.
