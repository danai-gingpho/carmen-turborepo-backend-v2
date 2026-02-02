import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationProductController } from './config_location-product.controller';
import { Config_LocationProductService } from './config_location-product.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationProductController', () => {
  let controller: Config_LocationProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_LocationProductController],
      providers: [
        Config_LocationProductService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_LocationProductController>(Config_LocationProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
