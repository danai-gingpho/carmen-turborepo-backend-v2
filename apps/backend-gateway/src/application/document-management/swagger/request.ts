import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentRequestDto {
  @ApiProperty({ description: 'File to upload', type: 'string', format: 'binary' })
  file: any;
}
