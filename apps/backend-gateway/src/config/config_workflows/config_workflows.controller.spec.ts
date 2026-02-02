import { Test, TestingModule } from '@nestjs/testing';
import { Config_WorkflowsController } from './config_workflows.controller';
import { Config_WorkflowsService } from './config_workflows.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_WorkflowsController', () => {
  let controller: Config_WorkflowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_WorkflowsController],
      providers: [
        Config_WorkflowsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_WorkflowsController>(Config_WorkflowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
