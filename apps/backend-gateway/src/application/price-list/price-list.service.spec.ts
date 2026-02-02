import { Test, TestingModule } from '@nestjs/testing';
import { PriceListService } from './price-list.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('PriceListService', () => {
  let service: PriceListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<PriceListService>(PriceListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
