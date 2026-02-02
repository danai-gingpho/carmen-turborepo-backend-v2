export const toISOString = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return date.toISOString();
};

export const toISOStringOrThrow = (date: Date | string | null | undefined): string => {
  const result = toISOString(date);
  if (result === null) {
    throw new Error('Invalid date');
  }
  return result;
};

export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

export const toDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return date;
};

export const toDateOrThrow = (date: Date | string | null | undefined): Date => {
  const result = toDate(date);
  if (result === null) {
    throw new Error('Invalid date');
  }
  return result;
};
