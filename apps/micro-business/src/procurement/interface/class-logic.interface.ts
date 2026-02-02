import { Result } from '@/common';

export interface IClassLogic {
  create(data: any, user_id: string, tenant_id: string): Promise<Result<any>>;
  update(data: any, user_id: string, tenant_id: string): Promise<Result<any>>;
}
