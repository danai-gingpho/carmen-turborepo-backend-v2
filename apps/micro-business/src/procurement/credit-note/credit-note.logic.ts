import { Injectable } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { IClassLogic } from '../interface/class-logic.interface';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { NotificationService, NotificationType, Result, ErrorCode } from '@/common';
import { InventoryTransactionService } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { enum_credit_note_doc_status, enum_credit_note_type } from '@repo/prisma-shared-schema-tenant';

@Injectable()
export class CreditNoteLogic implements IClassLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteLogic.name,
  );

  constructor(
    private readonly creditNoteService: CreditNoteService,
    private readonly mapperLogic: MapperLogic,
    private readonly notificationService: NotificationService,
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) { }
  async create(data: any, user_id: string, tenant_id: string) {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      CreditNoteLogic.name,
    );
    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
     
    const populatedData: Record<string, any> = await this.populateData(
      data,
      user_id,
      tenant_id,
    );
    const createCreditNote = {
      ...data,
      vendor_name: populatedData.vendor_ids[0]?.name,
      grn_no: populatedData.grn_id?.grn_no,
      grn_date: populatedData.grn_id?.grn_date,
      cn_reason_name: populatedData.cn_reason_id?.name,
      cn_reason_description: populatedData.cn_reason_id?.description,
      currency_code: populatedData.currency_ids[0]?.code,
    };

    if (createCreditNote.credit_note_detail?.add?.length) {
      createCreditNote.credit_note_detail.add =
        createCreditNote.credit_note_detail.add.map((detail: Record<string, unknown>) => {
          const returnUnit = populatedData.unit_ids?.find(
            (unit: Record<string, unknown>) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids?.find(
            (product: Record<string, unknown>) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids?.find(
            (location: Record<string, unknown>) => location.id === detail.location_id,
          );

          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...(product && {
                product_id: product.id,
                product_name: product.name,
            product_code: product.code,
            product_sku: product.code,
                product_local_name: product.local_name,
              }),
              ...(returnUnit && {
                return_unit_id: returnUnit.id,
                return_unit_name: returnUnit.name,
              }),
              ...(location && {
                location_id: location.id,
                location_name: location.name,
              }),
            }),
          );
        });
    }

    const result = await this.creditNoteService.create(createCreditNote);

    // Send notification for CN creation
    if (result.isOk()) {
      this.sendCNCreatedNotification(result.value, createCreditNote, user_id);
    }

    return result;
  }

  async update(data: any, user_id: string, tenant_id: string) {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id },
      CreditNoteLogic.name,
    );
    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
     
    const populatedData: Record<string, any> = await this.populateData(
      data,
      user_id,
      tenant_id,
    );
    const updateCreditNote = {
      ...data,
      vendor_name: populatedData.vendor_ids[0]?.name,
      currency_code: populatedData.currency_ids[0]?.code,
      grn_no: populatedData.grn_id?.grn_no,
      grn_date: populatedData.grn_id?.grn_date,
      cn_reason_name: populatedData.cn_reason_id?.name,
      cn_reason_description: populatedData.cn_reason_id?.description,
    };

    if (updateCreditNote.credit_note_detail?.add?.length) {
      updateCreditNote.credit_note_detail.add =
        updateCreditNote.credit_note_detail.add.map((detail: Record<string, unknown>) => {
          const returnUnit = populatedData.unit_ids?.find(
            (unit: Record<string, unknown>) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids?.find(
            (product: Record<string, unknown>) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids?.find(
            (location: Record<string, unknown>) => location.id === detail.location_id,
          );

          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...(product && {
                product_id: product.id,
                product_name: product.name,
            product_code: product.code,
            product_sku: product.code,
                product_local_name: product.local_name,
              }),
              ...(returnUnit && {
                return_unit_id: returnUnit.id,
                return_unit_name: returnUnit.name,
              }),
              ...(location && {
                location_id: location.id,
                location_name: location.name,
              }),
            }),
          );
        });
    }

    if (updateCreditNote.credit_note_detail?.update?.length) {
      updateCreditNote.credit_note_detail.update =
        updateCreditNote.credit_note_detail.update.map((detail: Record<string, unknown>) => {
          const returnUnit = populatedData.unit_ids?.find(
            (unit: Record<string, unknown>) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids?.find(
            (product: Record<string, unknown>) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids?.find(
            (location: Record<string, unknown>) => location.id === detail.location_id,
          );

          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...(product && {
                product_id: product.id,
                product_name: product.name,
            product_code: product.code,
            product_sku: product.code,
                product_local_name: product.local_name,
              }),
              ...(returnUnit && {
                return_unit_id: returnUnit.id,
                return_unit_name: returnUnit.name,
              }),
              ...(location && {
                location_id: location.id,
                location_name: location.name,
              }),
            }),
          );
        });
    }

    return this.creditNoteService.update(updateCreditNote);
  }

  async populateData(data: any, user_id: string, tenant_id: string) {
    this.logger.debug(
      { function: 'populateData', data, user_id, tenant_id },
      CreditNoteLogic.name,
    );
    const product_ids = [];
    const unit_ids = []
    const location_ids = []
    const taxProfile_ids = []

    const headerList = {
      vendor_ids: [data?.vendor_id],
      currency_ids: [data?.currency_id],
      grn_id: data?.grn_id,
      cn_reason_id: data?.cn_reason_id,
    }

    if (data.credit_note_detail?.add?.length) {
      for (const detail of data.credit_note_detail.add) {
        if (detail?.product_id) {
          product_ids.push(detail.product_id);
        }
        if (detail.return_unit_id) {
          unit_ids.push(detail.return_unit_id);
        }
        if (detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if (detail.tax_profile_id) {
          taxProfile_ids.push(detail.tax_profile_id);
        }
      }
    }

    if (data.credit_note_detail?.update?.length) {
      for (const detail of data.credit_note_detail.update) {
        if (detail?.product_id) {
          product_ids.push(detail.product_id);
        }
        if (detail.return_unit_id) {
          unit_ids.push(detail.return_unit_id);
        }
        if (detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if (detail.tax_profile_id) {
          taxProfile_ids.push(detail.tax_profile_id);
        }
      }
    }

    const result = await this.mapperLogic.populate(
      JSON.parse(
        JSON.stringify({
          ...headerList,
          product_ids,
          unit_ids,
          location_ids,
          tax_profile_ids: taxProfile_ids,
        }),
      ),
      user_id,
      tenant_id,
    );

    return result;
  }

  /**
   * Send notification when Credit Note is created
   */
  private async sendCNCreatedNotification(
    cnData: { id: string },
    createData: Record<string, unknown>,
    creatorId: string,
  ): Promise<void> {
    try {
      const cnNo = createData.cn_no || 'N/A';

      await this.notificationService.sendCNNotification(
        creatorId,
        `Credit Note Created: ${cnNo}`,
        `Credit Note ${cnNo} has been created for vendor ${createData.vendor_name || 'N/A'}.`,
        {
          cn_id: cnData.id,
          cn_no: cnNo,
          vendor_id: createData.vendor_id,
          vendor_name: createData.vendor_name,
          grn_id: createData.grn_id,
          grn_no: createData.grn_no,
          action: 'created',
        },
        creatorId,
      );

      this.logger.log(`Notification sent for CN ${cnNo} creation`);
    } catch (error) {
      this.logger.error('Failed to send CN created notification:', error);
    }
  }

  // ==================== Submit ====================

  /**
   * Submit a credit note (no workflow — direct submit from draft):
   * - quantity_return → deduct stock from GRN lots (executeCreditNoteQty)
   * - amount_discount → adjust cost on GRN lots (executeCreditNoteAmount)
   */
  async submit(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'submit', id, user_id, tenant_id }, CreditNoteLogic.name);

    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
    const prisma = this.creditNoteService.prismaService;

    // Fetch CN with details
    const cn = await prisma.tb_credit_note.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_credit_note_detail: {
          where: { deleted_at: null },
        },
      },
    });

    if (!cn) return Result.error('Credit note not found', ErrorCode.NOT_FOUND);

    if (cn.doc_status !== enum_credit_note_doc_status.draft) {
      return Result.error(
        `Cannot submit credit note with status '${cn.doc_status}'. Only draft can be submitted.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Update status to completed
    await prisma.tb_credit_note.update({
      where: { id },
      data: {
        doc_status: enum_credit_note_doc_status.completed,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    // Trigger inventory transaction based on credit_note_type
    if (!cn.grn_id || cn.tb_credit_note_detail.length === 0) {
      return Result.ok({ id, message: 'Credit note submitted (no inventory impact — missing GRN or details)' });
    }

    const method = await this.inventoryTransactionService.getCalculationMethod(tenant_id);

    await prisma.$transaction(async (tx: any) => {
      if (cn.credit_note_type === enum_credit_note_type.quantity_return) {
        // Deduct stock from inventory
        const detailItems = cn.tb_credit_note_detail.map((d) => ({
          product_id: d.product_id,
          location_id: d.location_id || '',
          location_code: d.location_code || null,
          qty: Number(d.return_base_qty) || 0,
          cost_per_unit: Number(d.price) || 0,
        }));

        await this.inventoryTransactionService.executeCreditNoteQty(
          tx,
          { grn_id: cn.grn_id, detail_items: detailItems, user_id },
          method,
        );
      } else if (cn.credit_note_type === enum_credit_note_type.amount_discount) {
        // Adjust cost without moving stock
        const detailItems = cn.tb_credit_note_detail.map((d) => ({
          product_id: d.product_id,
          location_id: d.location_id || '',
          location_code: d.location_code || null,
          amount: Number(d.base_net_amount) || 0,
        }));

        await this.inventoryTransactionService.executeCreditNoteAmount(
          tx,
          { grn_id: cn.grn_id, detail_items: detailItems, user_id },
          method,
        );
      }
    });

    return Result.ok({ id, message: 'Credit note submitted and inventory updated' });
  }
}
