/**
 * Serializes an interpolated template value as JSON.
 * @param {unknown} value - The value to serialize.
 * @returns {string} The serialized JSON value.
 */
function stringifyTemplateValue(value: unknown): string {
  const stringified = JSON.stringify(value);

  if (typeof stringified === 'undefined') {
    throw new TypeError('[bintastic] json template values must be JSON-serializable');
  }

  return stringified;
}

/**
 * Creates JSON file content from a template string.
 * The template is parsed as JSON and returned as normalized JSON.stringify output.
 * Interpolated values are serialized with JSON.stringify before parsing.
 * @param {TemplateStringsArray} strings - The JSON template string segments.
 * @param {unknown[]} values - Values to serialize into the JSON template.
 * @returns {string} The normalized JSON file content.
 */
export function json(strings: TemplateStringsArray, ...values: unknown[]): string {
  let source = strings.raw[0] ?? '';

  for (const [index, value] of values.entries()) {
    source += stringifyTemplateValue(value);
    source += strings.raw[index + 1] ?? '';
  }

  return JSON.stringify(JSON.parse(source));
}
