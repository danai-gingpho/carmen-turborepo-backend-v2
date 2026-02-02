import { Test, TestingModule } from '@nestjs/testing';
import { Config_UserLocationService } from './config_user-location.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UserLocationService', () => {
  let service: Config_UserLocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_UserLocationService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_UserLocationService>(Config_UserLocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
