import { statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';
import { createBintastic, BintasticProject, json, text } from '../src';

class FakeProject extends BintasticProject {}

describe('createBintastic', () => {
  test('should return object with specific properties from createBintastic', () => {
    const { runBin, setupProject, setupTmpDir, teardownProject } = createBintastic({
      binPath: './foo',
    });

    expect(runBin).toBeTypeOf('function');
    expect(setupProject).toBeTypeOf('function');
    expect(setupTmpDir).toBeTypeOf('function');
    expect(teardownProject).toBeTypeOf('function');
  });

  test('setupTmpDir should return a tmpDir that points to a tmp dir path', async () => {
    const { setupTmpDir } = createBintastic({
      binPath: './foo',
    });

    const tmp = await setupTmpDir();

    expect(statSync(tmp).isDirectory()).toEqual(true);
  });

  test('setupProject should return a default project', async () => {
    const { setupProject } = createBintastic({
      binPath: './foo',
    });

    const project = await setupProject();

    expect(project).toBeInstanceOf(BintasticProject);
  });

  test('setupProject should return a custom project', async () => {
    const { setupProject } = createBintastic({
      binPath: './foo',
      createProject: async () => new FakeProject(),
    });

    const project = await setupProject();

    expect(project).toBeInstanceOf(FakeProject);
  });

  test('teardownProject should result in the project being disposed of', async () => {
    const { setupProject, teardownProject } = createBintastic({
      binPath: './foo',
    });

    const project = await setupProject();

    expect(project).toBeInstanceOf(BintasticProject);

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBin can run the configured bin script', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/fake-bin.js', import.meta.url)),
    });

    const project = await setupProject();

    const result = await runBin();

    expect(result.stdout).toMatchInlineSnapshot('"I am a bin who takes args []"');

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBin can run the configured bin script dynamically', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: (p) => {
        expect(p).toEqual(project);
        return fileURLToPath(new URL('fixtures/fake-bin.js', import.meta.url));
      },
    });

    const project = await setupProject();

    const result = await runBin();

    expect(result.stdout).toMatchInlineSnapshot('"I am a bin who takes args []"');

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBin can run the configured bin script with static arguments', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/fake-bin.js', import.meta.url)),
      staticArgs: ['--static', 'true'],
    });

    const project = await setupProject();

    const result = await runBin('--with', 'some', '--arguments');

    expect(result.stdout).toMatchInlineSnapshot(
      "\"I am a bin who takes args [ '--static', 'true', '--with', 'some', '--arguments' ]\""
    );

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBin can run the configured bin script with arguments', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/fake-bin.js', import.meta.url)),
    });

    const project = await setupProject();

    const result = await runBin('--with', 'some', '--arguments');

    expect(result.stdout).toMatchInlineSnapshot(
      "\"I am a bin who takes args [ '--with', 'some', '--arguments' ]\""
    );

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBin can run the configured bin script with arguments and execa options', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/fake-bin-with-env.js', import.meta.url)),
    });

    const project = await setupProject();

    const result = await runBin('--with', 'some', '--arguments', {
      env: {
        BINTASTIC: true,
        BINTASTIC_DEBUG: 'false',
        NODE_OPTIONS: '',
      },
    });

    expect(result.stderr).toMatchInlineSnapshot('""');
    expect(result.stdout).toMatchInlineSnapshot('"I am an env var true"');

    teardownProject();

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('BINTASTIC_DEBUG env toggles inspector flags passed to child', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/print-exec-argv.js', import.meta.url)),
    });

    const project = await setupProject();

    try {
      process.env.BINTASTIC_DEBUG = 'attach';

      const result = await runBin({});

      const execArgv = JSON.parse(result.stdout);

      expect(Array.isArray(execArgv)).toEqual(true);
      expect(execArgv.find((a: string) => a.startsWith('--inspect'))).toBeTypeOf('string');

      // First teardown while debug is active — should preserve
      teardownProject();
      expect(existsSync(project.baseDir)).toEqual(true);
    } finally {
      delete process.env.BINTASTIC_DEBUG;
      // Second teardown with debug cleared — should dispose
      teardownProject();
    }

    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBinDebug enables inspector flags without global env change', async () => {
    const { setupProject, teardownProject, runBinDebug } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/print-exec-argv.js', import.meta.url)),
    });

    const project = await setupProject();

    const before = process.env.BINTASTIC_DEBUG;
    expect(before).toBeUndefined();

    const result = await runBinDebug({});
    const execArgv = JSON.parse(result.stdout);
    expect(execArgv.find((a: string) => a.startsWith('--inspect'))).toBeTypeOf('string');
    expect(process.env.BINTASTIC_DEBUG).toBeUndefined();

    // First teardown: runBinDebug activated debug mode, so fixtures are preserved
    teardownProject();
    expect(existsSync(project.baseDir)).toEqual(true);

    // Second teardown with no debug active: should dispose
    teardownProject();
    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('runBinDebug preserves tmp dir on teardown without process.env mutation (CHK-005)', async () => {
    const { setupProject, teardownProject, runBinDebug } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/print-exec-argv.js', import.meta.url)),
    });

    const project = await setupProject();

    expect(process.env.BINTASTIC_DEBUG).toBeUndefined();

    await runBinDebug({});

    // process.env must remain unset — runBinDebug should not mutate it
    expect(process.env.BINTASTIC_DEBUG).toBeUndefined();

    teardownProject();

    // Because runBinDebug activated debug mode via execa env, teardownProject must preserve fixtures
    expect(existsSync(project.baseDir)).toEqual(true);

    // Second teardown (with no debug active) should clean up
    project.dispose();
    expect(existsSync(project.baseDir)).toEqual(false);
  });

  test('setupProject called twice disposes the first project directory', async () => {
    const { setupProject, teardownProject } = createBintastic({
      binPath: './foo',
    });

    const firstProject = await setupProject();
    const firstBaseDir = firstProject.baseDir;

    await setupProject();

    expect(existsSync(firstBaseDir)).toEqual(false);

    teardownProject();
  });

  test('BINTASTIC_DEBUG preserves tmp dir on teardown', async () => {
    const { setupProject, teardownProject, runBin } = createBintastic({
      binPath: fileURLToPath(new URL('fixtures/fake-bin.js', import.meta.url)),
    });

    const project = await setupProject();

    try {
      process.env.BINTASTIC_DEBUG = 'attach';
      await runBin();

      teardownProject();

      // With DEBUG set, the directory should still exist
      expect(existsSync(project.baseDir)).toEqual(true);
    } finally {
      delete process.env.BINTASTIC_DEBUG;
      teardownProject();
    }

    expect(existsSync(project.baseDir)).toEqual(false);
  });
});

