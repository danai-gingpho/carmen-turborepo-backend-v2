import { Test, TestingModule } from '@nestjs/testing';
import { Config_UnitsController } from './config_units.controller';
import { Config_UnitsService } from './config_units.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UnitsController', () => {
  let controller: Config_UnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_UnitsController],
      providers: [
        Config_UnitsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_UnitsController>(Config_UnitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
