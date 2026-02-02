import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

describe('PurchaseOrderController', () => {
  let controller: PurchaseOrderController;

  const mockPurchaseOrderService = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    initializePrismaService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderController],
      providers: [
        {
          provide: PurchaseOrderService,
          useValue: mockPurchaseOrderService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrderController>(PurchaseOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
