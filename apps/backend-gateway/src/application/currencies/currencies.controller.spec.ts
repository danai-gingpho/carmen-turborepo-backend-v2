import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService } from './currencies.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CurrenciesController', () => {
  let controller: CurrenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [
        CurrenciesService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<CurrenciesController>(CurrenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
