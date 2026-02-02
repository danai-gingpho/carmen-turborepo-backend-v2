import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductLocationController } from './config_product-location.controller';
import { Config_ProductLocationService } from './config_product-location.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductLocationController', () => {
  let controller: Config_ProductLocationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ProductLocationController],
      providers: [
        Config_ProductLocationService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ProductLocationController>(Config_ProductLocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
