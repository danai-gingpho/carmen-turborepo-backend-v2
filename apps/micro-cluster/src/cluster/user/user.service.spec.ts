import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const mockPrisma = {
    tb_user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockPrisma.tb_user.findMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'KEYCLOAK_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'PRISMA_SYSTEM', useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveByIds', () => {
    it('returns empty array when ids is empty (skips DB call)', async () => {
      const result = await service.resolveByIds([]);
      expect(result).toEqual({ users: [] });
      expect(mockPrisma.tb_user.findMany).not.toHaveBeenCalled();
    });

    it('queries with select + profile include and maps to { id, name }', async () => {
      mockPrisma.tb_user.findMany.mockResolvedValue([
        {
          id: 'u1',
          username: 'jdoe',
          email: 'jdoe@example.com',
          alias_name: 'JD',
          tb_user_profile_tb_user_profile_user_idTotb_user: [
            { firstname: 'John', middlename: null, lastname: 'Doe' },
          ],
        },
        {
          id: 'u2',
          username: 'system',
          email: 'system@example.com',
          alias_name: null,
          tb_user_profile_tb_user_profile_user_idTotb_user: [],
        },
      ]);

      const result = await service.resolveByIds(['u1', 'u2', 'u3']);

      expect(mockPrisma.tb_user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1', 'u2', 'u3'] } },
        select: {
          id: true,
          username: true,
          email: true,
          alias_name: true,
          tb_user_profile_tb_user_profile_user_idTotb_user: {
            select: { firstname: true, middlename: true, lastname: true },
          },
        },
      });
      expect(result).toEqual({
        users: [
          { id: 'u1', name: 'John Doe' },
          { id: 'u2', name: 'system' },
        ],
      });
    });

    it('omits ids that are not found (no Unknown placeholder server-side)', async () => {
      mockPrisma.tb_user.findMany.mockResolvedValue([]);
      const result = await service.resolveByIds(['ghost']);
      expect(result).toEqual({ users: [] });
    });

    it('returns { users: [] } and logs a warning when findMany rejects', async () => {
      mockPrisma.tb_user.findMany.mockRejectedValue(new Error('connection lost'));
      const result = await service.resolveByIds(['u1']);
      expect(result).toEqual({ users: [] });
    });
  });
});
