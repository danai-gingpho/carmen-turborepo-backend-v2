import { Test, TestingModule } from '@nestjs/testing';
import { ConfigCronjobController } from './config_cronjob.controller';
import { ConfigCronjobService } from './config_cronjob.service';

describe('ConfigCronjobController', () => {
  let controller: ConfigCronjobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigCronjobController],
      providers: [ConfigCronjobService],
    }).compile();

    controller = module.get<ConfigCronjobController>(ConfigCronjobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
