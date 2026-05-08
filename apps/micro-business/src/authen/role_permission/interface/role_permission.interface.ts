export class IApplicationRolePermissionCreate {
    application_role_name: string
    permissions: {
        add: string[]
    }
}

export class IApplicationRolePermissionUpdate {
    id: string
    application_role_name?: string
    is_active?: boolean
    permissions: {
        add?: string[]
        remove?: string[]
    }
}

export class IApplicationRolePermissionBulkAssign {
    application_role_id: string;
    permission_ids: string[];
}
