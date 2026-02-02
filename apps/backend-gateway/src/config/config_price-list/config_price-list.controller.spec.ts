import { Test, TestingModule } from '@nestjs/testing';
import { Config_PriceListController } from './config_price-list.controller';
import { Config_PriceListService } from './config_price-list.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_PriceListController', () => {
  let controller: Config_PriceListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_PriceListController],
      providers: [
        Config_PriceListService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_PriceListController>(Config_PriceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
