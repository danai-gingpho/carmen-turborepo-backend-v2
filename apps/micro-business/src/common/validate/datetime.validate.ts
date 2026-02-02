/**
 * Convert date or string date to ISO string format
 * @param date - Date object or string date
 * @returns ISO string format or null if invalid
 */
export function toISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  try {
    if (date instanceof Date) {
      return date.toISOString();
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert date or string date to ISO string format (throws error if invalid)
 * @param date - Date object or string date
 * @returns ISO string format
 * @throws Error if date is invalid
 */
export function toISOStringOrThrow(date: Date | string | null | undefined): string {
  if (!date) {
    throw new Error("Date is required");
  }

  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error("Invalid Date object");
      }
      return date.toISOString();
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }

    return parsedDate.toISOString();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to convert date: ${date}`);
  }
}

/**
 * Validate if a string or Date is a valid date
 * @param date - Date object or string date
 * @returns true if valid, false otherwise
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  try {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }

    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  } catch {
    return false;
  }
}

/**
 * Convert date or string date to Date object
 * @param date - Date object or string date
 * @returns Date object or null if invalid
 */
export function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;

  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }

    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  } catch {
    return null;
  }
}

/**
 * Convert date or string date to Date object (throws error if invalid)
 * @param date - Date object or string date
 * @returns Date object
 * @throws Error if date is invalid
 */
export function toDateOrThrow(date: Date | string | null | undefined): Date {
  if (!date) {
    throw new Error("Date is required");
  }

  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error("Invalid Date object");
      }
      return date;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }

    return parsedDate;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to convert date: ${date}`);
  }
}
