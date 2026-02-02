import { Test, TestingModule } from '@nestjs/testing';
import { PriceListTemplateService } from './price-list-template.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('PriceListTemplateService', () => {
  let service: PriceListTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListTemplateService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<PriceListTemplateService>(PriceListTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
