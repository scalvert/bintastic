/**
 * Serializes an interpolated template value as JSON, rejecting any value that
 * cannot be faithfully represented (undefined, functions, symbols, non-finite
 * numbers anywhere in the value, BigInts, and circular references).
 * @param {unknown} value - The value to serialize.
 * @returns {string} The serialized JSON value.
 */
function stringifyTemplateValue(value: unknown): string {
  let stringified: string | undefined;

  try {
    stringified = JSON.stringify(value, (_key, current) => {
      if (typeof current === 'number' && !Number.isFinite(current)) {
        throw new TypeError('[bintastic] non-finite number');
      }

      return current;
    });
  } catch {
    throw new TypeError('[bintastic] json template values must be JSON-serializable');
  }

  if (typeof stringified === 'undefined') {
    throw new TypeError('[bintastic] json template values must be JSON-serializable');
  }

  return stringified;
}

/**
 * Creates JSON file content from a template string.
 *
 * The template is parsed as JSON and returned as normalized `JSON.stringify`
 * output, so original whitespace and formatting are not preserved and comments
 * (JSONC) are not supported. Interpolated values are serialized with
 * `JSON.stringify` before parsing. No trailing newline is added; append one
 * explicitly if the file requires it.
 *
 * Note: `package.json` is special-cased by fixturify-project and is serialized
 * from the project's `pkg`, not from `files`, so assigning `json` content to
 * `files['package.json']` has no effect. Configure it via the project
 * constructor or `project.pkg` instead.
 * @param {TemplateStringsArray} strings - The JSON template string segments.
 * @param {unknown[]} values - Values to serialize into the JSON template.
 * @returns {string} The normalized JSON file content.
 */
export function json(strings: TemplateStringsArray, ...values: unknown[]): string {
  let source = strings.raw[0];

  for (const [index, value] of values.entries()) {
    source += stringifyTemplateValue(value);
    source += strings.raw[index + 1];
  }

  return JSON.stringify(JSON.parse(source));
}
