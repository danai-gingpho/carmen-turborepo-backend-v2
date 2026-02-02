import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductCategoryService } from './config_product-category.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductCategoryService', () => {
  let service: Config_ProductCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ProductCategoryService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ProductCategoryService>(Config_ProductCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
