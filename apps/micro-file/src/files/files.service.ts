import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { envConfig } from '@/libs/config.env';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import {
  IPurchaseRequestDetail,
  IPurchaseRequest,
  state_status,
  RejectPurchaseRequestDto,
  Stage,
  ReviewPurchaseRequestDto,
  SubmitPurchaseRequest,
  GlobalApiReturn,
  IDefaultCurrencyObject,
  PurchaseRequestDetailResponseSchema,
  PurchaseRequestListItemResponseSchema,
  TryCatch,
  Result,
  ErrorCode,
} from '@/common';

export interface FileInfo {
  fileToken: string;
  objectName: string;
  originalName: string;
  size: number;
  contentType: string;
  lastModified: Date;
}

export interface UploadResult {
  bu_code: string;
  fileToken: string;
  objectName: string;
  originalName: string;
  size: number;
  contentType: string;
}

export interface IPaginate {
  page: number;
  perpage: number;
  search: string;
  searchfields: string[];
  sort: string[];
  filter: Record<string, any>;
  advance: any;
  bu_code: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  paginate: {
    total: number;
    page: number;
    perpage: number;
    pages: number;
  };
}

// Helper function to encode filename for Content-Disposition header (RFC 5987)
const encodeContentDisposition = (filename: string): string => {
  // Check if filename contains non-ASCII characters
  const hasNonAscii = /[^\x20-\x7E]/.test(filename);

  if (!hasNonAscii) {
    // For ASCII-only filenames, use simple format
    return `attachment; filename="${filename}"`;
  }

  // For non-ASCII filenames, use RFC 5987 encoding
  const asciiName = filename.replace(/[^\x20-\x7E]/g, '_');
  const encodedName = encodeURIComponent(filename).replace(/['()]/g, escape);
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
};

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new BackendLogger(FilesService.name);
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  // In-memory file token mapping (in production, consider using a database)
  private fileTokenMap = new Map<
    string,
    { objectName: string; originalName: string; contentType: string }
  >();

  constructor() {
    const endpoint = new URL(envConfig.MINIO_ENDPOINT);

    this.minioClient = new Minio.Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? parseInt(endpoint.port) : 9000,
      useSSL: endpoint.protocol === 'https:',
      accessKey: envConfig.MINIO_ACCESS_KEY,
      secretKey: envConfig.MINIO_SECRET_KEY,
    });

    this.bucketName = envConfig.MINIO_BUCKET_NAME;
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error checking/creating bucket: ${err.message}`);
    }
  }

  /**
   * Upload a file with token-based naming
   */
  async uploadFile(
    file: Express.Multer.File,
    buCode: string,
  ): Promise<UploadResult> {
    // Generate unique file token and object name
    const fileToken = `${buCode}/${randomUUID()}`;
    const fileExtension = file.originalname.split('.').pop() || '';
    const objectName = `${fileToken}${fileExtension ? `.${fileExtension}` : ''}`;

    const metaData = {
      'Content-Type': file.mimetype || 'application/octet-stream',
      'X-Original-Name': encodeURIComponent(file.originalname),
    };

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      file.buffer,
      file.size,
      metaData,
    );

    // Store file mapping
    this.fileTokenMap.set(fileToken, {
      objectName,
      originalName: file.originalname,
      contentType: file.mimetype || 'application/octet-stream',
    });

    this.logger.log(`File uploaded: ${objectName}`);

    return {
      bu_code: buCode,
      fileToken,
      objectName,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype || 'application/octet-stream',
    };
  }

  /**
   * Upload a file with optional folder prefix (legacy support)
   */
  async uploadFileWithFolder(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const fileToken = folder
      ? `${folder}/${timestamp}-${randomUUID()}`
      : `${timestamp}-${randomUUID()}`;
    const fileExtension = file.originalname.split('.').pop() || '';
    const objectName = `${fileToken}${fileExtension ? `.${fileExtension}` : ''}`;

    const metaData = {
      'Content-Type': file.mimetype || 'application/octet-stream',
      'X-Original-Name': encodeURIComponent(file.originalname),
    };

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      file.buffer,
      file.size,
      metaData,
    );

    // Store file mapping
    this.fileTokenMap.set(fileToken, {
      objectName,
      originalName: file.originalname,
      contentType: file.mimetype || 'application/octet-stream',
    });

    this.logger.log(`File uploaded: ${objectName}`);

    return {
      bu_code: folder || '',
      fileToken,
      objectName,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype || 'application/octet-stream',
    };
  }

  /**
   * Get file stream by file token
   */
  async getFile(fileToken: string): Promise<{
    stream: Readable;
    originalName: string;
    contentType: string;
    size: number;
    contentDisposition: string;
  }> {
    const fileInfo = this.fileTokenMap.get(fileToken);
    let objectName: string;
    let originalName: string;
    let contentType: string;

    if (!fileInfo) {
      // Try to get file directly from MinIO using token as object name prefix
      const objects = await this.findObjectsByPrefix(fileToken);

      if (objects.length === 0) {
        throw new Error('File not found');
      }

      objectName = objects[0];
      const stat = await this.minioClient.statObject(this.bucketName, objectName);

      originalName = stat.metaData?.['x-original-name']
        ? decodeURIComponent(stat.metaData['x-original-name'])
        : objectName;
      contentType = stat.metaData?.['content-type'] || 'application/octet-stream';
    } else {
      objectName = fileInfo.objectName;
      originalName = fileInfo.originalName;
      contentType = fileInfo.contentType;
    }

    const stat = await this.minioClient.statObject(this.bucketName, objectName);
    const stream = await this.minioClient.getObject(this.bucketName, objectName);
    const contentDisposition = encodeContentDisposition(originalName);

    return {
      stream,
      originalName,
      contentType,
      size: stat.size,
      contentDisposition,
    };
  }

  /**
   * Get file buffer by file token
   */
  async getFileBuffer(fileToken: string): Promise<{
    buffer: Buffer;
    originalName: string;
    contentType: string;
    size: number;
  }> {
    const fileData = await this.getFile(fileToken);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      fileData.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      fileData.stream.on('error', reject);
      fileData.stream.on('end', () =>
        resolve({
          buffer: Buffer.concat(chunks),
          originalName: fileData.originalName,
          contentType: fileData.contentType,
          size: fileData.size,
        }),
      );
    });
  }

  /**
   * Get file info by file token
   */
  async getFileInfo(fileToken: string): Promise<FileInfo> {
    const fileInfo = this.fileTokenMap.get(fileToken);
    let objectName: string;
    let originalName: string;
    let contentType: string;

    if (!fileInfo) {
      // Try to get file directly from MinIO using token as object name prefix
      const objects = await this.findObjectsByPrefix(fileToken);

      if (objects.length === 0) {
        throw new Error('File not found');
      }

      objectName = objects[0];
      const stat = await this.minioClient.statObject(this.bucketName, objectName);

      originalName = stat.metaData?.['x-original-name']
        ? decodeURIComponent(stat.metaData['x-original-name'])
        : objectName;
      contentType = stat.metaData?.['content-type'] || 'application/octet-stream';

      return {
        fileToken,
        objectName,
        originalName,
        size: stat.size,
        contentType,
        lastModified: stat.lastModified,
      };
    }

    const stat = await this.minioClient.statObject(
      this.bucketName,
      fileInfo.objectName,
    );

    return {
      fileToken,
      objectName: fileInfo.objectName,
      originalName: fileInfo.originalName,
      size: stat.size,
      contentType: fileInfo.contentType,
      lastModified: stat.lastModified,
    };
  }

  /**
   * Delete file by file token
   */
  async deleteFile(fileToken: string): Promise<void> {
    const fileInfo = this.fileTokenMap.get(fileToken);

    if (fileInfo) {
      await this.minioClient.removeObject(this.bucketName, fileInfo.objectName);
      this.fileTokenMap.delete(fileToken);
      this.logger.log(`File deleted: ${fileInfo.objectName}`);
      return;
    }

    // Try to find file directly in MinIO using token as prefix
    const objects = await this.findObjectsByPrefix(fileToken);

    if (objects.length === 0) {
      throw new Error('File not found');
    }

    await this.minioClient.removeObject(this.bucketName, objects[0]);
    this.logger.log(`File deleted: ${objects[0]}`);
  }

  /**
   * List files with pagination support
   */
  async listFiles(paginate: IPaginate): Promise<any> {
    const bu_code = paginate.bu_code[0];
    // Check if bucket exists    
    const bucketExists = await this.minioClient.bucketExists(this.bucketName);
    if (!bucketExists) {
      return {
        data: [],
        paginate: {
          total: 0,
          page: paginate.page,
          perpage: paginate.perpage,
          pages: 0,
        },
      };
    }

    // List all objects in the bucket with bu_code prefix
    const prefix = bu_code ? `${bu_code}/` : '';
    const objectNames: Array<{ name: string; size: number; lastModified: Date }> =
      [];

    await new Promise<void>((resolve, reject) => {
      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
      stream.on('data', (obj) => {
        if (obj.name) {
          objectNames.push({
            name: obj.name,
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
          });
        }
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    // Fetch metadata for each object
    const files: FileInfo[] = [];
    for (const obj of objectNames) {
      try {
        const stat = await this.minioClient.statObject(this.bucketName, obj.name);

        // Extract file token from object name (remove extension)
        const nameParts = obj.name.split('.');
        if (nameParts.length > 1) nameParts.pop();
        const fileToken = nameParts.join('.');

        // Get original name from metadata
        const originalName = stat.metaData?.['x-original-name']
          ? decodeURIComponent(stat.metaData['x-original-name'])
          : obj.name;

        const contentType =
          stat.metaData?.['content-type'] || 'application/octet-stream';

        files.push({
          fileToken,
          objectName: obj.name,
          originalName,
          size: obj.size,
          contentType,
          lastModified: obj.lastModified,
        });
      } catch {
        // If stat fails, use basic info
        const nameParts = obj.name.split('.');
        if (nameParts.length > 1) nameParts.pop();
        const fileToken = nameParts.join('.');

        files.push({
          fileToken,
          objectName: obj.name,
          originalName: obj.name,
          size: obj.size,
          contentType: 'application/octet-stream',
          lastModified: obj.lastModified,
        });
      }
    }

    // Apply search filter
    let filteredFiles = files;
    if (paginate.search) {
      const searchLower = paginate.search.toLowerCase();
      filteredFiles = files.filter((file) =>
        paginate.searchfields.some((field) => {
          const value = file[field as keyof FileInfo];
          return value && String(value).toLowerCase().includes(searchLower);
        }),
      );
    }

    // Apply content type filter
    if (paginate.filter?.contentType) {
      filteredFiles = filteredFiles.filter((file) =>
        file.contentType.includes(paginate.filter.contentType),
      );
    }

    // Apply sorting
    filteredFiles.sort((a, b) => {
      for (const sortField of paginate.sort) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        const aVal = a[field as keyof FileInfo];
        const bVal = b[field as keyof FileInfo];

        if (aVal instanceof Date && bVal instanceof Date) {
          const diff = desc
            ? bVal.getTime() - aVal.getTime()
            : aVal.getTime() - bVal.getTime();
          if (diff !== 0) return diff;
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          const diff = desc ? bVal - aVal : aVal - bVal;
          if (diff !== 0) return diff;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          const diff = desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          if (diff !== 0) return diff;
        }
      }
      return 0;
    });

    // Apply pagination
    const total = filteredFiles.length;
    const pages = Math.ceil(total / paginate.perpage);
    const startIndex = (paginate.page - 1) * paginate.perpage;
    const paginatedFiles = filteredFiles.slice(
      startIndex,
      startIndex + paginate.perpage,
    );

    return {
      data: paginatedFiles,
      paginate: {
        total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages,
      },
    };
  }

  /**
   * List files with simple prefix (legacy support)
   */
  async listFilesSimple(prefix?: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      const files: FileInfo[] = [];
      const stream = this.minioClient.listObjects(
        this.bucketName,
        prefix || '',
        true,
      );

      stream.on('data', (obj) => {
        if (obj.name) {
          // Extract file token from object name (remove extension)
          const nameParts = obj.name.split('.');
          if (nameParts.length > 1) nameParts.pop();
          const fileToken = nameParts.join('.');

          files.push({
            fileToken,
            objectName: obj.name,
            originalName: obj.name,
            size: obj.size,
            contentType: 'application/octet-stream',
            lastModified: obj.lastModified,
          });
        }
      });

      stream.on('error', (err) => {
        this.logger.error(`Error listing files: ${err.message}`);
        reject(err);
      });

      stream.on('end', () => {
        resolve(files);
      });
    });
  }

  /**
   * Get presigned URL for file download
   */
  async getPresignedUrl(
    fileToken: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    const fileInfo = this.fileTokenMap.get(fileToken);
    let objectName: string;

    if (!fileInfo) {
      const objects = await this.findObjectsByPrefix(fileToken);
      if (objects.length === 0) {
        throw new Error('File not found');
      }
      objectName = objects[0];
    } else {
      objectName = fileInfo.objectName;
    }

    const url = await this.minioClient.presignedGetObject(
      this.bucketName,
      objectName,
      expirySeconds,
    );
    return url;
  }

  /**
   * Helper to find objects by prefix
   */
  private async findObjectsByPrefix(prefix: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const objects: string[] = [];
      const listStream = this.minioClient.listObjects(
        this.bucketName,
        '',
        true,
      );

      listStream.on('data', (obj) => {
        if (obj.name && obj.name.includes(prefix)) objects.push(obj.name);
      });
      listStream.on('error', reject);
      listStream.on('end', () => resolve(objects));
    });
  }

  /**
   * Encode content disposition helper (exposed for controller use)
   */
  getContentDisposition(filename: string): string {
    return encodeContentDisposition(filename);
  }
}
