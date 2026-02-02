import { Test, TestingModule } from '@nestjs/testing';
import { Config_VendorsController } from './config_vendors.controller';
import { Config_VendorsService } from './config_vendors.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_VendorsController', () => {
  let controller: Config_VendorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_VendorsController],
      providers: [
        Config_VendorsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_VendorsController>(Config_VendorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
