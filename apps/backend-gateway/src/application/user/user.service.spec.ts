import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';


const mockAuthService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
