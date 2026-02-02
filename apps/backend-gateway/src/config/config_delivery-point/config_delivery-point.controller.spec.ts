import { Test, TestingModule } from '@nestjs/testing';
import { Config_DeliveryPointController } from './config_delivery-point.controller';
import { Config_DeliveryPointService } from './config_delivery-point.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('DeliveryPointController', () => {
  let controller: Config_DeliveryPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_DeliveryPointController],
      providers: [
        Config_DeliveryPointService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_DeliveryPointController>(Config_DeliveryPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
