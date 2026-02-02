import { Test, TestingModule } from '@nestjs/testing';
import { Config_DepartmentsService } from './config_departments.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_DepartmentsService', () => {
  let service: Config_DepartmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_DepartmentsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_DepartmentsService>(Config_DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
