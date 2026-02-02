import { SetMetadata } from '@nestjs/common';

// A unique key to store the metadata
export const OPTIONAL_BU_CODE_KEY = 'optional_bu_code';

/**
 * Decorator to mark endpoints where bu_code is optional.
 * When bu_code is not provided, the guard will return ALL BUs that the user has access to.
 *
 * @example
 * // Usage on controller method
 * @OptionalBuCode()
 * @Get('purchase-requests')
 * getAllPurchaseRequests() { }
 *
 * // Request without bu_code will return data for all user's BUs
 * // Request with bu_code will filter to specific BU(s)
 */
export const OptionalBuCode = () => SetMetadata(OPTIONAL_BU_CODE_KEY, true);
