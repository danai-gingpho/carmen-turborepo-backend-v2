export class IApplicationRoleCreate {
    business_unit_id?: string;
    name?: string;
    description?: string;
}

export class IApplicationRoleUpdate extends IApplicationRoleCreate {
    id: string;
}


