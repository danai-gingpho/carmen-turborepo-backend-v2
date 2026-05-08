import { Result } from '@/common';

export interface IClassLogic {
  create(data: Record<string, unknown>, user_id: string, tenant_id: string): Promise<Result<any>>;
  update(data: Record<string, unknown>, user_id: string, tenant_id: string): Promise<Result<any>>;
}
