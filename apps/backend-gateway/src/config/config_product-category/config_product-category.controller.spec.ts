import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductCategoryController } from './config_product-category.controller';
import { Config_ProductCategoryService } from './config_product-category.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductCategoryController', () => {
  let controller: Config_ProductCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ProductCategoryController],
      providers: [
        Config_ProductCategoryService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ProductCategoryController>(Config_ProductCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
