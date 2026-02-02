import { Test, TestingModule } from '@nestjs/testing';
import { Config_DepartmentsController } from './config_departments.controller';
import { Config_DepartmentsService } from './config_departments.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_DepartmentsController', () => {
  let controller: Config_DepartmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_DepartmentsController],
      providers: [
        Config_DepartmentsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_DepartmentsController>(Config_DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
