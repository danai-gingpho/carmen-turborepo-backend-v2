import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentUserService } from './department-user.service';
import { TenantService } from '@/tenant/tenant.service';

describe('DepartmentUserService', () => {
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
      providers: [
        DepartmentUserService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<DepartmentUserService>(DepartmentUserService);
    service.bu_code = 'TEST-BU';
    service.userId = '11111111-1111-1111-1111-111111111111';
    await service.initializePrismaService('TEST-BU', '11111111-1111-1111-1111-111111111111');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    const TARGET_USER = '22222222-2222-2222-2222-222222222222';
    const MEMBER_DEPT = { id: 'aaa', code: 'F&B', name: 'Food & Beverage' };
    const HOD_DEPT_1 = { id: 'bbb', code: 'HK', name: 'Housekeeping' };
    const HOD_DEPT_2 = { id: 'ccc', code: 'FO', name: 'Front Office' };

    it('returns department and hod_departments when user is both member and HOD', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue({
        tb_department: MEMBER_DEPT,
      });
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([
        { tb_department: HOD_DEPT_1 },
        { tb_department: HOD_DEPT_2 },
      ]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: MEMBER_DEPT,
        hod_departments: [HOD_DEPT_1, HOD_DEPT_2],
      });
      expect(mockPrismaClient.tb_department_user.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: TARGET_USER,
          OR: [{ is_hod: false }, { is_hod: null }],
          deleted_at: null,
        },
        select: { tb_department: { select: { id: true, code: true, name: true } } },
      });
      expect(mockPrismaClient.tb_department_user.findMany).toHaveBeenCalledWith({
        where: { user_id: TARGET_USER, is_hod: true, deleted_at: null },
        select: { tb_department: { select: { id: true, code: true, name: true } } },
      });
    });

    it('treats null is_hod as a member assignment (legacy data compatibility)', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue({
        tb_department: MEMBER_DEPT,
      });
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: MEMBER_DEPT,
        hod_departments: [],
      });
      const memberCall = mockPrismaClient.tb_department_user.findFirst.mock.calls[0][0];
      expect(memberCall.where.OR).toEqual([{ is_hod: false }, { is_hod: null }]);
    });

    it('returns null department when user is HOD only', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue(null);
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([
        { tb_department: HOD_DEPT_1 },
      ]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: null,
        hod_departments: [HOD_DEPT_1],
      });
    });

    it('returns empty hod_departments when user is member only', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue({
        tb_department: MEMBER_DEPT,
      });
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: MEMBER_DEPT,
        hod_departments: [],
      });
    });

    it('returns null department and empty hod_departments when user has neither', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue(null);
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: null,
        hod_departments: [],
      });
    });
  });
});
