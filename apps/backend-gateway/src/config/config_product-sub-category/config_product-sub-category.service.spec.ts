import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductSubCategoryService } from './config_product-sub-category.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductSubCategoryService', () => {
  let service: Config_ProductSubCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ProductSubCategoryService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ProductSubCategoryService>(Config_ProductSubCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
