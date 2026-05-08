# Find Department & HOD Departments by User ID — Design

**Date:** 2026-04-28
**Status:** Approved (pending implementation plan)
**Endpoint:** `GET /api/config/{bu_code}/department-user/user/{user_id}`

## Problem

ปัจจุบันยังไม่มี endpoint สำหรับ query ข้อมูลแผนกของ user คนใดคนหนึ่ง endpoint ที่มีอยู่ในกลุ่ม `department-user` query โดยใช้ `department_id` หรือ `id` ของ assignment record เท่านั้น (`findOne`, `find-by-department`, `get-hod-in-department`)

ระบบ approval workflow และ requisition routing ต้องรู้ว่า:
1. User คนนี้เป็นสมาชิกของแผนกอะไร (member department)
2. User คนนี้เป็น HOD ของแผนกใดบ้าง

## Business Rules

- **Member assignment:** User 1 คนสามารถเป็นสมาชิก (is_hod=false) ได้แค่ 1 department เท่านั้น
- **HOD assignment:** User 1 คนสามารถเป็น HOD (is_hod=true) ได้หลาย department
- ทั้งสองบทบาทเป็น independent records ใน `tb_department_user` (member dept และ HOD dept อาจเป็นแผนกเดียวกันหรือคนละแผนก)

## Goal

เพิ่ม endpoint ใหม่ `GET /api/config/{bu_code}/department-user/user/{user_id}` ที่ return ข้อมูลทั้ง member department และ HOD departments ของ user คนนั้นใน response เดียว

## Non-Goals

- ไม่รวมข้อมูล user (name, email) ใน response — return แค่ user_id ตาม pattern ที่มีอยู่
- ไม่ทำ pagination — list HOD departments ของ user คนเดียวควรมีจำนวนน้อย
- ไม่แก้ไข endpoint ที่มีอยู่

## Architecture

ใช้ pattern ตาม service topology ปกติ: Gateway HTTP → TCP → micro-business

```
GET /api/config/{bu_code}/department-user/user/{user_id}
  │
  ▼
backend-gateway: Config_DepartmentUserController.findByUser()
  │ TCP send
  ▼
{ cmd: 'department-users.find-by-user-id', service: 'department-users' }
  │
  ▼
micro-business: DepartmentUserController.findByUserId()
  │
  ▼
DepartmentUserService.findByUserId(target_user_id):
  ├─ Query 1: findFirst (user_id, is_hod=false, deleted_at=null) include tb_department
  └─ Query 2: findMany (user_id, is_hod=true,  deleted_at=null) include tb_department
  │
  ▼
Result.ok({ department, hod_departments })
```

**Approach:** Single TCP call (gateway เป็นแค่ router; business logic รวมอยู่ใน service)

## Components

### micro-business

**`apps/micro-business/src/master/department-user/department-user.controller.ts`**
เพิ่ม `@MessagePattern` handler ใหม่:
```ts
@MessagePattern({ cmd: 'department-users.find-by-user-id', service: 'department-users' })
async findByUserId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse>
```
ใช้ `payload.target_user_id` เป็น input (ตั้งชื่อให้ต่างจาก `payload.user_id` ที่เป็น requesting user) และทำตาม pattern ที่มีอยู่ — init Prisma, run audit context

**`apps/micro-business/src/master/department-user/department-user.service.ts`**
เพิ่ม method:
```ts
@TryCatch
async findByUserId(target_user_id: string): Promise<Result<{
  department: { id: string; code: string; name: string } | null;
  hod_departments: Array<{ id: string; code: string; name: string }>;
}>>
```

Implementation:
1. Query 1: `prismaService.tb_department_user.findFirst({ where: { user_id: target_user_id, is_hod: false, deleted_at: null }, include: { tb_department: { select: { id, code, name } } } })`
2. Query 2: `prismaService.tb_department_user.findMany({ where: { user_id: target_user_id, is_hod: true, deleted_at: null }, include: { tb_department: { select: { id, code, name } } } })`
3. Map ผลลัพธ์เป็น shape ที่กำหนด — `department` = result1?.tb_department ?? null, `hod_departments` = result2.map(r => r.tb_department)

### backend-gateway

**`apps/backend-gateway/src/config/config_department-user/config_department-user.controller.ts`**
เพิ่ม route ใหม่ **ก่อน** `@Get(':id')` (สำคัญ: ลำดับมีผลกับ Nest path matching ไม่งั้น `/user/...` จะไป match `:id`):
```ts
@Get('user/:user_id')
@UseGuards(new AppIdGuard('departmentUser.findByUser'))
@HttpCode(HttpStatus.OK)
@ApiVersionMinRequest()
@ApiOperation({ ... })
async findByUser(
  @Req() req: Request,
  @Res() res: Response,
  @Param('user_id', new ParseUUIDPipe({ version: '4' })) target_user_id: string,
  @Param('bu_code') bu_code: string,
  @Query('version') version: string = 'latest',
): Promise<void>
```

