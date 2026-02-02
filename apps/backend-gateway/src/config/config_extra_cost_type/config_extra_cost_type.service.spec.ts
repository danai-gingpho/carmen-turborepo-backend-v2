import { Test, TestingModule } from '@nestjs/testing';
import { Config_ExtraCostTypeService } from './config_extra_cost_type.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ExtraCostTypeService', () => {
  let service: Config_ExtraCostTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ExtraCostTypeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ExtraCostTypeService>(
      Config_ExtraCostTypeService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
