








## v4.1.0 (2026-05-29)

#### :rocket: Enhancement

- [#301](https://github.com/scalvert/bintastic/pull/301) feat: add fixture template helpers ([@scalvert](https://github.com/scalvert))

#### Committers: 1

- Steve Calvert ([@scalvert](https://github.com/scalvert))



## v4.0.2 (2026-03-08)

#### :bug: Bug Fix

- [#267](https://github.com/scalvert/bintastic/pull/267) fix: runBin/runBinDebug/teardown refactor (CHK-005, CHK-006, CHK-007) ([@scalvert](https://github.com/scalvert))
- [#266](https://github.com/scalvert/bintastic/pull/266) fix: dispose previous project on double setupProject call (CHK-004) ([@scalvert](https://github.com/scalvert))
- [#265](https://github.com/scalvert/bintastic/pull/265) fix: replace unsafe type casts with accurate types (CHK-002, CHK-003) ([@scalvert](https://github.com/scalvert))
- [#264](https://github.com/scalvert/bintastic/pull/264) fix: remove no-op write() override from BintasticProject (CHK-008) ([@scalvert](https://github.com/scalvert))
- [#263](https://github.com/scalvert/bintastic/pull/263) fix: remove TProject generic shadowing in binPath (CHK-001) ([@scalvert](https://github.com/scalvert))

#### Committers: 1

- Steve Calvert ([@scalvert](https://github.com/scalvert))



## v4.0.1 (2026-01-07)

#### :bug: Bug Fix
* [#248](https://github.com/scalvert/bintastic/pull/248) Fix BintasticProject.write() signature and re-export dependency types ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v4.0.0 (2026-01-04)

#### :boom: Breaking Change
* [#247](https://github.com/scalvert/bintastic/pull/247) Rename package from testdrive to bintastic ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v3.0.0 (2026-01-04)

#### :boom: Breaking Change
* [#246](https://github.com/scalvert/bintastic/pull/246) Rename package from @scalvert/bin-tester to testdrive ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v3.0.0 (2026-01-04)

#### :boom: Breaking Change
* [#243](https://github.com/scalvert/bin-tester/pull/243) feat: Upgrade execa from v5 to v9 ([@scalvert](https://github.com/scalvert))
* [#229](https://github.com/scalvert/bin-tester/pull/229) feat: Add debugging support for bin testing ([@scalvert](https://github.com/scalvert))
* [#227](https://github.com/scalvert/bin-tester/pull/227) fix: Fixes CI and removes lower node versions ([@scalvert](https://github.com/scalvert))
* [#226](https://github.com/scalvert/bin-tester/pull/226) Updating package to latest node version, package versions.  ([@scalvert](https://github.com/scalvert))

#### :rocket: Enhancement
* [#229](https://github.com/scalvert/bin-tester/pull/229) feat: Add debugging support for bin testing ([@scalvert](https://github.com/scalvert))

#### :memo: Documentation
* [#231](https://github.com/scalvert/bin-tester/pull/231) docs: Add TypeDoc API documentation and markdown-code for snippet sync ([@scalvert](https://github.com/scalvert))
* [#230](https://github.com/scalvert/bin-tester/pull/230) docs: Simplify README structure ([@scalvert](https://github.com/scalvert))

#### :house: Internal
* [#245](https://github.com/scalvert/bin-tester/pull/245) ci: Replace volta and setup-node with mise-action ([@scalvert](https://github.com/scalvert))
* [#244](https://github.com/scalvert/bin-tester/pull/244) docs: Add CLAUDE.md for Claude Code guidance ([@scalvert](https://github.com/scalvert))
* [#242](https://github.com/scalvert/bin-tester/pull/242) chore(deps): Update dev dependencies to latest major versions ([@scalvert](https://github.com/scalvert))
* [#233](https://github.com/scalvert/bin-tester/pull/233) chore: Add format commands and improve lint script ([@scalvert](https://github.com/scalvert))
* [#232](https://github.com/scalvert/bin-tester/pull/232) chore: Switch from pnpm to npm and volta to mise ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v2.1.1 (2022-04-26)

#### :bug: Bug Fix
* [#46](https://github.com/scalvert/bin-tester/pull/46) Fixes runBin TS signature to accommodate optional execa.Options ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v2.1.0 (2022-04-19)

#### :rocket: Enhancement
* [#41](https://github.com/scalvert/bin-tester/pull/41) Adds support for Node 12 ([@scalvert](https://github.com/scalvert))
* [#40](https://github.com/scalvert/bin-tester/pull/40) Adds support for supplying a binPath dynamically ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v2.0.0 (2022-04-18)

#### :boom: Breaking Change
* [#37](https://github.com/scalvert/bin-tester/pull/37) Upgrades fixturify-project to v5.x ([@scalvert](https://github.com/scalvert))

#### :bug: Bug Fix
* [#29](https://github.com/scalvert/bin-tester/pull/29) Removes unused option (was deprecated before 1.0.0) ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v1.0.0 (2022-03-28)

#### :boom: Breaking Change
* [#16](https://github.com/scalvert/bin-tester/pull/16) Update type for createProject to be async ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v0.3.0 (2022-03-18)

#### :boom: Breaking Change
* [#6](https://github.com/scalvert/bin-tester/pull/6) API improvements and refactoring. ([@scalvert](https://github.com/scalvert))

#### :house: Internal
* [#7](https://github.com/scalvert/bin-tester/pull/7) Update README generator ([@scalvert](https://github.com/scalvert))

#### Committers: 1
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v0.0.5 (2022-03-11)


## v0.0.4 (2022-03-10)


## v0.0.3 (2022-03-10)


## v0.0.2 (2022-03-10)


## v0.0.1 (2022-03-10)


# Changelog
