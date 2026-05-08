import { Test, TestingModule } from '@nestjs/testing';
import { StoreRequisitionService } from './store-requisition.service';

describe('StoreRequisitionService', () => {
  let service: StoreRequisitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreRequisitionService,
        {
          provide: 'BUSINESS_SERVICE',
          useValue: { send: jest.fn(), emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StoreRequisitionService>(StoreRequisitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
