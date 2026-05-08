import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: 'PRISMA_SYSTEM', useValue: {} },
        { provide: 'PRISMA_TENANT', useValue: {} },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('TenantService.getBuConfig', () => {
  let service: TenantService;
  let mockPrismaSystem: any;

  beforeEach(async () => {
    mockPrismaSystem = {
      tb_business_unit: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: 'PRISMA_SYSTEM', useValue: mockPrismaSystem },
        { provide: 'PRISMA_TENANT', useValue: {} },
      ],
    }).compile();

    service = module.get(TenantService);
  });

  it('returns config value when key exists', async () => {
    mockPrismaSystem.tb_business_unit.findFirst.mockResolvedValue({
      config: [
        { key: 'physical_count_costing_method', value: 'standard' },
        { key: 'currency_base', value: { code: 'THB' } },
      ],
    });

    const result = await service.getBuConfig(
      'bu-id-123',
      'physical_count_costing_method' as any,
      'last_receiving',
    );

    expect(result).toBe('standard');
  });

  it('returns default when key missing', async () => {
    mockPrismaSystem.tb_business_unit.findFirst.mockResolvedValue({
      config: [{ key: 'currency_base', value: { code: 'THB' } }],
    });

    const result = await service.getBuConfig(
      'bu-id-123',
      'physical_count_costing_method' as any,
      'last_receiving',
    );

    expect(result).toBe('last_receiving');
  });

  it('returns default when bu not found', async () => {
    mockPrismaSystem.tb_business_unit.findFirst.mockResolvedValue(null);

    const result = await service.getBuConfig(
      'bu-id-missing',
      'physical_count_costing_method' as any,
      'last_receiving',
    );

    expect(result).toBe('last_receiving');
  });

  it('returns default when config array is null', async () => {
    mockPrismaSystem.tb_business_unit.findFirst.mockResolvedValue({ config: null });

    const result = await service.getBuConfig(
      'bu-id-123',
      'physical_count_costing_method' as any,
      'last_receiving',
    );

    expect(result).toBe('last_receiving');
  });

  it('returns null (not default) when key is present with value: null', async () => {
    mockPrismaSystem.tb_business_unit.findFirst.mockResolvedValue({
      config: [{ key: 'physical_count_costing_method', value: null }],
    });

    const result = await service.getBuConfig(
      'bu-id-123',
      'physical_count_costing_method' as any,
      'last_receiving',
    );

    expect(result).toBeNull();
  });
});
