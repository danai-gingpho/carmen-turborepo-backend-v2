import { Test, TestingModule } from '@nestjs/testing';
import { Config_RunningCodeController } from './config_running-code.controller';
import { Config_RunningCodeService } from './config_running-code.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_RunningCodeController', () => {
  let controller: Config_RunningCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_RunningCodeController],
      providers: [
        Config_RunningCodeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_RunningCodeController>(Config_RunningCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
