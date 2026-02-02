export interface ICreateRunningCode {
  type?: string;
  note?: string;
  config?: object;
  format?: string;
}

export interface IUpdateRunningCode {
  id?: string;
  type?: string;
  note?: string;
  config?: any;
  format?: string;
}
