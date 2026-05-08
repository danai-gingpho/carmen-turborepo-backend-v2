import {
  DEFAULT_DECIMAL_PLACE,
  resolveConversionDecimalPlace,
  resolveUnitDecimalPlace,
} from './decimal-place.util';

describe('resolveUnitDecimalPlace', () => {
  it('returns unit.decimal_place when present', () => {
    expect(resolveUnitDecimalPlace({ unit: { decimal_place: 3 } })).toBe(3);
  });

  it('respects 0 (EA-style) without falling back to default', () => {
    expect(resolveUnitDecimalPlace({ unit: { decimal_place: 0 } })).toBe(0);
  });

  it('falls back to default when unit is null', () => {
    expect(resolveUnitDecimalPlace({ unit: null })).toBe(DEFAULT_DECIMAL_PLACE);
  });

  it('falls back to default when unit is undefined', () => {
    expect(resolveUnitDecimalPlace({ unit: undefined })).toBe(DEFAULT_DECIMAL_PLACE);
  });
});

describe('resolveConversionDecimalPlace', () => {
  it('prefers conversion.decimal_place over fallback unit', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: { decimal_place: 3 },
        fallbackUnit: { decimal_place: 2 },
      }),
    ).toBe(3);
  });

  it('respects conversion 0 over fallback unit 3', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: { decimal_place: 0 },
        fallbackUnit: { decimal_place: 3 },
      }),
    ).toBe(0);
  });

  it('falls back to unit when conversion is null', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: null,
        fallbackUnit: { decimal_place: 4 },
      }),
    ).toBe(4);
  });

  it('falls back to DEFAULT_DECIMAL_PLACE when both are null', () => {
    expect(
      resolveConversionDecimalPlace({ conversion: null, fallbackUnit: null }),
    ).toBe(DEFAULT_DECIMAL_PLACE);
  });

  it('DEFAULT_DECIMAL_PLACE is 2', () => {
    expect(DEFAULT_DECIMAL_PLACE).toBe(2);
  });
});
