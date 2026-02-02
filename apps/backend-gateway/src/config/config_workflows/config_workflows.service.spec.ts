import { Test, TestingModule } from '@nestjs/testing';
import { Config_WorkflowsService } from './config_workflows.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_WorkflowsService', () => {
  let service: Config_WorkflowsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_WorkflowsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_WorkflowsService>(Config_WorkflowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
