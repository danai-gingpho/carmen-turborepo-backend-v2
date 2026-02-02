import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PermissionService } from 'src/auth/services/permission.service';


const mockProcurementService = {
  send: jest.fn(),
  emit: jest.fn(),
};
const mockPrismaSystem = {};
const mockPermissionService = {
  getUserPermissions: jest.fn().mockResolvedValue({}),
};
describe('PurchaseOrderController', () => {
  let controller: PurchaseOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderController],
      providers: [
        PurchaseOrderService,
        {
          provide: 'PROCUREMENT_SERVICE',
          useValue: mockProcurementService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: 'PRISMA_SYSTEM',
          useValue: mockPrismaSystem,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrderController>(PurchaseOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
