import { BadGatewayException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';

const mockBusinessService = {
  send: jest.fn(),
  emit: jest.fn(),
};

const mockFileService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('PhysicalCountDetailCommentService', () => {
  let service: PhysicalCountDetailCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalCountDetailCommentService,
        { provide: 'BUSINESS_SERVICE', useValue: mockBusinessService },
        { provide: 'FILE_SERVICE', useValue: mockFileService },
      ],
    }).compile();

    service = module.get<PhysicalCountDetailCommentService>(
      PhysicalCountDetailCommentService,
    );
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('sends file.upload command with base64 buffer and returns mapped attachment', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 200 },
          data: {
            bu_code: 'HQ-001',
            fileToken: 'tok-1',
            objectName: 'HQ-001/uuid.jpg',
            originalName: 'a.jpg',
            contentType: 'image/jpeg',
            size: 123,
          },
        }),
      );

      const buf = Buffer.from('hello');
      const result = await service.uploadFile(
        {
          originalname: 'a.jpg',
          mimetype: 'image/jpeg',
          buffer: buf,
          size: buf.length,
        } as Express.Multer.File,
        'user-1',
        'HQ-001',
      );

      expect(mockFileService.send).toHaveBeenCalledWith(
        { cmd: 'file.upload', service: 'files' },
        expect.objectContaining({
          fileName: 'a.jpg',
          mimeType: 'image/jpeg',
          buffer: buf.toString('base64'),
          bu_code: 'HQ-001',
          user_id: 'user-1',
        }),
      );
      expect(result).toEqual({
        fileName: 'a.jpg',
        fileToken: 'tok-1',
        fileUrl: '',
        contentType: 'image/jpeg',
        size: 123,
      });
    });

    it('throws when file service returns failure', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: false, response: { status: 500, message: 'boom' } }),
      );
      await expect(
        service.uploadFile(
          {
            originalname: 'a.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('x'),
            size: 1,
          } as Express.Multer.File,
          'user-1',
          'HQ-001',
        ),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('deleteFile', () => {
    it('sends file.delete and resolves true on success', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: true, response: { status: 200 } }),
      );
      const ok = await service.deleteFile('tok-1', 'user-1', 'HQ-001');
      expect(mockFileService.send).toHaveBeenCalledWith(
        { cmd: 'file.delete', service: 'files' },
        expect.objectContaining({ fileToken: 'tok-1', user_id: 'user-1', bu_code: 'HQ-001' }),
      );
      expect(ok).toBe(true);
    });

    it('resolves false on failure (best-effort)', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: false, response: { status: 500, message: 'nope' } }),
      );
      const ok = await service.deleteFile('tok-1', 'user-1', 'HQ-001');
      expect(ok).toBe(false);
    });
  });

  describe('createWithFiles', () => {
    const mkFile = (name: string, mime = 'image/jpeg', size = 100) =>
      ({
        originalname: name,
        mimetype: mime,
        buffer: Buffer.from(name),
        size,
      }) as Express.Multer.File;

    const dto = {
      physical_count_detail_id: '11111111-1111-1111-1111-111111111111',
      message: 'damage',
      type: 'user' as const,
    };

    it('uploads files in parallel and creates comment, returns created result', async () => {
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              bu_code: 'HQ-001',
              fileToken: 'tok-1',
              objectName: 'HQ-001/uuid-a.jpg',
              originalName: 'a.jpg',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              bu_code: 'HQ-001',
              fileToken: 'tok-2',
              objectName: 'HQ-001/uuid-b.jpg',
              originalName: 'b.jpg',
              contentType: 'image/jpeg',
              size: 2,
            },
          }),
        );

      mockBusinessService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 201 },
          data: { id: 'c-1' },
        }),
      );

      const result = await service.createWithFiles(
        [mkFile('a.jpg'), mkFile('b.jpg')],
        dto,
        'user-1',
        'HQ-001',
        'latest',
      );

      expect(mockFileService.send).toHaveBeenCalledTimes(2);
      expect(mockBusinessService.send).toHaveBeenCalledWith(
        { cmd: 'physical-count-detail-comment.create', service: 'physical-count-detail-comment' },
        expect.objectContaining({
          data: expect.objectContaining({
            physical_count_detail_id: dto.physical_count_detail_id,
            message: 'damage',
            type: 'user',
            attachments: [
              expect.objectContaining({ fileToken: 'tok-1' }),
              expect.objectContaining({ fileToken: 'tok-2' }),
            ],
          }),
          user_id: 'user-1',
          bu_code: 'HQ-001',
        }),
      );
      // ResponseLib.created wraps data; just assert it returned something truthy
      expect(result).toBeDefined();
    });

    it('zero files + message: skips upload, calls create with empty attachments', async () => {
      mockBusinessService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 201 },
          data: { id: 'c-1' },
        }),
      );

      await service.createWithFiles([], dto, 'user-1', 'HQ-001', 'latest');

      expect(mockFileService.send).not.toHaveBeenCalled();
      expect(mockBusinessService.send).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ attachments: [] }),
        }),
      );
    });

    it('rolls back uploaded files when one upload fails', async () => {
      // first upload ok, second fails
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              bu_code: 'HQ-001',
              fileToken: 'tok-1',
              objectName: 'HQ-001/uuid-a.jpg',
              originalName: 'a.jpg',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({ success: false, response: { status: 500, message: 'boom' } }),
        )
        // delete call for tok-1
        .mockReturnValueOnce(
          of({ success: true, response: { status: 200 } }),
        );

      await expect(
        service.createWithFiles(
          [mkFile('a.jpg'), mkFile('b.jpg')],
          dto,
          'user-1',
          'HQ-001',
          'latest',
        ),
      ).rejects.toBeInstanceOf(BadGatewayException);

      // expect a delete call with tok-1
      const deleteCall = mockFileService.send.mock.calls.find(
        ([pattern]) => pattern.cmd === 'file.delete',
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![1]).toEqual(
        expect.objectContaining({ fileToken: 'tok-1' }),
      );

      expect(mockBusinessService.send).not.toHaveBeenCalled();
    });

    it('rolls back uploaded files when comment create fails', async () => {
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              bu_code: 'HQ-001',
              fileToken: 'tok-1',
              objectName: 'HQ-001/uuid-a.jpg',
              originalName: 'a.jpg',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({ success: true, response: { status: 200 } }), // delete tok-1
        );

      mockBusinessService.send.mockReturnValueOnce(
        of({
          response: { status: 404, message: 'not found' },
        }),
      );

      const result = await service.createWithFiles(
        [mkFile('a.jpg')],
        dto,
        'user-1',
        'HQ-001',
        'latest',
      );

      // result should be a Result.error (truthy object). assert delete happened.
      const deleteCall = mockFileService.send.mock.calls.find(
        ([pattern]) => pattern.cmd === 'file.delete',
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![1]).toEqual(
        expect.objectContaining({ fileToken: 'tok-1' }),
      );
      expect(result).toBeDefined();
    });
  });
});
