import { Test, TestingModule } from '@nestjs/testing';
import { DocumentManagementController } from './document-management.controller';
import { DocumentManagementService } from './document-management.service';
import { HttpStatus } from '@nestjs/common';
import { Result } from '@/common';

const mockFileService = {
  send: jest.fn(),
  emit: jest.fn(),
};

const mockDocumentManagementService = {
  uploadDocument: jest.fn(),
  getDocument: jest.fn(),
  getDocumentInfo: jest.fn(),
  deleteDocument: jest.fn(),
  listDocuments: jest.fn(),
  getPresignedUrl: jest.fn(),
};

const mockRequest = {
  headers: {
    'x-tenant-id': 'tenant-123',
  },
  user: {
    user_id: 'user-123',
  },
} as unknown as Request;

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('DocumentManagementController', () => {
  let controller: DocumentManagementController;
  let service: DocumentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentManagementController],
      providers: [
        {
          provide: DocumentManagementService,
          useValue: mockDocumentManagementService,
        },
        {
          provide: 'FILE_SERVICE',
          useValue: mockFileService,
        },
      ],
    }).compile();

    controller = module.get<DocumentManagementController>(DocumentManagementController);
    service = module.get<DocumentManagementService>(DocumentManagementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const mockResult = Result.ok({ fileToken: 'test-token-123' });
      mockDocumentManagementService.uploadDocument.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.uploadDocument(mockFile, 'BU001', mockRequest, mockRes as any);

      expect(service.uploadDocument).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype,
        'user-123',
        'BU001',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return error when no file provided', async () => {
      const mockRes = createMockResponse();
      await controller.uploadDocument(
        undefined as unknown as Express.Multer.File,
        'BU001',
        mockRequest,
        mockRes as any,
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('listDocuments', () => {
    it('should list documents with pagination', async () => {
      const mockResult = Result.ok([{ fileToken: 'token-1' }, { fileToken: 'token-2' }]);
      mockDocumentManagementService.listDocuments.mockResolvedValue(mockResult);

      const query = { page: '1', perpage: '10' };
      const mockRes = createMockResponse();
      await controller.listDocuments('BU001', mockRequest, mockRes as any, query);

      expect(service.listDocuments).toHaveBeenCalledWith(
        'BU001',
        'user-123',
        expect.any(Object),
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('getDocument', () => {
    it('should get document by token', async () => {
      const mockResult = Result.ok({
        fileToken: 'test-token-123',
        fileName: 'test.pdf',
        buffer: 'base64data',
      });
      mockDocumentManagementService.getDocument.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.getDocument('test-token-123', 'BU001', mockRequest, mockRes as any);

      expect(service.getDocument).toHaveBeenCalledWith(
        'test-token-123',
        'user-123',
        'BU001',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('getDocumentInfo', () => {
    it('should get document info', async () => {
      const mockResult = Result.ok({
        fileToken: 'test-token-123',
        originalName: 'test.pdf',
        size: 1024,
      });
      mockDocumentManagementService.getDocumentInfo.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.getDocumentInfo('test-token-123', 'BU001', mockRequest, mockRes as any);

      expect(service.getDocumentInfo).toHaveBeenCalledWith(
        'test-token-123',
        'user-123',
        'BU001',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('getPresignedUrl', () => {
    it('should get presigned URL', async () => {
      const mockResult = Result.ok({
        fileToken: 'test-token-123',
        url: 'https://storage.example.com/presigned',
        expiresIn: 3600,
      });
      mockDocumentManagementService.getPresignedUrl.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.getPresignedUrl(
        'test-token-123',
        'BU001',
        mockRequest,
        mockRes as any,
        '3600',
      );

      expect(service.getPresignedUrl).toHaveBeenCalledWith(
        'test-token-123',
        'user-123',
        'BU001',
        3600,
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should get presigned URL with default expiry', async () => {
      const mockResult = Result.ok({
        fileToken: 'test-token-123',
        url: 'https://storage.example.com/presigned',
      });
      mockDocumentManagementService.getPresignedUrl.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.getPresignedUrl(
        'test-token-123',
        'BU001',
        mockRequest,
        mockRes as any,
        undefined,
      );

      expect(service.getPresignedUrl).toHaveBeenCalledWith(
        'test-token-123',
        'user-123',
        'BU001',
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      const mockResult = Result.ok({ fileToken: 'test-token-123' });
      mockDocumentManagementService.deleteDocument.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.deleteDocument('test-token-123', 'BU001', mockRequest, mockRes as any);

      expect(service.deleteDocument).toHaveBeenCalledWith(
        'test-token-123',
        'user-123',
        'BU001',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
