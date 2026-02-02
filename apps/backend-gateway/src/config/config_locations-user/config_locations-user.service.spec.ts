import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationsUserService } from './config_locations-user.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationsUserService', () => {
  let service: Config_LocationsUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_LocationsUserService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_LocationsUserService>(Config_LocationsUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
