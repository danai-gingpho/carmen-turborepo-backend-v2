import { Test, TestingModule } from '@nestjs/testing';
import { Config_TaxProfileController } from './config_tax_profile.controller';
import { Config_TaxProfileService } from './config_tax_profile.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_TaxProfileController', () => {
  let controller: Config_TaxProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_TaxProfileController],
      providers: [
        Config_TaxProfileService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_TaxProfileController>(Config_TaxProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
