import { describe, test, expect } from 'vitest';
import { json } from '../src';

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

  test('throws when an interpolated number is not finite', () => {
    expect(() => json`{ "value": ${Number.NaN} }`).toThrow(
      '[bintastic] json template values must be JSON-serializable'
    );
    expect(() => json`{ "value": ${Infinity} }`).toThrow(
      '[bintastic] json template values must be JSON-serializable'
    );
  });

  test('throws when a non-finite number is nested inside an interpolated value', () => {
    expect(() => json`{ "value": ${{ count: Number.NaN }} }`).toThrow(
      '[bintastic] json template values must be JSON-serializable'
    );
  });

  test('throws when unsupported values are nested inside an interpolated value', () => {
    const omitted = Reflect.get({}, 'missing');
    const unsupportedValues = [
      { nested: omitted },
      { nested: () => {} },
      { nested: Symbol('unsupported') },
      [omitted],
      [() => {}],
      [Symbol('unsupported')],
    ];

    for (const value of unsupportedValues) {
      expect(() => json`{ "value": ${value} }`).toThrow(
        '[bintastic] json template values must be JSON-serializable'
      );
    }
  });

  test('throws a branded error when an interpolated value is a BigInt', () => {
    expect(() => json`{ "value": ${10n} }`).toThrow(
      '[bintastic] json template values must be JSON-serializable'
    );
  });
});
