export class RegisterDto {
  email: string;
  password: string;
}

export interface IRegister {
  username: string;
  email: string;
  password: string;
  user_info: IUserInfo;
}

export interface IInviteUser {
  email: string;
}

export interface IRegisterConfirm {
  username?: string;
  email?: string;
  password: string;
  email_token: string;
  user_info: IUserInfo;
  reference_code?: string;
}

export interface IUserInfo {
  first_name: string;
  middle_name: string;
  last_name: string;
  telephone?: string;
}
