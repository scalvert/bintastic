/**
 * Gets the number of leading whitespace characters on a line.
 * @param {string} line - The line to inspect.
 * @returns {number} The leading whitespace length.
 */
function leadingWhitespaceLength(line: string): number {
  const match = /^[\t ]*/.exec(line);

  return match?.[0].length ?? 0;
}

/**
 * Removes blank lines from the start and end of a line list.
 * @param {string[]} lines - The lines to trim.
 * @returns {string[]} The trimmed lines.
 */
function trimBlankBoundaryLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start++;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end--;
  }

  return lines.slice(start, end);
}

/**
 * Removes common indentation from text.
 * @param {string} source - The text to dedent.
 * @returns {string} The dedented text.
 */
function dedent(source: string): string {
  const lines = trimBlankBoundaryLines(source.replaceAll('\r\n', '\n').split('\n'));
  const contentLines = lines.filter((line) => line.trim() !== '');
  const minimumIndent =
    contentLines.length === 0
      ? 0
      : Math.min(...contentLines.map((line) => leadingWhitespaceLength(line)));

  return lines.map((line) => line.slice(minimumIndent)).join('\n');
}

/**
 * Creates text file content from a template string.
 * The template has leading and trailing blank lines removed, then common indentation is stripped.
 * @param {TemplateStringsArray} strings - The text template string segments.
 * @param {unknown[]} values - Values to interpolate into the text template.
 * @returns {string} The normalized text file content.
 */
export function text(strings: TemplateStringsArray, ...values: unknown[]): string {
  let source = strings[0] ?? '';

  for (const [index, value] of values.entries()) {
    source += String(value);
    source += strings[index + 1] ?? '';
  }

  return dedent(source);
}
