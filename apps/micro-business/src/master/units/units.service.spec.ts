import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { TenantService } from '@/tenant/tenant.service';

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: { tb_unit: Record<string, jest.Mock> };

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      tb_unit: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mockTenantService.prismaTenantInstance.mockResolvedValue(prisma);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    service.bu_code = 'BU001';
    service.userId = '00000000-0000-4000-8000-000000000001';
    await service.initializePrismaService('BU001', service.userId);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Integration Tests: decimal_place', () => {
    it('omits decimal_place on create when not provided so DB default applies', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-1' });

      await service.create({ name: 'KG' });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBeUndefined();
    });

    it('passes decimal_place to Prisma when provided on create', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-2' });

      await service.create({ name: 'G', decimal_place: 3 });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(3);
    });

    it('accepts decimal_place = 0 without coercing to default', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-3' });

      await service.create({ name: 'EA', decimal_place: 0 });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(0);
    });

    it('passes decimal_place to Prisma on update when provided', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue({ id: 'unit-4', name: 'KG' });
      prisma.tb_unit.update.mockResolvedValue({ id: 'unit-4' });

      await service.update({ id: 'unit-4', decimal_place: 4 });

      const call = prisma.tb_unit.update.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(4);
    });

    it('returns decimal_place in findOne response', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue({
        id: 'unit-5',
        name: 'KG',
        is_active: true,
        decimal_place: 3,
      });

      const result = await service.findOne('unit-5');

      expect(result.isOk()).toBe(true);
      expect((result.value as any).decimal_place).toBe(3);
    });
  });
});
