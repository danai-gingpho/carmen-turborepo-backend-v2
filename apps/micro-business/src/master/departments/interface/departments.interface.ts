interface UserInfo {
  id: string;
  // isHod?: boolean;
}

interface Users extends UserInfo {
  add?: UserInfo[];
  remove?: Pick<UserInfo, 'id'>[];
}

export interface ICreateDepartments {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
  department_users?: Pick<Users, 'add'>;
  hod_users?: Pick<Users, 'add'>;
}

export interface IUpdateDepartments {
  id: string;
  code: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  department_users?: Pick<Users, 'add' | 'remove'>;
  hod_users?: Pick<Users, 'add' | 'remove'>;
}
