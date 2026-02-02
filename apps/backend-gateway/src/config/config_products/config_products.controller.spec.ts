import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductsController } from './config_products.controller';
import { Config_ProductsService } from './config_products.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductsController', () => {
  let controller: Config_ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ProductsController],
      providers: [
        Config_ProductsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ProductsController>(Config_ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
