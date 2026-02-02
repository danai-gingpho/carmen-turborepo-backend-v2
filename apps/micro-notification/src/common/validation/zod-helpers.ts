import { z } from 'zod';

export const datetimeField = z.string().datetime().nullable();
export const dateField = z.string().date().nullable();
export const decimalField = z.number().nullable();
export const decimalFieldRequired = z.number();
