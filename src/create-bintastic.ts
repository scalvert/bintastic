import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaNode, type Options, type ResultPromise } from 'execa';
import BintasticProject from './project';

/**
 * Options shared by every way of configuring bintastic.
 */
interface BintasticOptionsBase<TProject> {
  /**
   * The path to the bin to invoke.
   *
   * When {@link ImportMetaBintasticOptions.importMeta | importMeta} is provided, this is treated as
   * a path relative to the importing module and resolved via
   * `fileURLToPath(new URL(binPath, importMeta.url))`. Otherwise it must be an
   * absolute path (typically pre-resolved by the caller).
   *
   * May also be a function that receives the project and returns the path. The
   * returned value is resolved using the same rule.
   */
  binPath: string | ((project: TProject) => string);
  /**
   * An array of static arguments that will be used every time when running the bin
   */
  staticArgs?: string[];
  /**
   * An optional function to use to create the project. Use this if you want to provide a custom implementation of a BintasticProject.
   */
  createProject?: () => TProject | PromiseLike<TProject>;
}

/**
 * Options where `binPath` is an already-resolved absolute path.
 */
export interface ResolvedBintasticOptions<TProject> extends BintasticOptionsBase<TProject> {
  /**
   * Must be absent. Provide {@link ImportMetaBintasticOptions} to resolve a relative `binPath`.
   */
  importMeta?: undefined;
}

/**
 * Options where `binPath` is relative to the importing module, resolved against `importMeta.url`.
 */
export interface ImportMetaBintasticOptions<TProject> extends BintasticOptionsBase<TProject> {
  /**
   * The `import.meta` of the module configuring bintastic. Used to resolve a
   * relative `binPath` to an absolute path.
   */
  importMeta: ImportMeta;
}

/**
 * Options for configuring bintastic.
 *
 * Either provide an absolute `binPath` ({@link ResolvedBintasticOptions}) or pass
 * `importMeta` alongside a relative `binPath` ({@link ImportMetaBintasticOptions}).
 */
export type BintasticOptions<TProject> =
  | ResolvedBintasticOptions<TProject>
  | ImportMetaBintasticOptions<TProject>;

interface RunOptions {
  /**
   * Arguments to provide to the bin script.
   */
  args: string[];
  /**
   * Options to provide to execa. @see https://github.com/sindresorhus/execa#options
   */
  execaOptions: Options;
}

/**
 * Function signature for running the configured CLI binary.
 */
export interface RunBin {
  /**
   * A runBin implementation that takes no parameters.
   * @returns {*}  {ResultPromise}
   */
  (): ResultPromise;
  /**
   * A runBin implementation that takes string varargs.
   * @param {...RunBinArgs} args
   * @returns {*}  {ResultPromise}
   */
  (...args: [...binArgs: string[]]): ResultPromise;
  /**
   * A runBin implementation that takes an Options object.
   * @param {...RunBinArgs} args
   * @returns {*}  {ResultPromise}
   */
  (...args: [execaOptions: Options]): ResultPromise;
  /**
   * A runBin implementation that takes string or an Options object varargs.
   * @param {...RunBinArgs} args
   * @returns {*}  {ResultPromise}
   */
  (...args: [...binArgs: string[], execaOptions: Options]): ResultPromise;
}

type RunBinArgs = (string | Options)[];

/**
 * Normalizes the debug environment value into a supported debug mode.
 * @param {unknown} value - The configured debug value.
 * @returns {'attach' | 'break' | undefined} The normalized debug mode.
 */
function getDebugMode(value: unknown): 'attach' | 'break' | undefined {
  if (value === undefined || value === false || value === 0) {
    return undefined;
  }

  const normalized = String(value).toLowerCase();
  if (normalized === '0' || normalized === 'false') {
    return undefined;
  }

  return normalized === 'break' ? 'break' : 'attach';
}

/**
 * The result returned by createBintastic.
 */
export interface CreateBintasticResult<TProject extends BintasticProject> {
  /**
   * Runs the configured bin function via execa.
   */
  runBin: RunBin;
  /**
   * Sets up the specified project for use within tests.
   */
  setupProject: () => Promise<TProject>;
  /**
   * Sets up a tmp directory for use within tests.
   */
  setupTmpDir: () => Promise<string>;
  /**
   * Tears the project down, ensuring the tmp directory is removed.
   * When BINTASTIC_DEBUG is set, fixtures are preserved for inspection.
   */
  teardownProject: () => void;
  /**
   * Runs the configured bin with Node inspector enabled in attach mode (--inspect).
   * Set BINTASTIC_DEBUG=break to break on first line instead.
   */
  runBinDebug: RunBin;
}

const DEFAULT_BINTASTIC_OPTIONS = {
  staticArgs: [],
};

/**
 * Parses the arguments provided to runBin
 * @private
 * @param {RunBinArgs} args - The arguments passed to runBin.
 * @returns {RunOptions} Returns an object with args and execaOptions.
 */
function parseArgs(args: RunBinArgs): RunOptions {
  if (args.length > 0 && typeof args[args.length - 1] === 'object') {
    const last = args[args.length - 1] as Options;
    const rest = args.slice(0, -1).filter((a): a is string => typeof a === 'string');
    return {
      args: rest,
      execaOptions: last,
    };
  } else {
    return {
      args: args.filter((a): a is string => typeof a === 'string'),
      execaOptions: {},
    };
  }
}

/**
 * Creates the bintastic API functions to use within tests.
 * @param {BintasticOptions<TProject>} options - An object of bintastic options
 * @returns {CreateBintasticResult<TProject>} - A project instance.
 */
