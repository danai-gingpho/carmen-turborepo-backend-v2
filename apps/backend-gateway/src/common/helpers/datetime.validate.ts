/**
 * Convert date or string date to ISO string format
 * แปลงวันที่หรือสตริงวันที่เป็นรูปแบบ ISO string
 * @param date - Date object or string date / อ็อบเจกต์ Date หรือสตริงวันที่
 * @returns ISO string format or null if invalid / รูปแบบ ISO string หรือ null ถ้าไม่ถูกต้อง
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
 * แปลงวันที่หรือสตริงวันที่เป็นรูปแบบ ISO string (โยนข้อผิดพลาดถ้าไม่ถูกต้อง)
 * @param date - Date object or string date / อ็อบเจกต์ Date หรือสตริงวันที่
 * @returns ISO string format / รูปแบบ ISO string
 * @throws Error if date is invalid / ข้อผิดพลาดถ้าวันที่ไม่ถูกต้อง
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
 * ตรวจสอบว่าสตริงหรือ Date เป็นวันที่ที่ถูกต้องหรือไม่
 * @param date - Date object or string date / อ็อบเจกต์ Date หรือสตริงวันที่
 * @returns true if valid, false otherwise / true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
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
 * แปลงวันที่หรือสตริงวันที่เป็นอ็อบเจกต์ Date
 * @param date - Date object or string date / อ็อบเจกต์ Date หรือสตริงวันที่
 * @returns Date object or null if invalid / อ็อบเจกต์ Date หรือ null ถ้าไม่ถูกต้อง
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
 * แปลงวันที่หรือสตริงวันที่เป็นอ็อบเจกต์ Date (โยนข้อผิดพลาดถ้าไม่ถูกต้อง)
 * @param date - Date object or string date / อ็อบเจกต์ Date หรือสตริงวันที่
 * @returns Date object / อ็อบเจกต์ Date
 * @throws Error if date is invalid / ข้อผิดพลาดถ้าวันที่ไม่ถูกต้อง
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
