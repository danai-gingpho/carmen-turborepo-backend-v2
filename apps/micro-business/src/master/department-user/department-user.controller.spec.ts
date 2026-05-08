import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentUserController } from './department-user.controller';
import { DepartmentUserService } from './department-user.service';
import { TenantService } from '@/tenant/tenant.service';
import { Result } from '@/common';

describe('DepartmentUserController', () => {
  let controller: DepartmentUserController;
  let service: DepartmentUserService;

  const mockPrismaClient = {
    tb_department_user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTenantService = {
    prismaTenantInstance: jest.fn().mockResolvedValue(mockPrismaClient),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentUserController],
      providers: [
        DepartmentUserService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    controller = module.get<DepartmentUserController>(DepartmentUserController);
    service = module.get<DepartmentUserService>(DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByUserId', () => {
    it('initializes Prisma and delegates to service.findByUserId with target_user_id', async () => {
      const payload = {
        bu_code: 'TEST-BU',
        user_id: '11111111-1111-1111-1111-111111111111',
        target_user_id: '22222222-2222-2222-2222-222222222222',
        request_id: 'req-1',
        ip_address: '127.0.0.1',
        user_agent: 'jest',
      };
      const expected = { department: null, hod_departments: [] };
      jest.spyOn(service, 'findByUserId').mockResolvedValue(Result.ok(expected));

      const response = await controller.findByUserId(payload);

      expect(mockTenantService.prismaTenantInstance).toHaveBeenCalledWith(
        payload.bu_code,
        payload.user_id,
      );
      expect(service.findByUserId).toHaveBeenCalledWith(payload.target_user_id);
      expect(response).toBeDefined();
      expect(response.data).toEqual(expected);
    });
  });
});
