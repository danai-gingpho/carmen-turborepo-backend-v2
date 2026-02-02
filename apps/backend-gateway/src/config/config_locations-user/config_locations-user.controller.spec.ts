import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationsUserController } from './config_locations-user.controller';
import { Config_LocationsUserService } from './config_locations-user.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationsUserController', () => {
  let controller: Config_LocationsUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_LocationsUserController],
      providers: [
        Config_LocationsUserService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_LocationsUserController>(Config_LocationsUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
