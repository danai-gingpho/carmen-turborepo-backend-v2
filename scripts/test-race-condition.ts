/**
 * Race Condition Test Script
 *
 * ทดสอบ race condition ที่เกิดจาก singleton service เก็บ mutable state (bu_code, userId, prismaService)
 * โดยส่ง request พร้อมกันจาก 2 tenant ที่ต่างกัน แล้วตรวจสอบว่า response กลับมาถูก tenant หรือไม่
 *
 * วิธีทดสอบ:
 * 1. เปิด backend-gateway + micro-business ด้วย `bun run dev:base`
 * 2. ต้องมี user ที่เข้าถึงได้ 2 BU (business unit) ที่แตกต่างกัน
 * 3. แก้ค่า CONFIG ด้านล่างให้ตรงกับ environment จริง
 * 4. รัน: npx ts-node scripts/test-race-condition.ts
 *
 * ผลที่คาดหวัง:
 * - ถ้ามี race condition: response จาก BU_A อาจได้ข้อมูลของ BU_B (หรือกลับกัน)
 * - ถ้าไม่มี race condition (หลังใส่ Scope.REQUEST): ทุก response ตรงกับ BU ที่ร้องขอ
 */

// ==================== CONFIG ====================
const GATEWAY_URL = 'http://localhost:4000';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // ใส่ token จริง

// ใส่ bu_code 2 ตัวที่ user นี้เข้าถึงได้
const BU_CODE_A = 'B01';
const BU_CODE_B = 'B02';

const CONCURRENT_PAIRS = 20; // จำนวน pair ที่ส่งพร้อมกัน
// ================================================

interface FetchResult {
  bu_code: string;
  status: number;
  body: unknown;
  error?: string;
}

async function fetchPRList(bu_code: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/purchase-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'x-bu-code': bu_code,
      },
      body: JSON.stringify({
        page: 1,
        perpage: 5,
        search: '',
        searchfields: [],
        filter: {},
        sort: [],
        advance: {},
      }),
    });
    const body = await res.json();
    return { bu_code, status: res.status, body };
  } catch (error) {
    return {
      bu_code,
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runTest() {
  console.log('=== Race Condition Test ===');
  console.log(`Gateway: ${GATEWAY_URL}`);
  console.log(`BU_A: ${BU_CODE_A}, BU_B: ${BU_CODE_B}`);
  console.log(`Concurrent pairs: ${CONCURRENT_PAIRS}`);
  console.log('');

  // สร้าง request คู่ (BU_A + BU_B) พร้อมกัน หลายคู่
  const promises: Promise<FetchResult>[] = [];
  for (let i = 0; i < CONCURRENT_PAIRS; i++) {
    promises.push(fetchPRList(BU_CODE_A));
    promises.push(fetchPRList(BU_CODE_B));
  }

  const results = await Promise.all(promises);

  let mismatchCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.error) {
      errorCount++;
      console.log(`[ERROR] bu_code=${result.bu_code}: ${result.error}`);
      continue;
    }

    // ตรวจสอบ response: bu_code ใน response ต้องตรงกับ bu_code ที่ส่งไป
    const body = result.body as any;

    if (body?.data && Array.isArray(body.data)) {
      for (const item of body.data) {
        if (item.bu_code && item.bu_code !== result.bu_code) {
          mismatchCount++;
          console.log(
            `[MISMATCH] Requested bu_code=${result.bu_code}, but got data for bu_code=${item.bu_code}`,
          );
        }
      }
    }
  }

  console.log('');
  console.log('=== Results ===');
  console.log(`Total requests: ${results.length}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Mismatches (race condition detected): ${mismatchCount}`);

  if (mismatchCount > 0) {
    console.log(
      '\n❌ RACE CONDITION DETECTED! Responses returned data from wrong tenant.',
    );
    console.log(
      'Fix: Add Scope.REQUEST to all services that use initializePrismaService().',
    );
  } else if (errorCount === results.length) {
    console.log(
      '\n⚠️  All requests failed. Check AUTH_TOKEN and that the server is running.',
    );
  } else {
    console.log('\n✅ No race condition detected in this run.');
    console.log(
      '   Note: Race conditions are timing-dependent. Run multiple times to be more confident.',
    );
  }
}

runTest().catch(console.error);
