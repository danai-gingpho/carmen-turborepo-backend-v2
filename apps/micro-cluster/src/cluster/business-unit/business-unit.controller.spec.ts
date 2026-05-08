import { Test, TestingModule } from '@nestjs/testing';
import { BusinessUnitController } from './business-unit.controller';
import { BusinessUnitService } from './business-unit.service';

describe('BusinessUnitController', () => {
  let controller: BusinessUnitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessUnitController],
      providers: [
        BusinessUnitService,
        {
          provide: 'KEYCLOAK_SERVICE',
          useValue: { send: jest.fn(), emit: jest.fn() },
        },
        {
          provide: 'PRISMA_SYSTEM',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<BusinessUnitController>(BusinessUnitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
