/**
 * Structured Error Code System
 *
 * Format: "XXXYYY"
 *   XXX = Service number (3 digits)
 *   YYY = Case number (3 digits)
 *
 * Service numbers:
 *   001 = Purchase Request (PR)
 *   002 = Purchase Order (PO)
 *   003 = Good Received Note (GRN)
 *   004 = Store Requisition (SR)
 *   005 = Credit Note (CN)
 *   ...
 */

// ---------------------------------------------------------------------------
// Service Numbers
// ---------------------------------------------------------------------------
export const SERVICE_NUMBER = {
  PURCHASE_REQUEST: '001',
  PURCHASE_ORDER: '002',
  GOOD_RECEIVED_NOTE: '003',
  STORE_REQUISITION: '004',
  CREDIT_NOTE: '005',
} as const;

// ---------------------------------------------------------------------------
// Purchase Request Error Codes (001|YYY)
// ---------------------------------------------------------------------------
export const PR_ERROR = {
  /** 001001 - Workflow is required before submitting PR */
  WORKFLOW_REQUIRED: '001001',
  /** 001002 - PR must have at least one detail line */
  DETAIL_REQUIRED: '001002',
  /** 001003 - Requestor is required */
  REQUESTOR_REQUIRED: '001003',
  /** 001004 - Department is required */
  DEPARTMENT_REQUIRED: '001004',
  /** 001005 - PR date is required */
  PR_DATE_REQUIRED: '001005',
  /** 001006 - Product is required in detail line */
  PRODUCT_REQUIRED: '001006',
  /** 001007 - Requested quantity must be positive */
  REQUESTED_QTY_INVALID: '001007',
  /** 001008 - Requested unit is required */
  REQUESTED_UNIT_REQUIRED: '001008',
  /** 001009 - PR not found */
  NOT_FOUND: '001009',
  /** 001010 - Department must have HOD assigned for this workflow */
  HOD_REQUIRED: '001010',
  /** 001011 - General validation failure */
  VALIDATION_FAILED: '001011',
} as const;

// ---------------------------------------------------------------------------
// Error Response Interface
// ---------------------------------------------------------------------------
export interface ErrorDetail {
  error_code: string;
  service: string;
  id?: string;
  error: string;
}
