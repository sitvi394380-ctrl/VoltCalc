export type AngleMode = 'DEG' | 'RAD';

const MAX_EXPRESSION_LENGTH = 256;
const MAX_TOKENS = 128;
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt']);

class ExpressionError extends Error {}

type Token =
  | { type: 'number'; value: number }
  | { type: 'name'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'left' }
  | { type: 'right' };

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new ExpressionError('Result is outside the supported numeric range.');
  return Object.is(value, -0) ? 0 : value;
}

function tokenize(source: string): Token[] {
  if (!source.trim()) throw new ExpressionError('Enter an expression.');
  if (source.length > MAX_EXPRESSION_LENGTH) throw new ExpressionError('Expression is too long.');
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (/\s/.test(character)) { index += 1; continue; }
    if ('+-*/^%!'.includes(character)) { tokens.push({ type: 'operator', value: character }); index += 1; continue; }
    if (character === '(') { tokens.push({ type: 'left' }); index += 1; continue; }
    if (character === ')') { tokens.push({ type: 'right' }); index += 1; continue; }
    if (/\d|\./.test(character)) {
      const match = source.slice(index).match(/^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/);
      if (!match) throw new ExpressionError('Invalid number.');
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new ExpressionError('Numbers must be finite.');
      tokens.push({ type: 'number', value }); index += match[0].length; continue;
    }
    if (/[a-zA-Zπ]/.test(character)) {
      const match = source.slice(index).match(/^(?:[a-zA-Z]+|π)/);
      if (!match) throw new ExpressionError('Invalid name.');
      const name = match[0] === 'π' ? 'pi' : match[0].toLowerCase();
      if (name !== 'pi' && name !== 'e' && !FUNCTIONS.has(name)) throw new ExpressionError(`Unknown function: ${name}.`);
      tokens.push({ type: 'name', value: name }); index += match[0].length; continue;
    }
    throw new ExpressionError('Invalid character in expression.');
  }
  if (tokens.length > MAX_TOKENS) throw new ExpressionError('Expression has too many parts.');
  return tokens;
}

class Parser {
  private position = 0;
  constructor(private readonly tokens: Token[], private readonly angleMode: AngleMode) {}
  private current() { return this.tokens[this.position]; }
  private operatorValue() { const token = this.current(); return token?.type === 'operator' ? token.value : null; }
  private acceptOperator(operator: string) { if (this.operatorValue() === operator) { this.position += 1; return true; } return false; }
  parse() { const value = this.additive(); if (this.position !== this.tokens.length) throw new ExpressionError('Unexpected input.'); return finite(value); }
  private additive(): number { let value = this.multiplicative(); let operator = this.operatorValue(); while (operator === '+' || operator === '-') { this.position += 1; const right = this.multiplicative(); value = finite(operator === '+' ? value + right : value - right); operator = this.operatorValue(); } return value; }
  private multiplicative(): number { let value = this.power(); let operator = this.operatorValue(); while (operator === '*' || operator === '/') { this.position += 1; const right = this.power(); if (operator === '/' && right === 0) throw new ExpressionError('Cannot divide by zero.'); value = finite(operator === '*' ? value * right : value / right); operator = this.operatorValue(); } return value; }
  private power(): number { const left = this.unary(); if (this.acceptOperator('^')) { const right = this.power(); return finite(Math.pow(left, right)); } return left; }
  private unary(): number { if (this.acceptOperator('+')) return this.unary(); if (this.acceptOperator('-')) return finite(-this.unary()); return this.postfix(); }
  private postfix(): number { let value = this.primary(); let percent = this.acceptOperator('%'); while (percent || this.acceptOperator('!')) { if (percent) value = finite(value / 100); else value = this.factorial(value); percent = this.acceptOperator('%'); } return value; }
  private primary(): number {
    const token = this.current();
    if (!token) throw new ExpressionError('Incomplete expression.');
    if (token.type === 'number') { this.position += 1; return token.value; }
    if (token.type === 'name') {
      this.position += 1;
      if (token.value === 'pi') return Math.PI;
      if (token.value === 'e') return Math.E;
      if (!this.current() || this.current().type !== 'left') throw new ExpressionError(`${token.value} needs parentheses.`);
      const argument = this.parenthesized();
      return this.applyFunction(token.value, argument);
    }
    if (token.type === 'left') return this.parenthesized();
    throw new ExpressionError('Expected a number or opening parenthesis.');
  }
  private parenthesized(): number { this.position += 1; const value = this.additive(); if (!this.current() || this.current().type !== 'right') throw new ExpressionError('Missing closing parenthesis.'); this.position += 1; return value; }
  private factorial(value: number) { if (value < 0 || !Number.isInteger(value) || value > 170) throw new ExpressionError('Factorial needs an integer from 0 to 170.'); let result = 1; for (let i = 2; i <= value; i += 1) result = finite(result * i); return result; }
  private applyFunction(name: string, value: number) {
    const radians = this.angleMode === 'DEG' ? value * Math.PI / 180 : value;
    if (['asin', 'acos'].includes(name) && (value < -1 || value > 1)) throw new ExpressionError(`${name} input must be between -1 and 1.`);
    if (['log', 'ln'].includes(name) && value <= 0) throw new ExpressionError(`${name} input must be greater than zero.`);
    const result = name === 'sin' ? Math.sin(radians) : name === 'cos' ? Math.cos(radians) : name === 'tan' ? Math.tan(radians) : name === 'asin' ? (this.angleMode === 'DEG' ? Math.asin(value) * 180 / Math.PI : Math.asin(value)) : name === 'acos' ? (this.angleMode === 'DEG' ? Math.acos(value) * 180 / Math.PI : Math.acos(value)) : name === 'atan' ? (this.angleMode === 'DEG' ? Math.atan(value) * 180 / Math.PI : Math.atan(value)) : name === 'log' ? Math.log10(value) : name === 'ln' ? Math.log(value) : Math.sqrt(value);
    return finite(result);
  }
}

export function evaluateExpression(source: string, angleMode: AngleMode = 'DEG'): number | string {
  try { return new Parser(tokenize(source), angleMode).parse(); } catch (error) { return error instanceof ExpressionError ? error.message : 'Invalid expression.'; }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) return value.toExponential(10).replace(/\.?(0+)e/, 'e');
  return Number(value.toPrecision(12)).toString();
}
