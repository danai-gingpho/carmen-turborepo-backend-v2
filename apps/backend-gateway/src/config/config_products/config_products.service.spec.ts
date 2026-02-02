import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductsService } from './config_products.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductsService', () => {
  let service: Config_ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ProductsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ProductsService>(Config_ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
