import { Test, TestingModule } from '@nestjs/testing';
import { Config_DepartmentUserController } from './config_department-user.controller';
import { Config_DepartmentUserService } from './config_department-user.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_DepartmentUserController', () => {
  let controller: Config_DepartmentUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_DepartmentUserController],
      providers: [
        Config_DepartmentUserService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_DepartmentUserController>(Config_DepartmentUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
