import { describe, expect, it } from 'vitest';
import { evaluateExpression, formatNumber } from './expression';

describe('safe expression evaluator', () => {
  it('handles arithmetic precedence and decimals', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
    expect(evaluateExpression('0.1 + 0.2')).toBeCloseTo(0.3);
  });

  it('handles percentages and negative numbers', () => {
    expect(evaluateExpression('50%')).toBe(0.5);
    expect(evaluateExpression('-5 + 2')).toBe(-3);
  });

  it('rejects invalid operations and expressions', () => {
    expect(evaluateExpression('1 / 0')).toContain('divide by zero');
    expect(evaluateExpression('sqrt(-1)')).toContain('outside');
    expect(evaluateExpression('log(0)')).toContain('greater than zero');
    expect(evaluateExpression('2 +')).toContain('Incomplete');
    expect(evaluateExpression('2 + unknown(1)')).toContain('Unknown');
  });

  it('supports powers, roots, factorial, constants, and inverse functions', () => {
    expect(evaluateExpression('2^3')).toBe(8);
    expect(evaluateExpression('sqrt(9)')).toBe(3);
    expect(evaluateExpression('5!')).toBe(120);
    expect(evaluateExpression('pi')).toBeCloseTo(Math.PI);
    expect(evaluateExpression('e')).toBeCloseTo(Math.E);
    expect(evaluateExpression('asin(1)')).toBe(90);
  });

  it('supports degree and radian trigonometry', () => {
    expect(evaluateExpression('sin(90)', 'DEG')).toBeCloseTo(1);
    expect(evaluateExpression('sin(pi / 2)', 'RAD')).toBeCloseTo(1);
    expect(evaluateExpression('atan(1)', 'DEG')).toBeCloseTo(45);
  });

  it('prevents non-finite values from reaching callers', () => {
    expect(typeof evaluateExpression('1e308 * 1e308')).toBe('string');
    expect(typeof evaluateExpression('1e-300 / 1e300')).toBe('number');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('Error');
    expect(formatNumber(1e20)).toContain('e');
  });
});
