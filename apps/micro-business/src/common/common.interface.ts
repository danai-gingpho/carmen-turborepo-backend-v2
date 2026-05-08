type DynamicCharacter = 'A' | 'B' | 'C'
export type PatternMapper = {
  [ch in DynamicCharacter]: string;
} & {
  format: string;
}