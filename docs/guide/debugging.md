# Debugging

When a CLI test fails, you often want to step through the binary as it runs and inspect the fixture files it operated on. `bintastic` supports both.

## `BINTASTIC_DEBUG` modes

Set `BINTASTIC_DEBUG` to enable the Node inspector and preserve fixtures for inspection instead of tearing them down:

```bash
BINTASTIC_DEBUG=attach npm test  # attach debugger
BINTASTIC_DEBUG=break npm test   # break on first line
```

`attach` runs the binary with `--inspect` so you can connect a debugger while it executes; `break` uses `--inspect-brk` to pause on the first line. In either mode the temp directory is left on disk and its path is logged so you can examine the fixtures after the run.

## `runBinDebug`

To debug a single invocation without setting an environment variable for the whole run, call `runBinDebug` in place of `runBin`:

```ts snippet=run-bin-debug.ts
await runBinDebug('--flag'); // runs with --inspect
```

## VS Code launch configuration

For VS Code, add the following to `.vscode/launch.json` so child processes spawned by the test runner are attached automatically:

```jsonc
{
  "name": "Debug Tests",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
  "runtimeArgs": ["run"],
  "autoAttachChildProcesses": true,
  "console": "integratedTerminal",
}
```
