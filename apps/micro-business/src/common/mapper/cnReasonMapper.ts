import { HttpStatus, Injectable } from '@nestjs/common';
import { BackendLogger } from '../helpers/backend.logger';
import { CreditNoteReasonService } from '@/procurement/credit-note-reason/credit-note-reason.service';

@Injectable()
export class CreditNoteReasonMapper {
  private readonly logger: BackendLogger = new BackendLogger(CreditNoteReasonMapper.name);
  constructor(
    private readonly creditNoteReasonService: CreditNoteReasonService,
  ) { }

  async fetch(id: string, user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-credit-note-reason', id, user_id, bu_code }, CreditNoteReasonMapper.name);
    await this.creditNoteReasonService.initializePrismaService(bu_code, user_id);
    const response = await this.creditNoteReasonService.findOne(id);

    if (response.isError()) {
      throw new Error(response.error.message);
    }

    return response.value;
  }
}
