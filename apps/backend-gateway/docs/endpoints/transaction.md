# Transaction Flows & Concurrency

เอกสารนี้อธิบายขั้นตอนการทำงานของ transaction ที่สำคัญ และวิธีป้องกัน race condition

---

## Table of Contents

- [Stock In (Create & Adjust Inventory)](#stock-in-create--adjust-inventory)
- [Stock Out (Create & Adjust Inventory)](#stock-out-create--adjust-inventory)
- [GRN Commit](#grn-commit)
- [GRN Commit — PO Flow Detail](#grn-commit--po-flow-detail)
- [Why FOR UPDATE + Prisma Increment](#why-for-update--prisma-increment)

---

## Stock In (Create & Adjust Inventory)

**Endpoint:** `POST /api/:bu_code/stock-in`
**File:** `micro-business/src/inventory/stock-in/stock-in.service.ts`

ไม่มี draft — สร้างเอกสารและปรับ inventory ทันทีใน transaction เดียว

```
Single $transaction:
  1. Create tb_stock_in (doc_status = completed)
  2. For each detail (sequential, not parallel):
     a. Create tb_stock_in_detail
     b. Call inventoryTransactionService.executeAdjustmentIn(tx, ...)
        -> Creates tb_inventory_transaction header
        -> Creates tb_inventory_transaction_detail (positive qty)
        -> Creates tb_inventory_transaction_cost_layer (FIFO or Average)
     c. Link inventory_transaction_id back to detail
```

**ทำไมต้อง sequential?** ถ้า process แบบ parallel จะมี race condition บน cost layer — สินค้าเดียวกันอาจอ่าน average cost ซ้ำกันและ calculate ผิด

**ถ้า fail?** Transaction rollback ทั้งหมด — ไม่มีเอกสาร ไม่มี inventory เปลี่ยน

---

## Stock Out (Create & Adjust Inventory)

**Endpoint:** `POST /api/:bu_code/stock-out`
**File:** `micro-business/src/inventory/stock-out/stock-out.service.ts`

เหมือน Stock In แต่เรียก `executeAdjustmentOut` แทน (FIFO consumption / Average deduction)

```
Single $transaction:
  1. Create tb_stock_out (doc_status = completed)
  2. For each detail (sequential):
     a. Create tb_stock_out_detail
     b. Call inventoryTransactionService.executeAdjustmentOut(tx, ...)
        -> Consumes from FIFO lots (oldest first) or Average cost
        -> Creates tb_inventory_transaction_detail (negative qty)
     c. Link inventory_transaction_id back to detail
```

**ถ้า stock ไม่พอ?** Throws error ภายใน transaction -> rollback ทั้งหมด

---

## GRN Commit

**Endpoint:** `PATCH /api/:bu_code/good-received-note/:id/commit`
**File:** `micro-business/src/inventory/good-received-note/good-received-note.logic.ts`

ยืนยัน GRN — สร้าง inventory transaction และ (ถ้าเป็น PO-based) อัพเดทจำนวนรับใน PO

### Manual GRN (`doc_type = manual`)

```
Single $transaction:
  1. Update GRN status -> committed
  2. Create inventory transactions (via createFromGoodReceivedNote)
     -> FIFO/Average cost layers per detail item
```

ไม่ยุ่งกับ PO เลย — เข้า inventory ตรงๆ

### PO-based GRN (`doc_type = purchase_order`)

```
Single $transaction:
  1. Update GRN status -> committed
  2. Create inventory transactions (same as manual)
  3. For each GRN detail that links to PO detail:
     a. Distribute received qty to junction rows (see detail below)
     b. Increment PO detail received_qty
  4. Update PO header status:
     - All details fully received -> 'completed'
     - Otherwise -> 'partial'
```

---

## GRN Commit — PO Flow Detail

### ปัญหา: จะกระจาย received_qty ไปยัง junction rows อย่างไร?

เมื่อ PO detail 1 รายการ อาจมาจาก PR หลายใบ (หลาย location) — junction table
`tb_purchase_order_detail_tb_purchase_request_detail` เก็บ:
- `pr_detail_qty` — จำนวนที่ PR ขอ
- `received_qty` — จำนวนที่รับแล้ว

**Algorithm: Fill smallest remain first**

```
remain = pr_detail_qty - received_qty

1. SELECT junction rows WHERE po_detail_id = X ... FOR UPDATE
2. Sort by remain ASC (น้อยสุดก่อน)
3. Loop:
   - fillQty = min(remaining, row.remain)
   - UPDATE row SET received_qty += fillQty  (atomic increment)
   - remaining -= fillQty
   - Break when remaining = 0
```

**ทำไมเติมน้อยก่อน?** เพื่อปิด location ที่เหลือน้อยก่อน ลดจำนวน location ที่ยังค้างอยู่

### Race Condition Protection

```
+-----------+    +-----------+
| GRN #1    |    | GRN #2    |    (commit พร้อมกัน, PO เดียวกัน)
+-----------+    +-----------+
      |                |
      v                v
  SELECT ... FOR UPDATE    (GRN #1 locks rows)
      |                |
      |           WAIT... (GRN #2 blocked)
      |                |
  UPDATE rows          |
  COMMIT               |
      |                v
      |          SELECT ... FOR UPDATE  (GRN #2 gets fresh data)
      |                |
      |          UPDATE rows (with correct received_qty)
      |          COMMIT
```

**ทำไมใช้ทั้ง FOR UPDATE และ Prisma increment?**

| Step | Method | เหตุผล |
|------|--------|--------|
| Read junction rows | Raw SQL `FOR UPDATE` | Prisma ไม่รองรับ `FOR UPDATE` — ต้องใช้ raw SQL เพื่อ lock rows ก่อนอ่าน remain |
| Write junction received_qty | Prisma `{ increment }` | Row ถูก lock แล้ว — increment ปลอดภัย, generates `SET qty = qty + X` |
| Write PO detail received_qty | Prisma `{ increment }` | Atomic increment ไม่ต้อง lock — `SET received_qty = received_qty + X` |

`FOR UPDATE` เป็น row-level lock — lock เฉพาะ rows ที่ query ได้ ไม่ lock ทั้ง table
Transaction อื่นที่ทำกับ PO detail คนละตัวจะไม่ถูก block

---

## Summary: What Runs in Which Transaction

| Operation | What's in the transaction | Rollback behavior |
|-----------|--------------------------|-------------------|
| Stock In create | Doc + details + inventory adjustments | All or nothing |
| Stock Out create | Doc + details + inventory adjustments | All or nothing |
| GRN commit (manual) | Status update + inventory transactions | All or nothing |
| GRN commit (PO) | Status update + inventory + PO junction + PO status | All or nothing |

ทุก operation ใช้ single Prisma `$transaction` — ถ้า step ใด fail ทุกอย่าง rollback
