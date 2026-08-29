import { execa, type ResultPromise } from 'execa';
import { Project } from 'fixturify-project';

export default class BintasticProject extends Project {
  private _previousCwd: string | undefined;

  /**
   * Constructs an instance of a BintasticProject.
   * @param {string} name - The name of the project. Used within the package.json as the name property.
   * @param {string} version - The version of the project. Used within the package.json as the version property.
   * @param {Function} cb - An optional callback for additional setup steps after the project is constructed.
   */
  constructor(name = 'fake-project', version?: string, cb?: (project: Project) => void) {
    super(name, version, cb);

    this.pkg = Object.assign({}, this.pkg, {
      license: 'MIT',
      description: 'Fake project',
      repository: 'http://fakerepo.com',
    });
  }

  /**
   * Runs `git init` inside a project.
   * @returns {*} {ResultPromise}
   */
  gitInit(): ResultPromise {
    return execa('git', ['init', '-q', this.baseDir]);
  }

  /**
   * Changes a directory from inside the project.
   */
  async chdir(): Promise<void> {
    const previousCwd = this._previousCwd ?? process.cwd();

    await this.write();
    process.chdir(this.baseDir);

    this._previousCwd = previousCwd;
  }

  /**
   * Correctly disposes of the project, observing when the directory has been changed.
   * @returns {void}
   */
  dispose(): void {
    const previousCwd = this._previousCwd;
    this._previousCwd = undefined;

    if (previousCwd) {
      process.chdir(previousCwd);
    }

    return super.dispose();
  }
}
