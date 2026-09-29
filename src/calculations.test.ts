import { describe, expect, it } from 'vitest';
import { convert, ohms, powerFactor, threePhase, transformer } from './calculations';
describe('calculators',()=>{
  it('solves Ohm values',()=>expect(ohms({voltage:12,current:2,resistance:NaN})).toMatchObject({values:{Resistance:'6 Ω'}}));
  it('rejects invalid Ohm values',()=>expect(typeof ohms({voltage:0,current:0,resistance:1})).toBe('string'));
  it('calculates PF and reactive power',()=>expect(powerFactor({realPower:800,apparentPower:1000})).toMatchObject({values:{'Power Factor':'0.800000','Reactive Power':'600 VAR'}}));
  it('checks transformer consistency',()=>expect(transformer({primaryVoltage:240,secondaryVoltage:120,primaryTurns:1000,secondaryTurns:500})).toHaveProperty('values'));
  it('rejects transformer mismatch',()=>expect(transformer({primaryVoltage:240,secondaryVoltage:120,primaryTurns:1000,secondaryTurns:400})).toContain('mismatch'));
  it('calculates three phase power',()=>expect((threePhase({lineVoltage:400,current:10,powerFactor:.8}) as {values:Record<string,string>}).values['Active Power']).toMatch(/^5542\.562584/));
});
describe('conversion properties',()=>{
  it('round trips power units',()=>{ for(const n of [0,1,12.5,100000]) { const watts=convert(n,'kW','W') as {values:Record<string,string>}; const back=convert(parseFloat(watts.values.Result),'W','kW') as {values:Record<string,string>}; expect(parseFloat(back.values.Result)).toBeCloseTo(n); } });
  it('rejects cross-group conversions',()=>expect(convert(1,'V','A')).toContain('same measurement'));
});
