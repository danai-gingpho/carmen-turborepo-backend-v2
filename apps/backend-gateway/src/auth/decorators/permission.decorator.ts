import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';

export type PermissionRequirement = Record<string, string[]>;

/**
 * Decorator to specify required permissions for a route
 * @param permissions - Object with resource as key (dot notation) and array of actions as value
 *
 * Resources use dot notation: 'procurement.purchase_request', 'master.vendor'
 * Actions use underscore: 'view', 'view_all', 'view_department', 'create', 'update', 'delete'
 *
 * Hierarchical matching: 'view_all' or 'view_department' will satisfy 'view' requirement
 *
 * @example @Permission({ 'procurement.purchase_request': ['view'] })
 * @example @Permission({ 'procurement.purchase_request': ['view', 'create'] })
 * @example @Permission({ 'procurement.purchase_request': ['view'], 'master.vendor': ['view'] })
 */
export const Permission = (permissions: PermissionRequirement) =>
  SetMetadata(PERMISSION_KEY, permissions);
