import { Test, TestingModule } from '@nestjs/testing';
import { UserBusinessUnitController } from './user-business-unit.controller';
import { UserBusinessUnitService } from './user-business-unit.service';


const mockClusterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('UserBusinessUnitController', () => {
  let controller: UserBusinessUnitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserBusinessUnitController],
      providers: [
        UserBusinessUnitService,
        {
          provide: 'CLUSTER_SERVICE',
          useValue: mockClusterService,
        },
      ],
    }).compile();

    controller = module.get<UserBusinessUnitController>(UserBusinessUnitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
