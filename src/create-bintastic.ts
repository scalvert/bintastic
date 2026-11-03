import { execaNode, type Options, type ResultPromise } from 'execa';
import BintasticProject from './project';
import { planRun, resolveDebugMode, type RunBinArgs } from './run-plan';

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
  ResolvedBintasticOptions<TProject> | ImportMetaBintasticOptions<TProject>;

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
   * Tears the project down: restores the cwd from `project.chdir()` and removes the tmp directory.
   * In debug mode (`runBinDebug` or `BINTASTIC_DEBUG`) the directory is kept on disk and its path
   * logged. Safe to call when no project is active.
   */
  teardownProject: () => void;
  /**
   * Runs the configured bin with Node inspector enabled in attach mode (--inspect).
   * Set BINTASTIC_DEBUG=break to break on first line instead.
   */
  runBinDebug: RunBin;
}

/**
 * Creates the bintastic API functions to use within tests.
 *
 * The returned functions share one active Project. It is idle until `setupProject`,
 * active until `teardownProject`, and preserved at teardown when any Run against it
 * was in Debug mode or `BINTASTIC_DEBUG` is on in the process env.
 * @param {BintasticOptions<TProject>} options - An object of bintastic options
 * @returns {CreateBintasticResult<TProject>} - A project instance.
 */
export function createBintastic<TProject extends BintasticProject>(
  options: BintasticOptions<TProject>
): CreateBintasticResult<TProject> {
  const createProject =
    typeof options.createProject === 'function'
      ? options.createProject
      : () => new BintasticProject() as TProject;

  let active: TProject | undefined;
  let preserved = false;

  /**
   * Releases the active Project: restores cwd, then removes the directory unless the
   * Project is preserved. A no-op when idle.
   */
  function teardownProject(): void {
    const project = active;
    const keep = preserved || resolveDebugMode({ env: process.env }) !== undefined;
    active = undefined;
    preserved = false;

    if (!project) {
      return;
    }

    if (keep) {
      project.restoreCwd();
      console.log(`[bintastic] Fixture preserved: ${project.baseDir}`);
      return;
    }

    project.dispose();
  }

  /**
   * Tears down any active Project, then creates, writes, and activates a new one.
   * @returns {Promise<TProject>} The new active Project.
   */
  async function setupProject(): Promise<TProject> {
    teardownProject();

    const project = await createProject();

    try {
      await project.write();
    } catch (error) {
      project.dispose();
      throw error;
    }

    active = project;
    return project;
  }

  /**
   * Plans and starts a Run against the active Project. The first Debug mode Run marks
   * the Project as preserved and logs its path.
   * @param {string} caller - The public function name used in the error message.
   * @param {RunBinArgs} args - Arguments or execa options.
   * @param {boolean} forceDebug - True for runBinDebug.
   * @returns {ResultPromise} An instance of execa's result promise.
   */
  function run(caller: string, args: RunBinArgs, forceDebug: boolean): ResultPromise {
    const project = active;
    if (!project) {
      throw new Error(`[bintastic] setupProject() must be called before ${caller}()`);
    }

    const plan = planRun({
      config: options,
      project,
      args,
      forceDebug,
      env: process.env,
      execArgv: process.execArgv,
    });

    if (!preserved && plan.debugMode) {
      preserved = true;
      console.log(`[bintastic] Debugging enabled. Fixture: ${project.baseDir}`);
    }

    return execaNode(plan.file, plan.args, plan.options);
  }

  /**
   * @param {...RunBinArgs} args - Arguments or execa options.
   * @returns {ResultPromise} An instance of execa's result promise.
   */
  function runBin(...args: RunBinArgs): ResultPromise {
    return run('runBin', args, false);
  }

  /**
   * Runs the configured bin with Node inspector enabled in attach mode (--inspect).
   * @param {...RunBinArgs} args Arguments identical to runBin
   */
  function runBinDebug(...args: RunBinArgs): ResultPromise {
    return run('runBinDebug', args, true);
  }

  /**
   * Sets up a tmp directory for use within tests.
   */
  async function setupTmpDir() {
    const project = active ?? (await setupProject());

    return project.baseDir;
  }

  return {
    runBin,
    runBinDebug,
    setupProject,
    teardownProject,
    setupTmpDir,
  };
}
