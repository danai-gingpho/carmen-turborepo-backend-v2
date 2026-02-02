import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductItemGroupService } from './config_product-item-group.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductItemGroupService', () => {
  let service: Config_ProductItemGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ProductItemGroupService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ProductItemGroupService>(Config_ProductItemGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
