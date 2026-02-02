import { Test, TestingModule } from '@nestjs/testing';
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
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_DepartmentUserService>(Config_DepartmentUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
