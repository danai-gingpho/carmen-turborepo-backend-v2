import { Test, TestingModule } from '@nestjs/testing';
import { Config_UnitCommentService } from './config_unit_comment.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_UnitCommentService', () => {
  let service: Config_UnitCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_UnitCommentService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_UnitCommentService>(Config_UnitCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
