import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductItemGroupController } from './config_product-item-group.controller';
import { Config_ProductItemGroupService } from './config_product-item-group.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductItemGroupController', () => {
  let controller: Config_ProductItemGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ProductItemGroupController],
      providers: [
        Config_ProductItemGroupService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ProductItemGroupController>(Config_ProductItemGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
