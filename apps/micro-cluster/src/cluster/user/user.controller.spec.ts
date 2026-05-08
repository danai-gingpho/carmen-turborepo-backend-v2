import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const mockUserService = {
    resolveByIds: jest.fn(),
  };

  beforeEach(async () => {
    mockUserService.resolveByIds.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('resolveByIds', () => {
    it('forwards ids to UserService.resolveByIds and wraps as MicroserviceResponse OK', async () => {
      mockUserService.resolveByIds.mockResolvedValue({
        users: [{ id: 'u1', name: 'John Doe' }],
      });

      const res = await controller.resolveByIds({ ids: ['u1', 'u2'] } as any);

      expect(mockUserService.resolveByIds).toHaveBeenCalledWith(['u1', 'u2']);
      expect(res.response.status).toBe(HttpStatus.OK);
      expect(res.response.message).toBe('Success');
      expect(typeof res.response.timestamp).toBe('string');
      expect(res.data).toEqual({ users: [{ id: 'u1', name: 'John Doe' }] });
    });

    it('treats missing ids array as empty', async () => {
      mockUserService.resolveByIds.mockResolvedValue({ users: [] });
      const res = await controller.resolveByIds({} as any);
      expect(mockUserService.resolveByIds).toHaveBeenCalledWith([]);
      expect(res.response.status).toBe(HttpStatus.OK);
      expect(res.data).toEqual({ users: [] });
    });
  });
});
