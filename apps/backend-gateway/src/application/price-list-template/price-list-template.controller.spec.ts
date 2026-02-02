import { Test, TestingModule } from '@nestjs/testing';
import { PriceListTemplateController } from './price-list-template.controller';
import { PriceListTemplateService } from './price-list-template.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('PriceListTemplateController', () => {
  let controller: PriceListTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceListTemplateController],
      providers: [
        PriceListTemplateService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<PriceListTemplateController>(
      PriceListTemplateController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
