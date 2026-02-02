import { Test, TestingModule } from '@nestjs/testing';
import { Config_UnitsService } from './config_units.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UnitsService', () => {
  let service: Config_UnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_UnitsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_UnitsService>(Config_UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
