import { Injectable } from '@nestjs/common';
import { enum_good_received_note_status, enum_good_received_note_type, enum_purchase_order_doc_status } from '@repo/prisma-shared-schema-tenant';
import { GoodReceivedNoteService } from './good-received-note.service';
import { InventoryTransactionService, ICreateFromGrnDetailItem } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { NotificationService, Result, ErrorCode, TryCatch } from '@/common';

@Injectable()
export class GoodReceivedNoteLogic {
  private readonly logger = new BackendLogger(GoodReceivedNoteLogic.name);

  constructor(
    private readonly grnService: GoodReceivedNoteService,
    private readonly inventoryTransactionService: InventoryTransactionService,
    private readonly notificationService: NotificationService,
  ) {}

  // ==================== Save ====================

  /**
   * Save a GRN:
   * 1. Set status to saved
   * 2. Create inventory transactions (FIFO/Average cost layers)
   * 3. (PO only) Distribute received qty to junction rows, update PO status
   */
  @TryCatch
  async save(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'save', id, user_id, tenant_id }, GoodReceivedNoteLogic.name);

    const prisma = await this.grnService.getPrismaClient(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const grn = await this.grnService.findGrnWithDetails(prisma, id);
    if (!grn) return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);

    if (grn.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Only draft GRN can be saved', ErrorCode.INVALID_ARGUMENT);
    }

    const isPurchaseOrder = grn.doc_type === enum_good_received_note_type.purchase_order;

    await prisma.$transaction(async (tx: any) => {
      await this.grnService.updateGrnStatus(tx, id, enum_good_received_note_status.saved, user_id);
      await this.createInventoryTransactions(tx, grn, tenant_id, user_id);

      if (isPurchaseOrder) {
        await this.updatePurchaseOrderReceiving(tx, grn, user_id);
      }
    });

    return Result.ok({ id });
  }

  // ==================== Commit ====================

  /**
   * Commit a GRN:
   * Change status from saved to committed
   */
  @TryCatch
  async commit(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'commit', id, user_id, tenant_id }, GoodReceivedNoteLogic.name);

    const prisma = await this.grnService.getPrismaClient(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const grn = await this.grnService.findGrnWithDetails(prisma, id);
    if (!grn) return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);

    if (grn.doc_status !== enum_good_received_note_status.saved) {
      return Result.error('Only saved GRN can be committed', ErrorCode.INVALID_ARGUMENT);
    }

    await prisma.$transaction(async (tx: any) => {
      await this.grnService.updateGrnStatus(tx, id, enum_good_received_note_status.committed, user_id);
    });

    return Result.ok({ id });
  }

  // ==================== Approve ====================

  /**
   * Approve a GRN from saved status — changes status to committed.
   */
  @TryCatch
  async approve(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'approve', id, user_id, tenant_id }, GoodReceivedNoteLogic.name);

    const prisma = await this.grnService.getPrismaClient(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const grn = await this.grnService.findGrnWithDetails(prisma, id);
    if (!grn) return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);

    if (grn.doc_status !== enum_good_received_note_status.saved) {
      return Result.error(
        `Cannot approve GRN with status '${grn.doc_status}'. Only saved GRNs can be approved.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.$transaction(async (tx: any) => {
      await this.grnService.updateGrnStatus(tx, id, enum_good_received_note_status.committed, user_id);
    });

    return Result.ok({ id, message: 'Good Received Note approved successfully' });
  }

  // ==================== Reject ====================

  /**
   * Reject a GRN — voids the document and notifies the creator.
   */
  @TryCatch
  async reject(
    id: string,
    reason: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'reject', id, reason, user_id, tenant_id }, GoodReceivedNoteLogic.name);

    const prisma = await this.grnService.getPrismaClient(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const grn = await this.grnService.findGrnForReject(prisma, id);
    if (!grn) return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);

    const allowedStatuses = [
      enum_good_received_note_status.draft,
      enum_good_received_note_status.saved,
    ];

    if (!allowedStatuses.includes(grn.doc_status)) {
      return Result.error(
        `Cannot reject GRN with status '${grn.doc_status}'. Only draft or saved GRNs can be rejected.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await this.grnService.voidGrn(prisma, id, reason, grn.note, user_id);
    await this.sendRejectionNotification(grn, reason, user_id);

    return Result.ok({ id, message: 'Good Received Note rejected successfully' });
  }

  // ==================== Private helpers ====================

  /**
   * Build detail items from GRN and call inventory transaction service.
   */
  private async createInventoryTransactions(
    tx: any,
    grn: any,
    tenant_id: string,
    user_id: string,
  ): Promise<void> {
    const detailItems: ICreateFromGrnDetailItem[] = [];

    for (const detail of grn.tb_good_received_note_detail) {
      for (const item of detail.tb_good_received_note_detail_item) {
        detailItems.push({
          detail_item_id: item.id,
          product_id: detail.product_id,
          location_id: detail.location_id,
          location_code: detail.location_code || null,
          received_base_qty: Number(item.received_base_qty) || 0,
          base_net_amount: Number(item.base_net_amount) || 0,
        });
      }
    }

    if (detailItems.length === 0) return;

    await this.inventoryTransactionService.createFromGoodReceivedNote(tx, {
      bu_code: tenant_id,
      grn_id: grn.id,
      grn_no: grn.grn_no,
      grn_date: grn.grn_date || new Date(),
      detail_items: detailItems,
      user_id,
    });
  }

  /**
   * For PO-based GRN: update received_qty on junction rows and PO details per item,
   * then update PO status (partial/completed).
   */
  private async updatePurchaseOrderReceiving(
    tx: any,
    grn: any,
    user_id: string,
  ): Promise<void> {
    const affectedPoDetailIds = new Set<string>();

    for (const grnDetail of grn.tb_good_received_note_detail) {
      for (const item of grnDetail.tb_good_received_note_detail_item) {
        const junctionId = item.purchase_order_detail_purchase_request_detail_id;
        if (!junctionId) continue;

        const receivedQty = Number(item.received_qty) || 0;
        if (receivedQty <= 0) continue;

        // Increment received_qty on the junction row directly
        await this.grnService.incrementJunctionReceivedQty(tx, junctionId, receivedQty, user_id);

        // Also increment received_qty on the PO detail
        if (grnDetail.purchase_order_detail_id) {
          affectedPoDetailIds.add(grnDetail.purchase_order_detail_id);
          await this.grnService.incrementPoDetailReceivedQty(
            tx, grnDetail.purchase_order_detail_id, receivedQty, user_id,
          );
        }
      }
    }

    if (affectedPoDetailIds.size > 0) {
      await this.updatePoStatuses(tx, affectedPoDetailIds, user_id);
    }
  }

  /**
   * Check all PO details and set PO status to completed or partial.
   */
  private async updatePoStatuses(
    tx: any,
    affectedPoDetailIds: Set<string>,
    user_id: string,
  ): Promise<void> {
    const poDetails = await this.grnService.getPoDetailsByIds(tx, Array.from(affectedPoDetailIds));
    const uniquePoIds = new Set<string>(poDetails.map((d: any) => d.purchase_order_id));

    for (const poId of uniquePoIds) {
      const allDetails = await this.grnService.getPoDetailsForStatus(tx, poId);

      const allFullyReceived = allDetails.every((d: any) => {
        const orderQty = Number(d.order_qty) || 0;
        const receivedQty = Number(d.received_qty) || 0;
        const cancelledQty = Number(d.cancelled_qty) || 0;
        return receivedQty >= (orderQty - cancelledQty);
      });

      await this.grnService.updatePoStatus(
        tx,
        poId,
        allFullyReceived
          ? enum_purchase_order_doc_status.completed
          : enum_purchase_order_doc_status.partial,
        user_id,
      );
    }
  }

  private async sendRejectionNotification(
    grn: Record<string, any>,
    reason: string,
    rejectorId: string,
  ): Promise<void> {
    try {
      const grnNo = grn.grn_no || 'N/A';
      const creatorId = grn.created_by_id;

      if (creatorId) {
        await this.notificationService.sendGRNNotification(
          creatorId,
          `Good Received Note Rejected: ${grnNo}`,
          `Good Received Note ${grnNo} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
          {
            grn_id: grn.id,
            grn_no: grnNo,
            vendor_id: grn.vendor_id,
            vendor_name: grn.vendor_name,
            action: 'rejected',
            reason,
          },
          rejectorId,
        );
      }

      this.logger.log(`Rejection notification sent for GRN ${grnNo}`);
    } catch (error) {
      this.logger.error('Failed to send GRN rejected notification:', error);
    }
  }
}
