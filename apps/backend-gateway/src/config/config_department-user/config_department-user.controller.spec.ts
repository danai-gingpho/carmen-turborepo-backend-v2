import { Test, TestingModule } from '@nestjs/testing';
import { Config_DepartmentUserController } from './config_department-user.controller';
import { Config_DepartmentUserService } from './config_department-user.service';
import { Result } from '@/common';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_DepartmentUserController', () => {
  let controller: Config_DepartmentUserController;
  let service: Config_DepartmentUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_DepartmentUserController],
      providers: [
        Config_DepartmentUserService,
        { provide: 'BUSINESS_SERVICE', useValue: mockMasterService },
      ],
    }).compile();

    controller = module.get<Config_DepartmentUserController>(Config_DepartmentUserController);
    service = module.get<Config_DepartmentUserService>(Config_DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByUser', () => {
    it('extracts user_id from headers, calls service.findByUserId with target user, and responds', async () => {
      const expected = { department: null, hod_departments: [] };
      jest.spyOn(service, 'findByUserId').mockResolvedValue(Result.ok(expected));

      const req: any = {
        headers: { 'x-user-id': '11111111-1111-1111-1111-111111111111' },
        user: { user_id: '11111111-1111-1111-1111-111111111111' },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      await controller.findByUser(
        req,
        res,
        '22222222-2222-2222-2222-222222222222',
        'TEST-BU',
        'latest',
      );

      expect(service.findByUserId).toHaveBeenCalledWith(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );
      expect(res.status).toHaveBeenCalled();
    });
  });
});
