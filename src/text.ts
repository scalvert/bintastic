/**
 * Gets the leading whitespace (spaces and tabs) of a line.
 * @param {string} line - The line to inspect.
 * @returns {string} The leading whitespace.
 */
function leadingWhitespace(line: string): string {
  let length = 0;

  while (length < line.length && (line[length] === ' ' || line[length] === '\t')) {
    length++;
  }

  return line.slice(0, length);
}

/**
 * Gets the longest common prefix shared by two strings.
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {string} The shared prefix.
 */
function sharedPrefix(a: string, b: string): string {
  let length = 0;
  const max = Math.min(a.length, b.length);

  while (length < max && a[length] === b[length]) {
    length++;
  }

  return a.slice(0, length);
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
 * Normalizes line endings to "\n", converting both "\r\n" pairs and lone "\r".
 * @param {string} segment - The segment to normalize.
 * @returns {string} The normalized segment.
 */
function normalizeNewlines(segment: string): string {
  return segment.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

/**
 * Determines whether a line begins a physical line of the template literal.
 * The first line of the template owns its indentation, as does every line that
 * follows a newline within a segment. Lines that merely continue after an
 * interpolated value do not, so their content is emitted unchanged.
 * @param {number} segmentIndex - The index of the segment the line is in.
 * @param {number} lineIndex - The index of the line within the segment.
 * @returns {boolean} Whether the line owns its indentation.
 */
function startsTemplateLine(segmentIndex: number, lineIndex: number): boolean {
  return segmentIndex === 0 || lineIndex > 0;
}

/**
 * Removes the common indentation from a template line, normalizing
 * whitespace-only lines to empty so they render as truly blank lines.
 * @param {string} line - The template line to strip.
 * @param {string} indent - The common indentation prefix to remove.
 * @returns {string} The stripped line.
 */
function stripTemplateIndent(line: string, indent: string): string {
  if (line.trim() === '') {
    return '';
  }

  return line.slice(sharedPrefix(line, indent).length);
}

/**
 * Computes the indentation common to the template's physical lines, ignoring
 * blank lines, lines flush to the margin, and any content contributed by
 * interpolated values.
 * @param {string[]} segments - The normalized template segments.
 * @returns {string} The common leading-whitespace prefix.
 */
function commonTemplateIndent(segments: string[]): string {
  let common: string | undefined;

  for (const [segmentIndex, segment] of segments.entries()) {
    for (const [lineIndex, line] of segment.split('\n').entries()) {
      if (!startsTemplateLine(segmentIndex, lineIndex) || line.trim() === '') {
        continue;
      }

      const indent = leadingWhitespace(line);

      // A line flush to the margin doesn't constrain the common indentation;
      // counting its empty indent would otherwise disable dedenting for the
      // entire block (e.g. content written on the opening backtick line).
      if (indent === '') {
        continue;
      }

      common = common === undefined ? indent : sharedPrefix(common, indent);
    }
  }

  return common ?? '';
}

/**
 * Creates text file content from a template string.
 *
 * Leading and trailing blank lines are removed and the indentation common to
 * the template literal is stripped. The indentation is computed only from the
 * template text, so interpolated values are inserted verbatim: a multi-line
 * value neither changes the detected indent nor gets re-indented. No trailing
 * newline is added; append one explicitly if the file requires it.
 * @param {TemplateStringsArray} strings - The text template string segments.
 * @param {unknown[]} values - Values to interpolate into the text template.
 * @returns {string} The normalized text file content.
 */
export function text(strings: TemplateStringsArray, ...values: unknown[]): string {
  const segments = strings.map((segment) => normalizeNewlines(segment));
  const indent = commonTemplateIndent(segments);

  let result = '';

  for (const [segmentIndex, segment] of segments.entries()) {
    if (segmentIndex > 0) {
      result += String(values[segmentIndex - 1]);
    }

    for (const [lineIndex, line] of segment.split('\n').entries()) {
      if (lineIndex > 0) {
        result += '\n';
      }

      result += startsTemplateLine(segmentIndex, lineIndex)
        ? stripTemplateIndent(line, indent)
        : line;
    }
  }

  return trimBlankBoundaryLines(result.split('\n')).join('\n');
}
