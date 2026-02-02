import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationsController } from './config_locations.controller';
import { Config_LocationsService } from './config_locations.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationsController', () => {
  let controller: Config_LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_LocationsController],
      providers: [
        Config_LocationsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_LocationsController>(Config_LocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