export function createBintastic<TProject extends BintasticProject>(
  options: BintasticOptions<TProject>
): CreateBintasticResult<TProject> {
  let project: TProject | undefined;
  let _preserveFixtures = false;

  const mergedOptions = {
    ...DEFAULT_BINTASTIC_OPTIONS,
    ...options,
  } as BintasticOptions<TProject> & { staticArgs: string[] };

  /**
   * Resolves the configured binPath to an absolute path. Calls binPath when it is
   * a function, then resolves the result relative to importMeta.url when provided.
   * @param {TProject} forProject - The active project, passed to a binPath function.
   * @returns {string} The absolute path to the bin script.
   */
  function resolveBinPath(forProject: TProject): string {
    const rawBinPath =
      typeof mergedOptions.binPath === 'function'
        ? mergedOptions.binPath(forProject)
        : mergedOptions.binPath;

    if (mergedOptions.importMeta) {
      return fileURLToPath(new URL(rawBinPath, mergedOptions.importMeta.url));
    }

    if (!isAbsolute(rawBinPath)) {
      throw new Error(
        '[bintastic] binPath must be an absolute path when importMeta is not provided'
      );
    }

    return rawBinPath;
  }

  /**
   * Shared execution body for runBin and runBinDebug. Parses debug env, sets inspector
   * flags, and updates _preserveFixtures so teardownProject sees debug state correctly.
   * @param {RunOptions} parsedArgs - Already-parsed arguments and execa options.
   * @param {string} binPath - Resolved path to the bin script.
   * @param {'attach' | 'break'} [forcedDebugMode] - Optional debug mode forced by runBinDebug.
   * @returns {ResultPromise} An instance of execa's result promise.
   */
  function _runBinInternal(
    parsedArgs: RunOptions,
    binPath: string,
    forcedDebugMode?: 'attach' | 'break'
  ): ResultPromise {
    if (!project) throw new Error('[bintastic] setupProject() must be called before running a bin');
    const activeProject = project;
    const optionsEnv = parsedArgs.execaOptions.env;
    const configuredDebugMode = optionsEnv?.BINTASTIC_DEBUG ?? process.env.BINTASTIC_DEBUG;
    const debugMode = forcedDebugMode ?? getDebugMode(configuredDebugMode);
    const inheritedNodeOptions = process.execArgv.filter(
      (option) => !option.startsWith('--inspect')
    );
    const nodeOptions = debugMode
      ? [
          ...inheritedNodeOptions,
          ...(debugMode === 'break' ? ['--inspect-brk=0'] : ['--inspect=0']),
        ]
      : inheritedNodeOptions;

    if (debugMode) {
      _preserveFixtures = true;
      console.log(`[bintastic] Debugging enabled. Fixture: ${activeProject.baseDir}`);
    }

    const resolvedCwd = parsedArgs.execaOptions.cwd ?? activeProject.baseDir;

    return execaNode(binPath, [...mergedOptions.staticArgs, ...parsedArgs.args], {
      reject: false,
      cwd: resolvedCwd,
      nodeOptions,
      ...parsedArgs.execaOptions,
      ...(debugMode ? { nodeOptions } : {}),
    });
  }

  /**
   * @param {...RunBinArgs} args - Arguments or execa options.
   * @returns {ResultPromise} An instance of execa's result promise.
   */
  function runBin(...args: RunBinArgs): ResultPromise {
    if (!project) throw new Error('[bintastic] setupProject() must be called before runBin()');
    const parsedArgs = parseArgs(args);
    return _runBinInternal(parsedArgs, resolveBinPath(project));
  }

  /**
   * Runs the configured bin with Node inspector enabled in attach mode (--inspect).
   * @param {...RunBinArgs} args Arguments identical to runBin
   */
  function runBinDebug(...args: RunBinArgs): ResultPromise {
    if (!project) throw new Error('[bintastic] setupProject() must be called before runBinDebug()');
    const parsedArgs = parseArgs(args);
    const debugMode =
      String(process.env.BINTASTIC_DEBUG).toLowerCase() === 'break' ? 'break' : 'attach';
    parsedArgs.execaOptions = {
      ...parsedArgs.execaOptions,
      env: {
        ...parsedArgs.execaOptions.env,
        BINTASTIC_DEBUG: debugMode,
      },
    };
    return _runBinInternal(parsedArgs, resolveBinPath(project), debugMode);
  }

  /**
   * Sets up the specified project for use within tests.
   */
  async function setupProject() {
    const previousProject = project;
    project = undefined;
    _preserveFixtures = false;

    if (previousProject) {
      previousProject.dispose();
    }

    const nextProject =
      typeof mergedOptions.createProject === 'function'
        ? await mergedOptions.createProject()
        : (new BintasticProject() as TProject);

    try {
      await nextProject.write();
    } catch (error) {
      nextProject.dispose();
      throw error;
    }

    project = nextProject;
    return nextProject;
  }

  /**
   * Sets up a tmp directory for use within tests.
   */
  async function setupTmpDir() {
    const activeProject = project ?? (await setupProject());

    return activeProject.baseDir;
  }

  /**
   * Tears the project down, ensuring the tmp directory is removed. Should be paired with setupProject.
   * When BINTASTIC_DEBUG is set, fixtures are preserved for inspection.
   */
  function teardownProject() {
    if (!project)
      throw new Error('[bintastic] setupProject() must be called before teardownProject()');
    const activeProject = project;
    const debugEnv = process.env.BINTASTIC_DEBUG;
    if (_preserveFixtures || (debugEnv && debugEnv !== '0' && debugEnv.toLowerCase() !== 'false')) {
      console.log(`[bintastic] Fixture preserved: ${activeProject.baseDir}`);
      _preserveFixtures = false;
      return;
    }

    activeProject.dispose();
    project = undefined;
  }

  return {
    runBin,
    runBinDebug,
    setupProject,
    teardownProject,
    setupTmpDir,
  };
}
