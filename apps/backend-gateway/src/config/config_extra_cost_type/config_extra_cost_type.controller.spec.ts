import { Test, TestingModule } from '@nestjs/testing';
import { Config_ExtraCostTypeController } from './config_extra_cost_type.controller';
import { Config_ExtraCostTypeService } from './config_extra_cost_type.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ExtraCostTypeController', () => {
  let controller: Config_ExtraCostTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ExtraCostTypeController],
      providers: [
        Config_ExtraCostTypeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ExtraCostTypeController>(
      Config_ExtraCostTypeController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
