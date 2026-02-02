import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderService } from './purchase-order.service';


const mockProcurementService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        {
          provide: 'PROCUREMENT_SERVICE',
          useValue: mockProcurementService,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
