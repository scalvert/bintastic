import { existsSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { BintasticProject } from '../src';

describe('BintasticProject', () => {
  test('restores the cwd that was active before chdir', async () => {
    const originalCwd = process.cwd();
    const callerProject = new BintasticProject();
    const targetProject = new BintasticProject();

    try {
      process.chdir(callerProject.baseDir);
      await targetProject.chdir();
      await targetProject.chdir();
      targetProject.dispose();

      expect(process.cwd()).toEqual(callerProject.baseDir);
    } finally {
      callerProject.dispose();
      process.chdir(originalCwd);
    }
  });

  test('restoreCwd returns to the previous cwd and keeps the directory', async () => {
    const originalCwd = process.cwd();
    const project = new BintasticProject();

    try {
      await project.chdir();
      project.restoreCwd();

      expect(process.cwd()).toEqual(originalCwd);
      expect(existsSync(project.baseDir)).toEqual(true);

      project.restoreCwd();
      expect(process.cwd()).toEqual(originalCwd);
    } finally {
      process.chdir(originalCwd);
      project.dispose();
    }
  });
});
