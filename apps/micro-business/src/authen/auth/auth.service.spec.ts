import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '@/tenant/tenant.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'PRISMA_SYSTEM', useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: 'PRISMA_TENANT', useValue: {} },
        { provide: TenantService, useValue: {} },
        { provide: 'KEYCLOAK_SERVICE', useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
