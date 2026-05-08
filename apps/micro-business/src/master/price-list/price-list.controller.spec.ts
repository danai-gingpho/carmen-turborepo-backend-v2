import { Test, TestingModule } from '@nestjs/testing';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';
import { PriceListLogic } from './price-list.logic';

describe('PriceListController', () => {
  let controller: PriceListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceListController],
      providers: [
        { provide: PriceListService, useValue: {} },
        { provide: PriceListLogic, useValue: {} },
      ],
    }).compile();

    controller = module.get<PriceListController>(PriceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
