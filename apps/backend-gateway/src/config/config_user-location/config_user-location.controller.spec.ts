import { Test, TestingModule } from '@nestjs/testing';
import { Config_UserLocationController } from './config_user-location.controller';
import { Config_UserLocationService } from './config_user-location.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UserLocationController', () => {
  let controller: Config_UserLocationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_UserLocationController],
      providers: [
        Config_UserLocationService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_UserLocationController>(Config_UserLocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
