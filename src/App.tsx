import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { convert, ohms, powerFactor, threePhase, transformer, type CalcResult, type NumericMap } from './calculations';
import { evaluateExpression, formatNumber, type AngleMode } from './expression';

type Page = 'home' | 'calculators' | 'formulas' | 'about' | 'contact';
type Kind = 'normal' | 'scientific' | 'ohms' | 'pf' | 'transformer' | 'threePhase' | 'converter';
const meta: Record<Kind, { title: string; description: string }> = {
  normal: { title: 'Normal Calculator', description: 'Everyday arithmetic with keyboard support.' },
  scientific: { title: 'Scientific Calculator', description: 'Advanced functions, powers, roots, and angles.' },
  ohms: { title: "Ohm's Law", description: 'Solve voltage, current, resistance, and power.' },
  pf: { title: 'Power Factor', description: 'Find PF and reactive power from P and S.' },
  transformer: { title: 'Transformer', description: 'Check ideal voltage and turns relationships.' },
  threePhase: { title: 'Three-Phase Power', description: 'Calculate balanced active power.' },
  converter: { title: 'Unit Converter', description: 'Convert common electrical units exactly.' }
};
const fields: Record<Exclude<Kind, 'normal' | 'scientific' | 'converter'>, Array<{ key: string; label: string; unit: string }>> = {
  ohms: [{ key: 'voltage', label: 'Voltage', unit: 'V' }, { key: 'current', label: 'Current', unit: 'A' }, { key: 'resistance', label: 'Resistance', unit: 'Ω' }],
  pf: [{ key: 'realPower', label: 'Real power', unit: 'W' }, { key: 'apparentPower', label: 'Apparent power', unit: 'VA' }],
  transformer: [{ key: 'primaryVoltage', label: 'Primary voltage', unit: 'V' }, { key: 'secondaryVoltage', label: 'Secondary voltage', unit: 'V' }, { key: 'primaryTurns', label: 'Primary turns', unit: 'turns' }, { key: 'secondaryTurns', label: 'Secondary turns', unit: 'turns' }],
  threePhase: [{ key: 'lineVoltage', label: 'Line voltage', unit: 'V' }, { key: 'current', label: 'Current', unit: 'A' }, { key: 'powerFactor', label: 'Power factor', unit: '0–1' }]
};

function App() {
  const [page, setPage] = useState<Page>('home');
  const [selected, setSelected] = useState<Kind>('ohms');
  const cardsRef = useRef<HTMLElement>(null);
  const calculatorRef = useRef<HTMLElement>(null);
  const open = (next: Page) => setPage(next);
  useEffect(() => {
    if (page === 'calculators') calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    calculatorRef.current?.focus({ preventScroll: true });
  }, [page, selected]);
  const selectCalculator = (kind: Kind) => { setSelected(kind); setPage('calculators'); };
  return <><header><a className="brand" href="#home" onClick={() => open('home')}><span>ϟ</span> VoltCalc</a><nav aria-label="Primary"><button onClick={() => open('home')}>Home</button><button onClick={() => open('calculators')}>Calculators</button><button onClick={() => open('formulas')}>Formula library</button><button onClick={() => open('about')}>About</button><button onClick={() => open('contact')}>Contact</button></nav></header><main>{page === 'home' && <Home go={open} />}{page === 'calculators' && <><section className="intro"><p className="eyebrow">FREE · LOCAL-FIRST · STUDENT-FRIENDLY</p><h1>Electrical calculations,<br /><em>clear and confident.</em></h1><p>Reliable, transparent calculators for the concepts that power every circuit. Enter values, see the formula, and understand the result.</p></section><section className="cards" ref={cardsRef}>{(Object.keys(meta) as Kind[]).map(k => <button className={'card ' + (selected === k ? 'active' : '')} onClick={() => selectCalculator(k)} key={k}><span className="card-icon">{k === 'converter' ? '↔' : k === 'normal' ? '＋' : k === 'scientific' ? 'ƒ' : '∿'}</span><strong>{meta[k].title}</strong><small>{meta[k].description}</small><span className="arrow">→</span></button>)}</section><Calculator kind={selected} containerRef={calculatorRef} onBack={() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} /></>}{page === 'formulas' && <FormulaLibrary />}{page === 'about' && <Info title="About VoltCalc">VoltCalc is a free, local-first study companion for electrical engineering students. It performs calculations in your browser and does not send your values anywhere.</Info>}{page === 'contact' && <Info title="Contact"><p>Found an issue or have a suggestion? Please open an issue in your project tracker or contact your course instructor. VoltCalc does not collect personal data.</p></Info>}</main><footer>VoltCalc · Built for learning electrical engineering · No data leaves your browser.</footer></>;
}

