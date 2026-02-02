import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationsService } from './config_locations.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationsService', () => {
  let service: Config_LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_LocationsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_LocationsService>(Config_LocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
