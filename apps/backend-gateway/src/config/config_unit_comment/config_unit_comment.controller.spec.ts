import { Test, TestingModule } from '@nestjs/testing';
import { Config_UnitCommentController } from './config_unit_comment.controller';
import { Config_UnitCommentService } from './config_unit_comment.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UnitCommentController', () => {
  let controller: Config_UnitCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_UnitCommentController],
      providers: [
        Config_UnitCommentService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_UnitCommentController>(Config_UnitCommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
