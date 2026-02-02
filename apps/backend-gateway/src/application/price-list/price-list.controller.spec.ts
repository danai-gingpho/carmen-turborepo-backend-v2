import { Test, TestingModule } from '@nestjs/testing';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('PriceListController', () => {
  let controller: PriceListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceListController],
      providers: [
        PriceListService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<PriceListController>(PriceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
