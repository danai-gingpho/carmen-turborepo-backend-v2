import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

const mockAuthServiceClient = {
  send: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthServiceClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
