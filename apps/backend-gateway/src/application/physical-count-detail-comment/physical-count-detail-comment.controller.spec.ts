import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PhysicalCountDetailCommentController } from './physical-count-detail-comment.controller';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const mockService = {
  createWithFiles: jest.fn(),
};

// ExtractRequestHeader reads req.user.user_id, not raw headers
const fakeReq = {
  user: { user_id: 'user-1' },
  headers: {},
} as unknown as Request;

const mkFile = (
  name: string,
  mime: string,
  size: number,
): Express.Multer.File =>
  ({
    originalname: name,
    mimetype: mime,
    buffer: Buffer.alloc(size),
    size,
  }) as Express.Multer.File;

// Passthrough guard stub — always allows
const allowGuard = { canActivate: () => true };

describe('PhysicalCountDetailCommentController.createWithFiles', () => {
  let controller: PhysicalCountDetailCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhysicalCountDetailCommentController],
      providers: [
        { provide: PhysicalCountDetailCommentService, useValue: mockService },
      ],
    })
      .overrideGuard(KeycloakGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get(PhysicalCountDetailCommentController);
    jest.clearAllMocks();
  });

  const PHYSICAL_COUNT_DETAIL_ID = '11111111-1111-1111-1111-111111111111';
  const validBody = {
    message: 'hello',
    type: 'user',
  };

  it('rejects when no message and no files', async () => {
    await expect(
      controller.createWithFiles(
        'HQ-001',
        PHYSICAL_COUNT_DETAIL_ID,
        [],
        { type: 'user' },
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects too many files', async () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      mkFile(`f${i}.jpg`, 'image/jpeg', 100),
    );
    await expect(
      controller.createWithFiles(
        'HQ-001',
        PHYSICAL_COUNT_DETAIL_ID,
        files,
        validBody,
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects file too large', async () => {
    const big = mkFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024);
    await expect(
      controller.createWithFiles(
        'HQ-001',
        PHYSICAL_COUNT_DETAIL_ID,
        [big],
        validBody,
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bad mime', async () => {
    const txt = mkFile('a.txt', 'text/plain', 10);
    await expect(
      controller.createWithFiles(
        'HQ-001',
        PHYSICAL_COUNT_DETAIL_ID,
        [txt],
        validBody,
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts valid request and forwards to service', async () => {
    mockService.createWithFiles.mockResolvedValueOnce({ ok: true });
    const file = mkFile('a.jpg', 'image/jpeg', 100);

    const result = await controller.createWithFiles(
      'HQ-001',
      PHYSICAL_COUNT_DETAIL_ID,
      [file],
      validBody,
      fakeReq,
    );

    expect(mockService.createWithFiles).toHaveBeenCalledWith(
      [file],
      expect.objectContaining({
        physical_count_detail_id: PHYSICAL_COUNT_DETAIL_ID,
        message: 'hello',
        type: 'user',
      }),
      expect.any(String), // user_id from req.user.user_id
      'HQ-001',
      'latest',
    );
    expect(result).toEqual({ ok: true });
  });

  it('accepts pdf', async () => {
    mockService.createWithFiles.mockResolvedValueOnce({ ok: true });
    const pdf = mkFile('a.pdf', 'application/pdf', 1000);

    await controller.createWithFiles(
      'HQ-001',
      PHYSICAL_COUNT_DETAIL_ID,
      [pdf],
      validBody,
      fakeReq,
    );
    expect(mockService.createWithFiles).toHaveBeenCalled();
  });
});
