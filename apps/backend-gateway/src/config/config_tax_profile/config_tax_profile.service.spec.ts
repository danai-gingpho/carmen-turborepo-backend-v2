import { Test, TestingModule } from '@nestjs/testing';
import { Config_TaxProfileService } from './config_tax_profile.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_TaxProfileService', () => {
  let service: Config_TaxProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_TaxProfileService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_TaxProfileService>(Config_TaxProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
