export class IPermissionCreate {
    resource?: string;
    action?: string;
    description?: string;
}

export class IPermissionUpdate extends IPermissionCreate {
    id: string;
}


