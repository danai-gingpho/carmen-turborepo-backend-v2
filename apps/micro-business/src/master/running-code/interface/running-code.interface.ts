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
  config?: Record<string, unknown>;
  format?: string;
}
