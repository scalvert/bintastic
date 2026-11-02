# bintastic

A test harness for Node.js CLI tools: it builds a throwaway fixture directory, runs a CLI inside it as a subprocess, and hands back the output for assertions.

## Language

**Bin**:
The Node.js CLI script under test.
_Avoid_: binary, executable, command

**Project**:
The temporary fixture directory, and its files, that a Bin runs against.
_Avoid_: tmp dir, fixture dir, workspace

**Run**:
One invocation of the Bin as a subprocess against a Project.
_Avoid_: execution, spawn, call

**Debug mode**:
A Run where the Bin starts under the Node inspector, either attaching or breaking on the first line. Set per Run by `runBinDebug` or `BINTASTIC_DEBUG`, with a Run's own `env` taking precedence over the process env; unset, empty, `0`, and `false` mean off.
_Avoid_: inspect mode, debugging

**Preserved Project**:
A Project that is kept on disk at teardown instead of removed. A Project is preserved when any Run against it was in Debug mode, or when `BINTASTIC_DEBUG` is on in the process env at teardown. A Run's own `env` cannot stop its Project being preserved.
_Avoid_: kept fixture, leftover dir
