import { Test } from '@nestjs/testing';
import { Prisma } from '@repo/prisma-shared-schema-tenant';
import { PhysicalCountService } from './physical-count.service';
import { TenantService } from '@/tenant/tenant.service';
import { CostingService } from '@/inventory/costing/costing.service';
import { costMapKey } from '@/inventory/costing/costing.types';

describe('PhysicalCountService.submit (with costing)', () => {
  let service: PhysicalCountService;
  let mockTenantService: any;
  let mockCostingService: any;
  let mockTx: any;
  let mockPrisma: any;

  const tenant_id = 'tenant-1';
  const user_id = 'user-1';
  const pc_id = 'pc-1';
  const location_id = 'loc-1';

  beforeEach(async () => {
    mockTx = {
      tb_stock_in: { create: jest.fn().mockResolvedValue({ id: 'si-1' }) },
      tb_stock_in_detail: { createMany: jest.fn() },
      tb_stock_out: { create: jest.fn().mockResolvedValue({ id: 'so-1' }) },
      tb_stock_out_detail: { createMany: jest.fn() },
      tb_physical_count: { update: jest.fn() },
    };

    mockPrisma = {
      tb_physical_count: {
        findFirst: jest.fn().mockResolvedValue({
          id: pc_id,
          status: 'counting',
          location_id,
          location_code: 'L1',
          location_name: 'Loc 1',
          physical_count_period_id: 'pcp-1',
        }),
      },
      tb_physical_count_period: {
        findFirst: jest.fn().mockResolvedValue({
          tb_period: {
            start_at: new Date('2026-04-01'),
            end_at: new Date('2026-04-30'),
          },
        }),
      },
      tb_physical_count_detail: {
        findMany: jest.fn().mockResolvedValue([
          {
            product_id: 'prod-pos',
            product_name: 'Pos',
            actual_qty: new Prisma.Decimal(10),
            diff_qty: new Prisma.Decimal(3),
          },
          {
            product_id: 'prod-neg',
            product_name: 'Neg',
            actual_qty: new Prisma.Decimal(5),
            diff_qty: new Prisma.Decimal(-2),
          },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockTx)),
    };

    mockTenantService = {
      getdb_connection: jest.fn().mockResolvedValue({
        tenant_id,
        db_connection: 'fake',
        bu_code: 'BU1',
      }),
      getBuConfig: jest.fn().mockResolvedValue('standard'),
    };

    mockCostingService = {
      getCostsPerUnit: jest.fn().mockResolvedValue(
        new Map([
          [costMapKey('prod-pos', location_id), new Prisma.Decimal(10)],
          [costMapKey('prod-neg', location_id), new Prisma.Decimal(8)],
        ]),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        PhysicalCountService,
        { provide: 'PRISMA_SYSTEM', useValue: {} },
        { provide: 'PRISMA_TENANT', useValue: () => Promise.resolve(mockPrisma) },
        { provide: 'MASTER_SERVICE', useValue: { send: jest.fn() } },
        { provide: TenantService, useValue: mockTenantService },
        { provide: CostingService, useValue: mockCostingService },
      ],
    }).compile();

    service = module.get(PhysicalCountService);
    // stub findOne to avoid recursion noise
    jest.spyOn(service, 'findOne').mockResolvedValue({ data: { id: pc_id }, success: true } as any);
    // stub generateSINo / generateSONo if they hit network
    (service as any).generateSINo = jest.fn().mockResolvedValue('SI-001');
    (service as any).generateSONo = jest.fn().mockResolvedValue('SO-001');
  });

  it('uses BU config method to call CostingService', async () => {
    await service.submit({ id: pc_id }, user_id, tenant_id);
    expect(mockCostingService.getCostsPerUnit).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'standard' }),
    );
  });

  it('falls back to last_receiving when BU config returns invalid value', async () => {
    mockTenantService.getBuConfig.mockResolvedValue('not-a-method');
    await service.submit({ id: pc_id }, user_id, tenant_id);
    expect(mockCostingService.getCostsPerUnit).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'last_receiving' }),
    );
  });

  it('writes cost_per_unit and total_cost from CostingService for positive variance', async () => {
    await service.submit({ id: pc_id }, user_id, tenant_id);
    const call = mockTx.tb_stock_in_detail.createMany.mock.calls[0][0].data[0];
    expect(call.cost_per_unit.toString()).toBe('10');
    expect(call.total_cost.toString()).toBe('30'); // 10 * 3
  });

  it('writes cost_per_unit and total_cost from CostingService for negative variance', async () => {
    await service.submit({ id: pc_id }, user_id, tenant_id);
    const call = mockTx.tb_stock_out_detail.createMany.mock.calls[0][0].data[0];
    expect(call.cost_per_unit.toString()).toBe('8');
    expect(call.total_cost.toString()).toBe('16'); // 8 * 2 (abs)
    expect(call.qty.toString()).toBe('2');
  });

  it('writes location to parent stock_in/stock_out (not detail)', async () => {
    await service.submit({ id: pc_id }, user_id, tenant_id);
    const stockInData = mockTx.tb_stock_in.create.mock.calls[0][0].data;
    const stockOutData = mockTx.tb_stock_out.create.mock.calls[0][0].data;
    expect(stockInData.location_id).toBe(location_id);
    expect(stockOutData.location_id).toBe(location_id);

    const stockInDetail = mockTx.tb_stock_in_detail.createMany.mock.calls[0][0].data[0];
    expect(stockInDetail).not.toHaveProperty('location_id');
  });

  it('uses cost = 0 when CostingService returns no entry for an item', async () => {
    mockCostingService.getCostsPerUnit.mockResolvedValue(new Map());
    await service.submit({ id: pc_id }, user_id, tenant_id);
    const call = mockTx.tb_stock_in_detail.createMany.mock.calls[0][0].data[0];
    expect(call.cost_per_unit.toString()).toBe('0');
    expect(call.total_cost.toString()).toBe('0');
  });

  it('skips stock_in creation when no positive variance exists', async () => {
    mockPrisma.tb_physical_count_detail.findMany.mockResolvedValue([
      {
        product_id: 'prod-neg',
        product_name: 'Neg',
        actual_qty: new Prisma.Decimal(5),
        diff_qty: new Prisma.Decimal(-2),
      },
    ]);
    await service.submit({ id: pc_id }, user_id, tenant_id);
    expect(mockTx.tb_stock_in.create).not.toHaveBeenCalled();
    expect(mockTx.tb_stock_out.create).toHaveBeenCalled();
  });

  it('skips stock_out creation when no negative variance exists', async () => {
    mockPrisma.tb_physical_count_detail.findMany.mockResolvedValue([
      {
        product_id: 'prod-pos',
        product_name: 'Pos',
        actual_qty: new Prisma.Decimal(10),
        diff_qty: new Prisma.Decimal(3),
      },
    ]);
    await service.submit({ id: pc_id }, user_id, tenant_id);
    expect(mockTx.tb_stock_in.create).toHaveBeenCalled();
    expect(mockTx.tb_stock_out.create).not.toHaveBeenCalled();
  });

  it('returns error when uncounted details exist', async () => {
    mockPrisma.tb_physical_count_detail.findMany.mockResolvedValue([
      {
        product_id: 'prod-pos',
        product_name: 'Pos',
        actual_qty: null,
        diff_qty: null,
      },
    ]);
    const result = await service.submit({ id: pc_id }, user_id, tenant_id);
    expect(result.isError()).toBe(true);
    expect(mockTx.tb_physical_count.update).not.toHaveBeenCalled();
  });

  it('updates physical count to completed with timestamps', async () => {
    await service.submit({ id: pc_id }, user_id, tenant_id);
    const update = mockTx.tb_physical_count.update.mock.calls[0][0];
    expect(update.where.id).toBe(pc_id);
    expect(update.data.status).toBe('completed');
    expect(update.data.completed_by_id).toBe(user_id);
    expect(update.data.completed_at).toBeDefined();
  });
});
