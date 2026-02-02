import { Injectable } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { IClassLogic } from '../interface/class-logic.interface';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { NotificationService, NotificationType } from '@/common';

@Injectable()
export class CreditNoteLogic implements IClassLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteLogic.name,
  );

  constructor(
    private readonly creditNoteService: CreditNoteService,
    private readonly mapperLogic: MapperLogic,
    private readonly notificationService: NotificationService,
  ) {}
  async create(data: any, user_id: string, tenant_id: string) {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      CreditNoteLogic.name,
    );
    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
    const populatedData: any = await this.populateData(
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
      // workflow_obj: populatedData.workflow_id?.workflow_obj,
      currency_name: populatedData.currency_ids[0]?.name,
    };

    if (createCreditNote.credit_note_detail?.add?.length) {
      createCreditNote.credit_note_detail.add =
        createCreditNote.credit_note_detail.add.map((detail: any) => {
          const returnUnit = populatedData.unit_ids.find(
            (unit: any) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids.find(
            (product: any) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids.find(
            (location: any) => location.id === detail.location_id,
          );

          const product_obj = {
            product_id: product.id,
            product_name: product.name,
            product_local_name: product.local_name,
          };
          const returnUnit_obj = {
            return_unit_id: returnUnit?.id,
            return_unit_name: returnUnit?.name,
          };
          const location_obj = {
            location_id: location?.id,
            location_name: location?.name,
          };


          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...product_obj,
              ...returnUnit_obj,
              ...location_obj,
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
    const populatedData: any = await this.populateData(
      data,
      user_id,
      tenant_id,
    );
    const updateCreditNote = {
      ...data,
      vendor_name: populatedData.vendor_ids[0]?.name,
      currency_name: populatedData.currency_ids[0]?.name,
      grn_no: populatedData.grn_id?.grn_no,
      grn_date: populatedData.grn_id?.grn_date,
      cn_reason_name: populatedData.cn_reason_id?.name,
      cn_reason_description: populatedData.cn_reason_id?.description,
      // workflow_obj: populatedData.workflow_id?.workflow_obj,
    };

    if (updateCreditNote.credit_note_detail?.add?.length) {
      updateCreditNote.credit_note_detail.add =
        updateCreditNote.credit_note_detail.add.map((detail: any) => {
          const returnUnit = populatedData.unit_ids.find(
            (unit: any) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids.find(
            (product: any) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids.find(
            (location: any) => location.id === detail.location_id,
          );

          const product_obj = {
            product_id: product.id,
            product_name: product.name,
            product_local_name: product.local_name,
          };
          const returnUnit_obj = {
            return_unit_id: returnUnit?.id,
            return_unit_name: returnUnit?.name,
          };
          const location_obj = {
            location_id: location?.id,
            location_name: location?.name,
          };

          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...product_obj,
              ...returnUnit_obj,
              ...location_obj,
            }),
          );
        });
    }

    if (updateCreditNote.credit_note_detail?.update?.length) {
      updateCreditNote.credit_note_detail.update =
        updateCreditNote.credit_note_detail.update.map((detail: any) => {
          const returnUnit = populatedData.unit_ids.find(
            (unit: any) => unit.id === detail.return_unit_id,
          );
          const product = populatedData.product_ids.find(
            (product: any) => product.id === detail.product_id,
          );
          const location = populatedData.location_ids.find(
            (location: any) => location.id === detail.location_id,
          );

          const product_obj = {
            product_id: product.id,
            product_name: product.name,
            product_local_name: product.local_name,
          };
          const returnUnit_obj = {
            return_unit_id: returnUnit?.id,
            return_unit_name: returnUnit?.name,
          };
          const location_obj = {
            location_id: location?.id,
            location_name: location?.name,
          };

          return JSON.parse(
            JSON.stringify({
              ...detail,
              ...product_obj,
              ...returnUnit_obj,
              ...location_obj,
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
    const taxTypeInventory_ids = []

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
        if(detail.return_quantity) {
          unit_ids.push(detail.return_quantity);
        }
        if(detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if(data?.return_unit_id) {
          unit_ids.push(data?.return_unit_id);
        }
        if(detail.tax_type_inventory_id) {
          taxTypeInventory_ids.push(detail.tax_type_inventory_id);
        }
      }
    }

    if (data.credit_note_detail?.update?.length) {
      for (const detail of data.credit_note_detail.add) {
        if (detail?.product_id) {
          product_ids.push(detail.product_id);
        }
        if(detail.return_quantity) {
          unit_ids.push(detail.return_quantity);
        }
        if(detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if(data?.return_unit_id) {
          unit_ids.push(data?.return_unit_id);
        }
        if(detail.tax_type_inventory_id) {
          taxTypeInventory_ids.push(detail.tax_type_inventory_id);
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
          tax_type_inventory_ids: taxTypeInventory_ids,
          // workflow_id: data.workflow_id,
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
    createData: any,
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
}
