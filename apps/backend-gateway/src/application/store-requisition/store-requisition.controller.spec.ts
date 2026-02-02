import { Test, TestingModule } from '@nestjs/testing';
import { StoreRequisitionController } from './store-requisition.controller';
import { StoreRequisitionService } from './store-requisition.service';

describe('StoreRequisitionController', () => {
  let controller: StoreRequisitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreRequisitionController],
      providers: [StoreRequisitionService],
    }).compile();

    controller = module.get<StoreRequisitionController>(StoreRequisitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
