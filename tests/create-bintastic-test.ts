import { existsSync, realpathSync } from 'node:fs';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { createBintastic, BintasticProject } from '../src';

const originalCwd = process.cwd();
const created: BintasticProject[] = [];

beforeEach(() => {
  // Each test sets its own process-level Debug mode.
  vi.stubEnv('BINTASTIC_DEBUG', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  for (const project of created) project.dispose();
  created.length = 0;
});

/**
 * A createProject factory that records every Project so afterEach can remove preserved ones.
 * @returns {BintasticProject} A new, unwritten Project.
 */
function tracked(): BintasticProject {
  const project = new BintasticProject();
  created.push(project);
  return project;
}

/**
 * Creates bintastic for a fixture Bin under tests/fixtures, with tracked Projects.
 * @param {string} bin - The fixture file name.
 * @param {string[]} staticArgs - Static args for every Run.
 * @returns {ReturnType<typeof createBintastic<BintasticProject>>} The bintastic functions.
 */
function bintasticFor(bin: string, staticArgs?: string[]) {
  return createBintastic({
    importMeta: import.meta,
    binPath: `fixtures/${bin}`,
    staticArgs,
    createProject: tracked,
  });
}

/**
 * Reads the Node flags a print-exec-argv Run was started with.
 * @param {{ stdout: unknown }} result - The Run result.
 * @param {unknown} result.stdout - The Bin's stdout, a JSON array of flags.
 * @returns {string[]} The Bin's process.execArgv.
 */
function execArgvOf(result: { stdout: unknown }): string[] {
  return JSON.parse(String(result.stdout));
}

describe('createBintastic', () => {
  test('returns the public functions', () => {
    const bintastic = createBintastic({ binPath: './foo' });

    expect(new Set(Object.keys(bintastic))).toEqual(
      new Set(['runBin', 'runBinDebug', 'setupProject', 'setupTmpDir', 'teardownProject'])
    );
  });

  describe('Project lifecycle', () => {
    test('setupProject writes a default BintasticProject', async () => {
      const { setupProject, teardownProject } = createBintastic({ binPath: './foo' });

      const project = await setupProject();

      expect(project).toBeInstanceOf(BintasticProject);
      expect(existsSync(project.baseDir)).toEqual(true);
      teardownProject();
    });

    class FakeProject extends BintasticProject {}
    const fake = () => {
      const project = new FakeProject();
      created.push(project);
      return project;
    };

    test.each<[string, () => FakeProject | Promise<FakeProject>]>([
      ['an async', async () => fake()],
      ['a synchronous', fake],
    ])('setupProject uses %s createProject factory', async (_label, createProject) => {
      const { setupProject } = createBintastic({ binPath: './foo', createProject });

      expect(await setupProject()).toBeInstanceOf(FakeProject);
    });

    test('teardownProject removes the Project and invalidates it', async () => {
      const { setupProject, teardownProject, runBin, runBinDebug } = bintasticFor('fake-bin.js');
      const project = await setupProject();

      teardownProject();

      expect(existsSync(project.baseDir)).toEqual(false);
      expect(() => runBin()).toThrow('[bintastic] setupProject() must be called before runBin()');
      expect(() => runBinDebug()).toThrow(
        '[bintastic] setupProject() must be called before runBinDebug()'
      );
    });

    test('teardownProject is a no-op when idle', async () => {
      const { setupProject, teardownProject } = bintasticFor('fake-bin.js');

      expect(() => teardownProject()).not.toThrow();

      await setupProject();
      teardownProject();

      expect(() => teardownProject()).not.toThrow();
    });

    test('teardownProject restores the cwd from project.chdir()', async () => {
      const { setupProject, teardownProject } = bintasticFor('fake-bin.js');
      const project = await setupProject();
      await project.chdir();

      teardownProject();

      expect(realpathSync(process.cwd())).toEqual(realpathSync(originalCwd));
    });

    test('setupProject over an active Project tears the old one down', async () => {
      const { setupProject } = bintasticFor('fake-bin.js');
      const first = await setupProject();

      await setupProject();

      expect(existsSync(first.baseDir)).toEqual(false);
    });

    test('a Project that fails to write is removed and nothing becomes active', async () => {
      let brokenDir = '';
      const { setupProject, runBin } = createBintastic({
        binPath: './foo',
        createProject: () => {
          const project = new (class extends BintasticProject {
            async write(): Promise<void> {
              throw new Error('disk full');
            }
          })();
          // baseDir is created lazily; touch it so the tmp dir exists, as after a partial write.
          brokenDir = project.baseDir;
          return project;
        },
      });

      await expect(setupProject()).rejects.toThrow('disk full');

      expect(existsSync(brokenDir)).toEqual(false);
      expect(() => runBin()).toThrow('[bintastic] setupProject() must be called before runBin()');
    });

    test('setupTmpDir sets up a Project when idle and reuses the active one', async () => {
      const { setupProject, setupTmpDir } = bintasticFor('fake-bin.js');

      const tmpDir = await setupTmpDir();
      expect(existsSync(tmpDir)).toEqual(true);
      expect(await setupTmpDir()).toEqual(tmpDir);

      const project = await setupProject();
      expect(await setupTmpDir()).toEqual(project.baseDir);
    });
  });

  describe('Preserved Project', () => {
    test('a Debug mode Run preserves the Project and releases it at teardown', async () => {
      const { setupProject, teardownProject, runBinDebug } = bintasticFor('print-exec-argv.js');
      const project = await setupProject();
      await project.chdir();

      await runBinDebug();
      teardownProject();

      expect(existsSync(project.baseDir)).toEqual(true);
      expect(realpathSync(process.cwd())).toEqual(realpathSync(originalCwd));
      expect(() => runBinDebug()).toThrow(
        '[bintastic] setupProject() must be called before runBinDebug()'
      );
    });

    test('a Run whose own env turns on Debug mode preserves the Project', async () => {
      const { setupProject, teardownProject, runBin } = bintasticFor('print-exec-argv.js');
      const project = await setupProject();

      const result = await runBin({ env: { BINTASTIC_DEBUG: 'attach' } });
      teardownProject();

      expect(execArgvOf(result)).toContain('--inspect=0');
      expect(existsSync(project.baseDir)).toEqual(true);
    });

    test('runBinDebug does not change process.env', async () => {
      const { setupProject, runBinDebug } = bintasticFor('print-exec-argv.js');
      await setupProject();

      await runBinDebug();

      expect(process.env.BINTASTIC_DEBUG).toBeUndefined();
    });

    test('BINTASTIC_DEBUG at teardown preserves a Project with no Runs', async () => {
      const { setupProject, teardownProject } = bintasticFor('fake-bin.js');
      const project = await setupProject();

      vi.stubEnv('BINTASTIC_DEBUG', 'attach');
      teardownProject();

      expect(existsSync(project.baseDir)).toEqual(true);
    });

    test('a disabled BINTASTIC_DEBUG does not preserve the Project', async () => {
      vi.stubEnv('BINTASTIC_DEBUG', '');
      const { setupProject, teardownProject } = bintasticFor('fake-bin.js');
      const project = await setupProject();

      teardownProject();

      expect(existsSync(project.baseDir)).toEqual(false);
    });

    test("a Run's own env cannot stop its Project being preserved", async () => {
      vi.stubEnv('BINTASTIC_DEBUG', 'attach');
      const { setupProject, teardownProject, runBin } = bintasticFor('print-exec-argv.js');
      const project = await setupProject();

      const result = await runBin({ env: { BINTASTIC_DEBUG: 'false' } });
      teardownProject();

      expect(execArgvOf(result).some((flag) => flag.startsWith('--inspect'))).toEqual(false);
      expect(existsSync(project.baseDir)).toEqual(true);
    });

    test('setupProject over an active Project in Debug mode preserves the old one', async () => {
      vi.stubEnv('BINTASTIC_DEBUG', 'attach');
      const { setupProject } = bintasticFor('fake-bin.js');
      const first = await setupProject();

      await setupProject();

      expect(existsSync(first.baseDir)).toEqual(true);
    });

    test('setupProject after a Debug mode Run preserves the old Project', async () => {
      const { setupProject, runBinDebug } = bintasticFor('print-exec-argv.js');
      const first = await setupProject();
      await runBinDebug();

      await setupProject();

      expect(existsSync(first.baseDir)).toEqual(true);
    });

    test('a Preserved Project survives the next setup, and preservation does not carry over', async () => {
      const { setupProject, teardownProject, runBinDebug } = bintasticFor('print-exec-argv.js');
      const preserved = await setupProject();
      await runBinDebug();
      teardownProject();

      const next = await setupProject();
      expect(existsSync(preserved.baseDir)).toEqual(true);

      teardownProject();
      expect(existsSync(next.baseDir)).toEqual(false);
    });

    test('logs the Project path at its first Debug mode Run and again at teardown', async () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { setupProject, teardownProject, runBinDebug } = bintasticFor('print-exec-argv.js');

      const first = await setupProject();
      await runBinDebug();
      await runBinDebug();
      teardownProject();

      const second = await setupProject();
      await runBinDebug();

      expect(log.mock.calls.map(([message]) => message)).toEqual([
        `[bintastic] Debugging enabled. Fixture: ${first.baseDir}`,
        `[bintastic] Fixture preserved: ${first.baseDir}`,
        `[bintastic] Debugging enabled. Fixture: ${second.baseDir}`,
      ]);
    });
  });

  describe('Runs', () => {
    test('passes static args, then call args, to the Bin', async () => {
      const { setupProject, runBin } = bintasticFor('fake-bin.js', ['--static', 'true']);
      await setupProject();

      const result = await runBin('--with', 'some', '--arguments');

      expect(result.stdout).toMatchInlineSnapshot(
        "\"I am a bin who takes args [ '--static', 'true', '--with', 'some', '--arguments' ]\""
      );
    });

    test('runs the Bin in the Project so it can read fixture files', async () => {
      const { setupProject, runBin } = bintasticFor('read-fixture.mjs');
      const project = await setupProject();
      await project.write({ nested: { 'input.txt': 'fixture content' } });

      const result = await runBin();

      expect(JSON.parse(String(result.stdout))).toEqual({
        cwd: project.baseDir,
        content: 'fixture content',
      });
    });

    test('passes execa options, including env, to the Bin', async () => {
      const { setupProject, runBin } = bintasticFor('fake-bin-with-env.js');
      await setupProject();

      const result = await runBin('--flag', { env: { BINTASTIC: 'true', NODE_OPTIONS: '' } });

      expect(result.stderr).toEqual('');
      expect(result.stdout).toEqual('I am an env var true');
    });

    test('runBinDebug starts the Bin under the inspector', async () => {
      const { setupProject, runBinDebug } = bintasticFor('print-exec-argv.js');
      await setupProject();

      const result = await runBinDebug();

      expect(execArgvOf(result)).toContain('--inspect=0');
    });
  });
});
