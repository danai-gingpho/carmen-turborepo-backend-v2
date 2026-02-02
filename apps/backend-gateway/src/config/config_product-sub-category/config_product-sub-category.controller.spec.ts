import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductSubCategoryController } from './config_product-sub-category.controller';
import { Config_ProductSubCategoryService } from './config_product-sub-category.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductSubCategoryController', () => {
  let controller: Config_ProductSubCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ProductSubCategoryController],
      providers: [
        Config_ProductSubCategoryService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ProductSubCategoryController>(Config_ProductSubCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