describe('json', () => {
  test('stringifies JSON template content', () => {
    expect(json`{ "foo": "bar" }`).toEqual('{"foo":"bar"}');
  });

  test('serializes interpolated values as JSON', () => {
    expect(
      json`{ "name": ${'test'}, "nested": ${{ enabled: true }}, "items": ${['a', 'b']} }`
    ).toEqual('{"name":"test","nested":{"enabled":true},"items":["a","b"]}');
  });

  test('throws when template content is not valid JSON', () => {
    expect(() => json`{ foo: "bar" }`).toThrow(SyntaxError);
  });

  test('throws when an interpolated value is not JSON-serializable', () => {
    expect(() => json`{ "value": ${undefined} }`).toThrow(
      '[bintastic] json template values must be JSON-serializable'
    );
  });
});

describe('text', () => {
  test('dedents text template content', () => {
    expect(text`
      export function main() {
        console.log('hello');
      }
    `).toEqual("export function main() {\n  console.log('hello');\n}");
  });

  test('preserves intentional blank lines inside content', () => {
    expect(text`
      # Title

      Body text.
    `).toEqual('# Title\n\nBody text.');
  });

  test('serializes interpolated values as text', () => {
    const name = 'fixture';

    expect(text`
      export const name = '${name}';
    `).toEqual("export const name = 'fixture';");
  });
});
