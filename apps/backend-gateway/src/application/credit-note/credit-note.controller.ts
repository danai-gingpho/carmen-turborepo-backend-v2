import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditNoteService } from './credit-note.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateCreditNoteRequestDto,
  UpdateCreditNoteRequestDto,
} from './swagger/request';
import {
  BaseHttpController,
  Serialize,
  EnrichAuditUsers,
  CreditNoteDetailResponseSchema,
  CreditNoteListItemResponseSchema,
  CreditNoteMutationResponseSchema,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { CreateCreditNoteDto, UpdateCreditNoteDto } from '@/common';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  EXAMPLE_CREATE_CREDIT_NOTE,
  EXAMPLE_UPDATE_CREDIT_NOTE,
} from './example/credit-note.example';

@Controller('api/:bu_code/credit-note')
@ApiTags('Procurement: Credit Notes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class CreditNoteController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteController.name,
  );

  constructor(private readonly creditNoteService: CreditNoteService) {
    super();
  }

  /**
   * Get a credit note by ID with full details
   * ค้นหาใบลดหนี้เดียวตาม ID พร้อมรายละเอียดทั้งหมด
   * @param id - Credit note ID / รหัสใบลดหนี้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit note details / รายละเอียดใบลดหนี้
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('creditNote.findOne'))
  @Serialize(CreditNoteDetailResponseSchema)
  @EnrichAuditUsers({ paths: ['', 'credit_note_detail'] })
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a credit note by ID',
    description: 'Retrieves the full details of a vendor credit note, including the returned/damaged items and credited amounts, for review during accounts payable reconciliation.',
    operationId: 'findOneCreditNote',
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของใบลดหนี้ รวมถึงรายการสินค้าที่ส่งคืน/เสียหายและจำนวนเงินเครดิต สำหรับตรวจสอบระหว่างกระบวนการกระทบยอดบัญชีเจ้าหนี้',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all credit notes with pagination
   * ค้นหาใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit note list / รายการใบลดหนี้แบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('creditNote.findAll'))
  @Serialize(CreditNoteListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all credit notes',
    description: 'Lists all vendor credit notes for the business unit, enabling procurement and finance staff to track credits received for returned or damaged goods.',
    operationId: 'findAllCreditNotes',
    'x-description-th': 'แสดงรายการใบลดหนี้ของผู้ขายทั้งหมดของหน่วยธุรกิจ ช่วยให้เจ้าหน้าที่จัดซื้อและการเงินติดตามเครดิตที่ได้รับจากสินค้าที่ส่งคืนหรือเสียหาย',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {

    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.creditNoteService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new credit note for a vendor
   * สร้างใบลดหนี้ใหม่สำหรับผู้ขาย
   * @param createDto - Credit note creation data / ข้อมูลสำหรับสร้างใบลดหนี้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created credit note / ใบลดหนี้ที่สร้างขึ้น
   */
  @Post()
  @UseGuards(new AppIdGuard('creditNote.create'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a credit note',
    description: 'Issues a new credit note against a vendor for returned, damaged, or incorrect goods received, adjusting the payable balance and triggering inventory corrections.',
    operationId: 'createCreditNote',
    'x-description-th': 'ออกใบลดหนี้ใหม่สำหรับผู้ขายกรณีสินค้าส่งคืน เสียหาย หรือไม่ถูกต้อง เพื่อปรับยอดบัญชีเจ้าหนี้และสร้างรายการปรับปรุงสินค้าคงคลัง',
  } as any)
  @ApiBody({
    type: CreateCreditNoteRequestDto,
    examples: {
      'Create Credit Note': {
        summary: 'Create a quantity return credit note',
        value: EXAMPLE_CREATE_CREDIT_NOTE,
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateCreditNoteDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a credit note before finalization
   * อัปเดตใบลดหนี้ก่อนการดำเนินการขั้นสุดท้าย
   * @param id - Credit note ID / รหัสใบลดหนี้
   * @param updateDto - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated credit note / ใบลดหนี้ที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('creditNote.update'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a credit note',
    description: 'Modifies a credit note before it is finalized, such as correcting item quantities, amounts, or the reason for the credit against the vendor.',
    operationId: 'updateCreditNote',
    'x-description-th': 'แก้ไขใบลดหนี้ก่อนการดำเนินการขั้นสุดท้าย เช่น แก้ไขจำนวนสินค้า จำนวนเงิน หรือเหตุผลในการออกใบลดหนี้ให้ผู้ขาย',
  } as any)
  @ApiBody({
    type: UpdateCreditNoteRequestDto,
    examples: {
      'Update Credit Note': {
        summary: 'Update credit note with add/update/delete details',
        value: EXAMPLE_UPDATE_CREDIT_NOTE,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: UpdateCreditNoteDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: UpdateCreditNoteDto = {
      ...updateDto,
      id,
    };
    const result = await this.creditNoteService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a credit note by ID
   * ลบใบลดหนี้ตาม ID
   * @param id - Credit note ID / รหัสใบลดหนี้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('creditNote.delete'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a credit note',
    description: 'Removes a credit note that was created in error. Historical credit note data is retained for audit and financial reporting purposes.',
    operationId: 'deleteCreditNote',
    'x-description-th': 'ลบใบลดหนี้ที่สร้างผิดพลาด ข้อมูลใบลดหนี้ในอดีตจะถูกเก็บรักษาไว้สำหรับการตรวจสอบและรายงานทางการเงิน',
  } as any)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      'delete',
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Submit a credit note and trigger inventory transaction
   * ส่งใบลดหนี้และสร้างรายการเคลื่อนไหวสินค้าคงคลัง
   */
  @Patch(':id/submit')
  @UseGuards(new AppIdGuard('creditNote.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a credit note',
    description: 'Submits a draft credit note and triggers inventory: quantity_return deducts stock from GRN lots, amount_discount adjusts cost without stock movement.',
    operationId: 'submitCreditNote',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Credit Note ID' },
    ],
    responses: {
      200: { description: 'Credit note submitted and inventory updated' },
      400: { description: 'Credit note cannot be submitted' },
      404: { description: 'Credit note not found' },
    },
    'x-description-th': 'ส่งใบลดหนี้ฉบับร่างและสร้างรายการเคลื่อนไหวสินค้าคงคลัง: กรณีส่งคืนจำนวนจะหักสินค้าออกจากล็อตใบรับสินค้า กรณีส่วนลดเงินจะปรับต้นทุนโดยไม่เคลื่อนไหวสินค้า',
  } as any)
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'submit', id, version },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.submit(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Print a credit note via FastReport viewer (micro-report)
   * พิมพ์ใบลดหนี้ผ่าน FastReport viewer (micro-report)
   */
  @Get(':id/print-viewer')
  @UseGuards(new AppIdGuard('creditNote.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print credit note via FastReport viewer',
    description:
      'Sends CN data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printCreditNoteViewer',
    'x-description-th': 'ส่งข้อมูล CN + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
  } as any)
  @HttpCode(HttpStatus.OK)
  async printToReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'printToReport', id, bu_code },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
