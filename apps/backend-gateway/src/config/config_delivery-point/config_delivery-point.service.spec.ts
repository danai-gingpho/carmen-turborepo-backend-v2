import { Test, TestingModule } from '@nestjs/testing';
import { Config_DeliveryPointService } from './config_delivery-point.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_DeliveryPointService', () => {
  let service: Config_DeliveryPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_DeliveryPointService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_DeliveryPointService>(Config_DeliveryPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
