export const DEFAULT_DECIMAL_PLACE = 2;

type ResolveUnitDecimalInput = {
  unit: { decimal_place: number } | null | undefined;
};

export function resolveUnitDecimalPlace(
  input: ResolveUnitDecimalInput,
): number {
  return input.unit?.decimal_place ?? DEFAULT_DECIMAL_PLACE;
}

type ResolveConversionDecimalInput = {
  conversion: { decimal_place: number } | null | undefined;
  fallbackUnit: { decimal_place: number } | null | undefined;
};

export function resolveConversionDecimalPlace(
  input: ResolveConversionDecimalInput,
): number {
  return (
    input.conversion?.decimal_place
    ?? input.fallbackUnit?.decimal_place
    ?? DEFAULT_DECIMAL_PLACE
  );
}
