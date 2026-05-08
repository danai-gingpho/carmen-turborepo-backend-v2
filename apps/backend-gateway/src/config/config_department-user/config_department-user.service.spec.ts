import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { HttpStatus } from '@nestjs/common';
import { Config_DepartmentUserService } from './config_department-user.service';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_DepartmentUserService', () => {
  let service: Config_DepartmentUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_DepartmentUserService,
        { provide: 'BUSINESS_SERVICE', useValue: mockMasterService },
      ],
    }).compile();

    service = module.get<Config_DepartmentUserService>(Config_DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('sends TCP message with correct cmd and payload, returns Result.ok on success', async () => {
      const mockData = {
        department: { id: 'd1', code: 'F&B', name: 'Food & Beverage' },
        hod_departments: [],
      };
      mockMasterService.send.mockReturnValue(
        of({ response: { status: HttpStatus.OK, message: 'OK' }, data: mockData }),
      );

      const result = await service.findByUserId(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );

      expect(mockMasterService.send).toHaveBeenCalledWith(
        { cmd: 'department-users.find-by-user-id', service: 'department-users' },
        expect.objectContaining({
          target_user_id: '22222222-2222-2222-2222-222222222222',
          user_id: '11111111-1111-1111-1111-111111111111',
          bu_code: 'TEST-BU',
          version: 'latest',
        }),
      );
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(mockData);
    });

    it('returns Result.error when microservice responds with non-OK status', async () => {
      mockMasterService.send.mockReturnValue(
        of({ response: { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'boom' }, data: null }),
      );

      const result = await service.findByUserId(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );

      expect(result.isOk()).toBe(false);
    });
  });
});
