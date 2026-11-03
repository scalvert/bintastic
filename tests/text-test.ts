import { describe, test, expect } from 'vitest';
import { text } from '../src';

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

  test('dedents the template without re-indenting multi-line interpolated values', () => {
    const value = 'first\nsecond';

    expect(text`
      const x = "${value}";
      const y = 1;
    `).toEqual('const x = "first\nsecond";\nconst y = 1;');
  });

  test('normalizes carriage returns in the template', () => {
    const template = ['\n  a\r\n  b\r  c\n'] as unknown as TemplateStringsArray;

    expect(text(template)).toEqual('a\nb\nc');
  });

  test('leaves content untouched when indentation mixes tabs and spaces', () => {
    const template = ['\n\tconst a = 1;\n  const b = 2;\n'] as unknown as TemplateStringsArray;

    expect(text(template)).toEqual('\tconst a = 1;\n  const b = 2;');
  });

  test('dedents the remaining lines when content starts on the opening line', () => {
    expect(text`first
      second
      third`).toEqual('first\nsecond\nthird');
  });

  test('ignores flush lines when computing common indentation', () => {
    const template = ['\n  a\nb\n  c\n'] as unknown as TemplateStringsArray;

    expect(text(template)).toEqual('a\nb\nc');
  });

  test('normalizes whitespace-only lines to empty', () => {
    const template = ['\n    a\n        \n    b\n'] as unknown as TemplateStringsArray;

    expect(text(template)).toEqual('a\n\nb');
  });

  test('coerces interpolated values the same way a native template literal does', () => {
    expect(text`count=${42}`).toEqual('count=42');
  });
});
