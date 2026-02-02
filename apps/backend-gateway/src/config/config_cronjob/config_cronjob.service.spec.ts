import { Test, TestingModule } from '@nestjs/testing';
import { ConfigCronjobService } from './config_cronjob.service';

describe('ConfigCronjobService', () => {
  let service: ConfigCronjobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigCronjobService],
    }).compile();

    service = module.get<ConfigCronjobService>(ConfigCronjobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
