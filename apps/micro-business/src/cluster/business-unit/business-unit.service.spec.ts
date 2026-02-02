import { Test, TestingModule } from '@nestjs/testing';
import { BusinessUnitService } from './business-unit.service';

describe('BusinessUnitService', () => {
  let service: BusinessUnitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessUnitService],
    }).compile();

    service = module.get<BusinessUnitService>(BusinessUnitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
