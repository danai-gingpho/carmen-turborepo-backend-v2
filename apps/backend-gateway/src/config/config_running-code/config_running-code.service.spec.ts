import { Test, TestingModule } from '@nestjs/testing';
import { Config_RunningCodeService } from './config_running-code.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_RunningCodeService', () => {
  let service: Config_RunningCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_RunningCodeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_RunningCodeService>(Config_RunningCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