function Home({ go }: { go: (page: Page) => void }) { return <section className="hero"><div><p className="eyebrow">A CLEARER WAY TO LEARN ELECTRICAL ENGINEERING</p><h1>Make the math<br /><em>make sense.</em></h1><p>Simple, dependable calculators for the formulas you use every day—without the black box.</p><button className="primary" onClick={() => go('calculators')}>Explore calculators <span>→</span></button></div><div className="hero-art" aria-hidden="true"><div className="orb">ϟ</div><div className="formula">V = I × R</div></div></section>; }

function Calculator({ kind, containerRef, onBack }: { kind: Kind; containerRef: RefObject<HTMLElement | null>; onBack: () => void }) {
  if (kind === 'normal' || kind === 'scientific') return <ExpressionCalculator scientific={kind === 'scientific'} containerRef={containerRef} onBack={onBack} />;
  return <ElectricalCalculator kind={kind} containerRef={containerRef} onBack={onBack} />;
}

function ElectricalCalculator({ kind, containerRef, onBack }: { kind: Exclude<Kind, 'normal' | 'scientific'>; containerRef: RefObject<HTMLElement | null>; onBack: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalcResult | string | null>(null);
  const set = (key: string, value: string) => { setValues(current => ({ ...current, [key]: value })); setResult(null); };
  const run = () => {
    const nums: NumericMap = Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'from' && key !== 'to').map(([key, value]) => [key, value.trim() === '' ? NaN : Number(value)]));
    setResult(kind === 'ohms' ? ohms(nums) : kind === 'pf' ? powerFactor(nums) : kind === 'transformer' ? transformer(nums) : kind === 'threePhase' ? threePhase(nums) : convert(Number(values.value), values.from ?? '', values.to ?? ''));
  };
  const formula = kind === 'ohms' ? 'V = I × R' : kind === 'pf' ? 'S² = P² + Q²' : kind === 'transformer' ? 'Vp/Vs = Np/Ns' : kind === 'threePhase' ? 'P = √3 × VL × I × PF' : 'value × factor';
  return <section className="calculator" ref={containerRef} style={{ scrollMarginTop: '96px' }} tabIndex={-1}><div className="calc-head"><div><p className="eyebrow">CALCULATOR</p><h2>{meta[kind].title}</h2><p>{meta[kind].description}</p></div><span className="formula-pill">{formula}</span></div>{kind === 'converter' ? <Converter values={values} set={set} /> : <div className="field-grid">{fields[kind].map(f => <label key={f.key}>{f.label}<span><input inputMode="decimal" type="number" step="any" value={values[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder="0" /><b>{f.unit}</b></span></label>)}</div>}<div className="actions" style={{ flexWrap: 'wrap' }}><button className="primary" onClick={run}>Calculate <span>→</span></button><button className="reset" onClick={() => { setValues({}); setResult(null); }}>Reset</button><button className="reset back-button" onClick={onBack}>Back to calculator list</button></div>{result && <div className={'result ' + (typeof result === 'string' ? 'error' : '')} role="status">{typeof result === 'string' ? <p>{result}</p> : <><p className="eyebrow">RESULT</p><div className="result-values">{Object.entries(result.values).map(([key, value]) => <div key={key}><small>{key}</small><strong>{value}</strong></div>)}</div><p className="formula">{result.formula}</p></>}</div>}</section>;
}

function Converter({ values, set }: { values: Record<string, string>; set: (key: string, value: string) => void }) { const units = ['W', 'kW', 'MW', 'V', 'kV', 'A', 'mA', 'Ω', 'kΩ']; return <div className="converter"><label>Value<input inputMode="decimal" type="number" step="any" value={values.value ?? ''} onChange={e => set('value', e.target.value)} /></label><label>From<select value={values.from ?? 'kW'} onChange={e => set('from', e.target.value)}>{units.map(u => <option key={u}>{u}</option>)}</select></label><label>To<select value={values.to ?? 'W'} onChange={e => set('to', e.target.value)}>{units.map(u => <option key={u}>{u}</option>)}</select></label></div>; }

const normalKeys = [['AC', '⌫', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['±', '0', '.', '=']];
const scientificKeys = [['sin', 'cos', 'tan', '(', ')'], ['asin', 'acos', 'atan', 'π', 'e'], ['log', 'ln', '√', 'x²', 'xʸ'], ['1/x', 'x!', '%', '÷', '×'], ['7', '8', '9', '−', '+'], ['4', '5', '6', '±', '='], ['1', '2', '3', '', ''], ['0', '.', '', '', '']];

function ExpressionCalculator({ scientific, containerRef, onBack }: { scientific: boolean; containerRef: RefObject<HTMLElement | null>; onBack: () => void }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const keys = scientific ? scientificKeys : normalKeys;
  const clear = () => { setExpression(''); setResult(''); setError(''); };
  const calculate = () => { const value = evaluateExpression(expression, angleMode); if (typeof value === 'string') { setError(value); setResult(''); } else { setError(''); setResult(formatNumber(value)); } };
  const append = (key: string) => {
    setError('');
    if (key === 'AC') return clear();
    if (key === '⌫') return setExpression(current => current.slice(0, -1));
    if (key === '=') return calculate();
    if (key === '±') return setExpression(current => current.startsWith('-') ? current.slice(1) : current ? `-(${current})` : '-');
    const mapped: Record<string, string> = { '×': '*', '÷': '/', '−': '-', 'π': 'pi', '√': 'sqrt(', sin: 'sin(', cos: 'cos(', tan: 'tan(', asin: 'asin(', acos: 'acos(', atan: 'atan(', log: 'log(', ln: 'ln(', 'x²': '^2', 'xʸ': '^', '1/x': '1/(', 'x!': '!' };
    setExpression(current => current + (mapped[key] ?? key));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); calculate(); } else if (event.key === 'Escape') clear(); else if (event.key === 'Backspace') setExpression(current => current.slice(0, -1)); };
  return <section className="calculator expression-calculator" ref={containerRef} style={{ scrollMarginTop: '96px' }} tabIndex={-1} data-testid={scientific ? 'scientific-calculator' : 'normal-calculator'}><div className="calc-head"><div><p className="eyebrow">CALCULATOR</p><h2>{meta[scientific ? 'scientific' : 'normal'].title}</h2><p>{meta[scientific ? 'scientific' : 'normal'].description}</p></div>{scientific && <button className="mode-toggle" onClick={() => setAngleMode(current => current === 'DEG' ? 'RAD' : 'DEG')} aria-label="Toggle angle mode">{angleMode}</button>}</div><label className="expression-label">Expression<input aria-label="Calculator expression" value={expression} onChange={event => { setExpression(event.target.value); setError(''); }} onKeyDown={onKeyDown} inputMode="text" autoComplete="off" placeholder={scientific ? 'Try sin(30) or 2^3' : 'Try 12 + 7 × 2'} /></label><div className="expression-result" aria-live="polite"><span>{error || (result ? `= ${result}` : 'Ready')}</span></div>{error && <p className="calc-error" role="alert">{error}</p>}<div className={'keypad ' + (scientific ? 'scientific-keypad' : '')}>{keys.flat().map((key, index) => key ? <button key={`${key}-${index}`} className={key === '=' ? 'equals' : ['+', '−', '×', '÷', '%', 'xʸ'].includes(key) ? 'operator' : ''} onClick={() => append(key)} aria-label={key === '⌫' ? 'Backspace' : key}>{key}</button> : <span key={`empty-${index}`} />)}</div><div className="expression-actions"><button className="reset" onClick={clear}>Clear</button><button className="reset back-button" onClick={onBack}>Back to calculator list</button></div></section>;
}

function FormulaLibrary() { return <section className="content"><p className="eyebrow">REFERENCE</p><h1>Formula library</h1><p className="lead">The relationships behind every VoltCalc result.</p><div className="formula-list">{[['Ohm’s Law', 'V = I × R', 'Voltage equals current multiplied by resistance.'], ['Power factor', 'S² = P² + Q² · PF = P ÷ S', 'Real power, apparent power, and reactive power form a right triangle.'], ['Transformer', 'Vp / Vs = Np / Ns', 'For an ideal transformer, voltage ratio equals turns ratio.'], ['Three-phase power', 'P = √3 × VL × I × PF', 'Balanced three-phase active power from line voltage and current.']].map(([title, equation, description]) => <article key={title}><h3>{title}</h3><strong>{equation}</strong><p>{description}</p></article>)}</div></section>; }
function Info({ title, children }: { title: string; children: ReactNode }) { return <section className="content"><p className="eyebrow">VOLTCALC</p><h1>{title}</h1><div className="prose">{children}</div></section>; }
export default App;