ดึง requesting `user_id` จาก headers ผ่าน `ExtractRequestHeader(req)` แล้วเรียก service

**`apps/backend-gateway/src/config/config_department-user/config_department-user.service.ts`**
เพิ่ม method:
```ts
async findByUserId(
  target_user_id: string,
  user_id: string,
  bu_code: string,
  version: string,
): Promise<unknown>
```
ส่ง TCP message ผ่าน `_masterService.send({ cmd: 'department-users.find-by-user-id', service: 'department-users' }, payload)` โดย payload มี `target_user_id`, `user_id`, `bu_code`, `request_id`, `ip_address`, `user_agent`

**`apps/backend-gateway/src/config/config_department-user/swagger/response.ts`**
เพิ่ม DTO ใหม่:
```ts
export class DepartmentRefDto {
  @ApiProperty({ description: 'Department ID', example: '...' })
  id: string;
  @ApiProperty({ description: 'Department code', example: 'F&B' })
  code: string;
  @ApiProperty({ description: 'Department name', example: 'Food & Beverage' })
  name: string;
}

export class DepartmentUserByUserResponseDto {
  @ApiPropertyOptional({ description: 'Member department (is_hod=false). Null if user is not a member of any department.', type: DepartmentRefDto, nullable: true })
  department: DepartmentRefDto | null;

  @ApiProperty({ description: 'Departments where the user is HOD (is_hod=true). Empty array if user is not HOD anywhere.', type: [DepartmentRefDto] })
  hod_departments: DepartmentRefDto[];
}
```

### App-id Permission

ใช้ key `departmentUser.findByUser` ใน `@UseGuards(new AppIdGuard('departmentUser.findByUser'))`

`apps/backend-gateway/x-app-id.json`:
- App ที่มี `"allow": "*"` (เช่น `website`, `platform-web-management`) จะใช้ได้อัตโนมัติ ไม่ต้องแก้
- ถ้าต้องการให้ `mobile-app` หรือ app ที่มี explicit allow list ใช้ได้ ต้องเพิ่ม `"departmentUser.findByUser"` เข้าไปใน `allow` array ของ app นั้น (ตัดสินใจตอน implementation ว่าต้องการ expose ให้ mobile หรือไม่)

### Bruno

หลัง gateway endpoint สร้างเสร็จ รัน:
```bash
bun run bruno:sync:dry   # preview
bun run bruno:sync       # apply
```

## Response Contract

### 200 OK

```json
{
  "department": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "code": "F&B",
    "name": "Food & Beverage"
  },
  "hod_departments": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "code": "HK",
      "name": "Housekeeping"
    }
  ]
}
```

### Edge Cases

| Case | Response |
|------|----------|
| User เป็น member อย่างเดียว | `department: {...}, hod_departments: []` |
| User เป็น HOD อย่างเดียว (ไม่มี member dept) | `department: null, hod_departments: [...]` |
| User เป็นทั้ง member และ HOD | `department: {...}, hod_departments: [...]` |
| User ไม่อยู่ในแผนกไหนเลย | `department: null, hod_departments: []` (200 OK) |
| Invalid UUID format | 400 Bad Request (ParseUUIDPipe) |
| Missing/invalid token | 401/403 (KeycloakGuard) |
| Missing `x-app-id` | 401 (AppIdGuard) |

## Testing

### micro-business

`apps/micro-business/src/master/department-user/department-user.service.spec.ts` (เพิ่ม)
ครอบคลุม 4 cases:
- Member only → `department` set, `hod_departments` ว่าง
- HOD only → `department` null, `hod_departments` มีรายการ
- Both → ทั้ง 2 fields มีค่า
- None → `department` null, `hod_departments` ว่าง (ไม่ throw)

`department-user.controller.spec.ts` (เพิ่ม)
- Test ว่า handler เรียก service ด้วย `target_user_id` ถูกต้อง
- Test ว่า audit context ถูก set จาก payload

### backend-gateway

`apps/backend-gateway/src/config/config_department-user/config_department-user.controller.spec.ts` (เพิ่ม)
- Test route `/user/:user_id` รับ UUID ถูกและส่ง TCP message ด้วย payload ครบ
- Test ParseUUIDPipe reject invalid UUID

## Implementation Order

1. micro-business: service method + tests
2. micro-business: controller `@MessagePattern` handler + tests
3. backend-gateway: response DTO
4. backend-gateway: service method
5. backend-gateway: controller route + tests
6. App-id permission registration
7. Bruno sync
8. Manual smoke test ผ่าน Bruno collection

## Open Questions

ไม่มี — design นี้สรุปจาก clarifying questions แล้วครบ
