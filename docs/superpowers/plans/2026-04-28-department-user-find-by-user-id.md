# Department-User Find By User ID — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม endpoint `GET /api/config/{bu_code}/department-user/user/{user_id}` ที่ return member department + HOD departments ของ user คนนั้นใน response เดียว

**Architecture:** Gateway HTTP → TCP → micro-business. Single TCP message; service ทำ 2 Prisma queries (member + HOD list) แล้ว assemble เป็น response shape `{ department, hod_departments }`

**Tech Stack:** NestJS, TypeScript, Prisma (tenant schema), Jest, Bun

**Spec:** `docs/superpowers/specs/2026-04-28-department-user-find-by-user-id-design.md`

---

## File Map

**micro-business** (`apps/micro-business/src/master/department-user/`)
- Modify: `department-user.controller.ts` — เพิ่ม `@MessagePattern` handler
- Modify: `department-user.service.ts` — เพิ่ม `findByUserId` method
- Create: `department-user.service.spec.ts` — unit tests สำหรับ service
- Create: `department-user.controller.spec.ts` — unit tests สำหรับ controller

**backend-gateway** (`apps/backend-gateway/src/config/config_department-user/`)
- Modify: `swagger/response.ts` — เพิ่ม `DepartmentRefDto`, `DepartmentUserByUserResponseDto`
- Modify: `config_department-user.service.ts` — เพิ่ม `findByUserId` method (TCP send)
- Modify: `config_department-user.controller.ts` — เพิ่ม `@Get('user/:user_id')` route (วาง**ก่อน** `@Get(':id')`)
- Modify: `config_department-user.controller.spec.ts` — เพิ่ม test สำหรับ route ใหม่
- Modify: `config_department-user.service.spec.ts` — เพิ่ม test สำหรับ TCP send

**Other**
- Optional modify: `apps/backend-gateway/x-app-id.json` — ถ้าต้องการให้ mobile-app เรียกได้
- Run: `bun run bruno:sync` — sync Bruno collection หลัง gateway เปลี่ยน

---

## Task 1: micro-business — Service `findByUserId` (TDD)

**Files:**
- Create: `apps/micro-business/src/master/department-user/department-user.service.spec.ts`
- Modify: `apps/micro-business/src/master/department-user/department-user.service.ts`

- [ ] **Step 1.1: Write the failing test file**

Create `apps/micro-business/src/master/department-user/department-user.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentUserService } from './department-user.service';
import { TenantService } from '@/tenant/tenant.service';

describe('DepartmentUserService', () => {
  let service: DepartmentUserService;

  const mockPrismaClient = {
    tb_department_user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTenantService = {
    prismaTenantInstance: jest.fn().mockResolvedValue(mockPrismaClient),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentUserService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<DepartmentUserService>(DepartmentUserService);
    service.bu_code = 'TEST-BU';
    service.userId = '11111111-1111-1111-1111-111111111111';
    await service.initializePrismaService('TEST-BU', '11111111-1111-1111-1111-111111111111');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    const TARGET_USER = '22222222-2222-2222-2222-222222222222';
    const MEMBER_DEPT = { id: 'aaa', code: 'F&B', name: 'Food & Beverage' };
    const HOD_DEPT_1 = { id: 'bbb', code: 'HK', name: 'Housekeeping' };
    const HOD_DEPT_2 = { id: 'ccc', code: 'FO', name: 'Front Office' };

    it('returns department and hod_departments when user is both member and HOD', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue({
        tb_department: MEMBER_DEPT,
      });
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([
        { tb_department: HOD_DEPT_1 },
        { tb_department: HOD_DEPT_2 },
      ]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: MEMBER_DEPT,
        hod_departments: [HOD_DEPT_1, HOD_DEPT_2],
      });
      expect(mockPrismaClient.tb_department_user.findFirst).toHaveBeenCalledWith({
        where: { user_id: TARGET_USER, is_hod: false, deleted_at: null },
        select: { tb_department: { select: { id: true, code: true, name: true } } },
      });
      expect(mockPrismaClient.tb_department_user.findMany).toHaveBeenCalledWith({
        where: { user_id: TARGET_USER, is_hod: true, deleted_at: null },
        select: { tb_department: { select: { id: true, code: true, name: true } } },
      });
    });

    it('returns null department when user is HOD only', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue(null);
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([
        { tb_department: HOD_DEPT_1 },
      ]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: null,
        hod_departments: [HOD_DEPT_1],
      });
    });

    it('returns empty hod_departments when user is member only', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue({
        tb_department: MEMBER_DEPT,
      });
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: MEMBER_DEPT,
        hod_departments: [],
      });
    });

    it('returns null department and empty hod_departments when user has neither', async () => {
      mockPrismaClient.tb_department_user.findFirst.mockResolvedValue(null);
      mockPrismaClient.tb_department_user.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(TARGET_USER);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual({
        department: null,
        hod_departments: [],
      });
    });
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
cd apps/micro-business
bun run test -- department-user.service.spec.ts
```

Expected: FAIL — `service.findByUserId is not a function`

- [ ] **Step 1.3: Implement `findByUserId` in service**

Edit `apps/micro-business/src/master/department-user/department-user.service.ts` — add new method **after** `getHodInDepartment`:

```ts
  /**
   * Find a user's member department and HOD departments
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกทั้งหมดที่ user เป็น HOD
   * @param target_user_id - User ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @returns Member department (single, nullable) and HOD departments (array)
   */
  @TryCatch
  async findByUserId(
    target_user_id: string,
  ): Promise<Result<{
    department: { id: string; code: string; name: string } | null;
    hod_departments: Array<{ id: string; code: string; name: string }>;
  }>> {
    const memberRecord = await this.prismaService.tb_department_user.findFirst({
      where: { user_id: target_user_id, is_hod: false, deleted_at: null },
      select: { tb_department: { select: { id: true, code: true, name: true } } },
    });

    const hodRecords = await this.prismaService.tb_department_user.findMany({
      where: { user_id: target_user_id, is_hod: true, deleted_at: null },
      select: { tb_department: { select: { id: true, code: true, name: true } } },
    });

    return Result.ok({
      department: memberRecord?.tb_department ?? null,
      hod_departments: hodRecords.map((r) => r.tb_department),
    });
  }
```

- [ ] **Step 1.4: Run test to verify it passes**

```bash
cd apps/micro-business
bun run test -- department-user.service.spec.ts
```

Expected: PASS — all 5 tests (`should be defined` + 4 `findByUserId` cases)

- [ ] **Step 1.5: Commit**

```bash
git add apps/micro-business/src/master/department-user/department-user.service.ts \
        apps/micro-business/src/master/department-user/department-user.service.spec.ts
git commit -m "$(cat <<'EOF'
feat(micro-business): add DepartmentUserService.findByUserId

Returns the user's member department (is_hod=false) and the list of
departments where the user is HOD (is_hod=true) in a single response.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: micro-business — Controller `@MessagePattern` handler (TDD)

**Files:**
- Create: `apps/micro-business/src/master/department-user/department-user.controller.spec.ts`
- Modify: `apps/micro-business/src/master/department-user/department-user.controller.ts`

- [ ] **Step 2.1: Write the failing controller test**

Create `apps/micro-business/src/master/department-user/department-user.controller.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentUserController } from './department-user.controller';
import { DepartmentUserService } from './department-user.service';
import { TenantService } from '@/tenant/tenant.service';
import { Result } from '@/common';

describe('DepartmentUserController', () => {
  let controller: DepartmentUserController;
  let service: DepartmentUserService;

  const mockPrismaClient = {
    tb_department_user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTenantService = {
    prismaTenantInstance: jest.fn().mockResolvedValue(mockPrismaClient),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentUserController],
      providers: [
        DepartmentUserService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    controller = module.get<DepartmentUserController>(DepartmentUserController);
    service = module.get<DepartmentUserService>(DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByUserId', () => {
    it('initializes Prisma and delegates to service.findByUserId with target_user_id', async () => {
      const payload = {
        bu_code: 'TEST-BU',
        user_id: '11111111-1111-1111-1111-111111111111',
        target_user_id: '22222222-2222-2222-2222-222222222222',
        request_id: 'req-1',
        ip_address: '127.0.0.1',
        user_agent: 'jest',
      };
      const expected = { department: null, hod_departments: [] };
      jest.spyOn(service, 'findByUserId').mockResolvedValue(Result.ok(expected));

      const response = await controller.findByUserId(payload);

      expect(mockTenantService.prismaTenantInstance).toHaveBeenCalledWith(
        payload.bu_code,
        payload.user_id,
      );
      expect(service.findByUserId).toHaveBeenCalledWith(payload.target_user_id);
      expect(response).toBeDefined();
      expect(response.data).toEqual(expected);
    });
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
cd apps/micro-business
bun run test -- department-user.controller.spec.ts
```

Expected: FAIL — `controller.findByUserId is not a function`

- [ ] **Step 2.3: Implement `@MessagePattern` handler**

Edit `apps/micro-business/src/master/department-user/department-user.controller.ts` — append new handler **after** `getHodInDepartment` (before closing brace of class):

```ts
  /**
   * Find a user's member department and HOD departments by user_id
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ตาม user_id
   * @param payload - Microservice payload with target_user_id / payload ที่มี target_user_id
   * @returns Member department + HOD departments / แผนกที่เป็นสมาชิก + รายการแผนกที่เป็น HOD
   */
  @MessagePattern({ cmd: 'department-users.find-by-user-id', service: 'department-users' })
  async findByUserId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findByUserId', payload }, DepartmentUserController.name);
    const target_user_id = payload.target_user_id as string;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentUserService.findByUserId(target_user_id),
    );
    return this.handleResult(result);
  }
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
cd apps/micro-business
bun run test -- department-user.controller.spec.ts
```

Expected: PASS — both tests

- [ ] **Step 2.5: Run full department-user test suite**

```bash
cd apps/micro-business
bun run test -- department-user
```

Expected: ALL PASS

- [ ] **Step 2.6: Commit**

```bash
git add apps/micro-business/src/master/department-user/department-user.controller.ts \
        apps/micro-business/src/master/department-user/department-user.controller.spec.ts
git commit -m "$(cat <<'EOF'
feat(micro-business): add department-users.find-by-user-id handler

Wires the new findByUserId service method to the TCP message pattern
'department-users.find-by-user-id' for the gateway to call.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: backend-gateway — Response DTO

**Files:**
- Modify: `apps/backend-gateway/src/config/config_department-user/swagger/response.ts`

- [ ] **Step 3.1: Add new DTOs**

Edit `apps/backend-gateway/src/config/config_department-user/swagger/response.ts` — append at end of file:

```ts
export class DepartmentRefDto {
  @ApiProperty({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Department code', example: 'F&B' })
  code: string;

  @ApiProperty({ description: 'Department name', example: 'Food & Beverage' })
  name: string;
}

export class DepartmentUserByUserResponseDto {
  @ApiPropertyOptional({
    description: 'Member department (is_hod=false). Null if user is not a member of any department.',
    type: DepartmentRefDto,
    nullable: true,
  })
  department: DepartmentRefDto | null;

  @ApiProperty({
    description: 'Departments where the user is HOD (is_hod=true). Empty array if user is not HOD anywhere.',
    type: [DepartmentRefDto],
  })
  hod_departments: DepartmentRefDto[];
}
```

- [ ] **Step 3.2: Type-check the file**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: PASS (no TS errors)

- [ ] **Step 3.3: Commit**

```bash
git add apps/backend-gateway/src/config/config_department-user/swagger/response.ts
git commit -m "$(cat <<'EOF'
feat(gateway): add DepartmentUserByUserResponseDto

Response DTO for the upcoming GET /department-user/user/:user_id
endpoint. Shape: { department, hod_departments }.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: backend-gateway — Service `findByUserId` (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/config/config_department-user/config_department-user.service.spec.ts`
- Modify: `apps/backend-gateway/src/config/config_department-user/config_department-user.service.ts`

- [ ] **Step 4.1: Add the failing test**

Edit `apps/backend-gateway/src/config/config_department-user/config_department-user.service.spec.ts` — replace entire content:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { HttpStatus } from '@nestjs/common';
import { Config_DepartmentUserService } from './config_department-user.service';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_DepartmentUserService', () => {
  let service: Config_DepartmentUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_DepartmentUserService,
        { provide: 'BUSINESS_SERVICE', useValue: mockMasterService },
      ],
    }).compile();

    service = module.get<Config_DepartmentUserService>(Config_DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('sends TCP message with correct cmd and payload, returns Result.ok on success', async () => {
      const mockData = {
        department: { id: 'd1', code: 'F&B', name: 'Food & Beverage' },
        hod_departments: [],
      };
      mockMasterService.send.mockReturnValue(
        of({ response: { status: HttpStatus.OK, message: 'OK' }, data: mockData }),
      );

      const result = await service.findByUserId(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );

      expect(mockMasterService.send).toHaveBeenCalledWith(
        { cmd: 'department-users.find-by-user-id', service: 'department-users' },
        expect.objectContaining({
          target_user_id: '22222222-2222-2222-2222-222222222222',
          user_id: '11111111-1111-1111-1111-111111111111',
          bu_code: 'TEST-BU',
          version: 'latest',
        }),
      );
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(mockData);
    });

    it('returns Result.error when microservice responds with non-OK status', async () => {
      mockMasterService.send.mockReturnValue(
        of({ response: { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'boom' }, data: null }),
      );

      const result = await service.findByUserId(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );

      expect(result.isOk()).toBe(false);
    });
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
cd apps/backend-gateway
bun run test -- config_department-user.service.spec.ts
```

Expected: FAIL — `service.findByUserId is not a function`

- [ ] **Step 4.3: Implement `findByUserId` in gateway service**

Edit `apps/backend-gateway/src/config/config_department-user/config_department-user.service.ts`:

Replace top imports:

```ts
import { HttpStatus, Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
```

Append a new method **after** the existing `delete` method (before the closing brace of the class):

```ts
  /**
   * Find a user's member department and HOD departments via microservice
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ผ่านไมโครเซอร์วิส
   * @param target_user_id - User ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Result with member department + HOD departments / ผลลัพธ์ที่มีแผนกสมาชิก + รายการแผนก HOD
   */
  async findByUserId(
    target_user_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByUserId', target_user_id, version },
      Config_DepartmentUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'department-users.find-by-user-id', service: 'department-users' },
      {
        target_user_id,
        user_id,
        bu_code,
        version,
        ...getGatewayRequestContext(),
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
```

- [ ] **Step 4.4: Run test to verify it passes**

```bash
cd apps/backend-gateway
bun run test -- config_department-user.service.spec.ts
```

Expected: PASS — all 3 tests

- [ ] **Step 4.5: Commit**

```bash
git add apps/backend-gateway/src/config/config_department-user/config_department-user.service.ts \
        apps/backend-gateway/src/config/config_department-user/config_department-user.service.spec.ts
git commit -m "$(cat <<'EOF'
feat(gateway): add Config_DepartmentUserService.findByUserId

Sends TCP message 'department-users.find-by-user-id' to micro-business
and unwraps the response into a Result. Includes gateway request context
for audit propagation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: backend-gateway — Controller route `GET user/:user_id` (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/config/config_department-user/config_department-user.controller.spec.ts`
- Modify: `apps/backend-gateway/src/config/config_department-user/config_department-user.controller.ts`

> **Critical placement note:** The new `@Get('user/:user_id')` route MUST appear in the controller **before** the existing `@Get(':id')` route. NestJS resolves path-param routes in declaration order, so if `:id` is declared first it will eagerly match `/user/...` and the new route is unreachable.

- [ ] **Step 5.1: Add the failing controller test**

Edit `apps/backend-gateway/src/config/config_department-user/config_department-user.controller.spec.ts` — replace entire content:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { Config_DepartmentUserController } from './config_department-user.controller';
import { Config_DepartmentUserService } from './config_department-user.service';
import { Result } from '@/common';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_DepartmentUserController', () => {
  let controller: Config_DepartmentUserController;
  let service: Config_DepartmentUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_DepartmentUserController],
      providers: [
        Config_DepartmentUserService,
        { provide: 'BUSINESS_SERVICE', useValue: mockMasterService },
      ],
    }).compile();

    controller = module.get<Config_DepartmentUserController>(Config_DepartmentUserController);
    service = module.get<Config_DepartmentUserService>(Config_DepartmentUserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByUser', () => {
    it('extracts user_id from headers, calls service.findByUserId with target user, and responds', async () => {
      const expected = { department: null, hod_departments: [] };
      jest.spyOn(service, 'findByUserId').mockResolvedValue(Result.ok(expected));

      const req: any = {
        headers: { 'x-user-id': '11111111-1111-1111-1111-111111111111' },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      await controller.findByUser(
        req,
        res,
        '22222222-2222-2222-2222-222222222222',
        'TEST-BU',
        'latest',
      );

      expect(service.findByUserId).toHaveBeenCalledWith(
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'TEST-BU',
        'latest',
      );
      expect(res.status).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
cd apps/backend-gateway
bun run test -- config_department-user.controller.spec.ts
```

Expected: FAIL — `controller.findByUser is not a function`

- [ ] **Step 5.3: Add the new route to the controller**

Edit `apps/backend-gateway/src/config/config_department-user/config_department-user.controller.ts`:

**(a)** Update the import line at the top so `DepartmentUserByUserResponseDto` is available for `@ApiOkResponse`:

```ts
import { DepartmentUserCreateRequest, DepartmentUserUpdateRequest } from './swagger/request';
import { DepartmentUserByUserResponseDto } from './swagger/response';
```

**(b)** Add `ApiOkResponse` to the existing `@nestjs/swagger` import:

```ts
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
```

**(c)** Insert the new route handler **directly above** the existing `@Get(':id')` block (around line 66 — the `findOne` method). Order must be: `findByUser` first, then `findOne`.

```ts
  /**
   * Find a user's member department and HOD departments by user_id
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ตาม user_id
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param target_user_id - Target user ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Member department + HOD departments / แผนกสมาชิก + รายการแผนก HOD
   */
  @Get('user/:user_id')
  @UseGuards(new AppIdGuard('departmentUser.findByUser'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: "Get a user's department and HOD assignments",
    description:
      'Returns the single department where the user is a member (is_hod=false, may be null) and the list of departments where the user is HOD (is_hod=true, may be empty).',
    operationId: 'configDepartmentUser_findByUser',
    tags: ['Configuration', 'Department User'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'user_id', in: 'path', required: true },
    ],
    responses: {
      200: { description: 'User department assignments retrieved successfully' },
    },
    'x-description-th': 'ดึงข้อมูลแผนกสมาชิก และรายการแผนกที่ user เป็น HOD ตาม user_id',
  } as any)
  @ApiOkResponse({ type: DepartmentUserByUserResponseDto })
  async findByUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('user_id', new ParseUUIDPipe({ version: '4' })) target_user_id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findByUser', target_user_id, version },
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.findByUserId(
      target_user_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
```

- [ ] **Step 5.4: Run test to verify it passes**

```bash
cd apps/backend-gateway
bun run test -- config_department-user.controller.spec.ts
```

Expected: PASS — both tests

- [ ] **Step 5.5: Type-check entire gateway**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: PASS

- [ ] **Step 5.6: Commit**

```bash
git add apps/backend-gateway/src/config/config_department-user/config_department-user.controller.ts \
        apps/backend-gateway/src/config/config_department-user/config_department-user.controller.spec.ts
git commit -m "$(cat <<'EOF'
feat(gateway): add GET /api/config/:bu_code/department-user/user/:user_id

Returns the user's member department (is_hod=false, single, nullable)
and the list of departments where the user is HOD (is_hod=true). Route
declared before :id so Nest's path matching does not absorb /user/...

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: x-app-id Permission (conditional)

**Files:**
- Modify (optional): `apps/backend-gateway/x-app-id.json`

- [ ] **Step 6.1: Decide whether `mobile-app` needs this endpoint**

Apps with `"allow": "*"` (e.g. `website`, `platform-web-management`) require **no change** — they already accept the new permission key.

If mobile-app must also call this endpoint, edit `apps/backend-gateway/x-app-id.json` and add `"departmentUser.findByUser"` into the `allow` array of the mobile-app entry (id `00000000-0000-0000-0000-000000000000`).

- [ ] **Step 6.2: Commit (only if file changed)**

```bash
git status apps/backend-gateway/x-app-id.json
# If modified:
git add apps/backend-gateway/x-app-id.json
git commit -m "$(cat <<'EOF'
chore(gateway): allow mobile-app to call departmentUser.findByUser

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Bruno Sync

**Files:**
- Auto-generated by tool under `apps/bruno/carmen-inventory/config/department-user/`

- [ ] **Step 7.1: Preview changes**

```bash
bun run bruno:sync:dry
```

Expected output: shows the new request `findByUser` (or similarly named) being added under the department-user folder. Confirm no unexpected archives.

- [ ] **Step 7.2: Apply Bruno sync**

```bash
bun run bruno:sync
```

Expected: new `.bru` file created for the route. No errors.

- [ ] **Step 7.3: Commit Bruno changes**

```bash
git add apps/bruno/
git commit -m "$(cat <<'EOF'
chore(bruno): sync collection with new department-user findByUser endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Final verification

- [ ] **Step 8.1: Run full test suite for both apps**

```bash
cd apps/micro-business && bun run test
cd ../backend-gateway && bun run test
```

Expected: ALL PASS — no regressions in other modules

- [ ] **Step 8.2: Run lint and type-check on both apps**

```bash
cd apps/micro-business && bun run lint && bun run check-types
cd ../backend-gateway && bun run lint && bun run check-types
```

Expected: PASS on both

- [ ] **Step 8.3: Manual smoke test (optional but recommended)**

Start the services:

```bash
# In one terminal — micro-business
cd apps/micro-business && bun run dev

# In another — gateway
cd apps/backend-gateway && bun run dev
```

Open Bruno, login (e.g. `auth/login/login.bru`), then send the new request `config/department-user/user/findByUser.bru` (or whatever name `bruno:sync` produced). Substitute a real `bu_code` and a real `user_id`.

Expected results:
- 200 OK with shape `{ department: {...}|null, hod_departments: [...] }`
- 400 Bad Request when `user_id` path param is not a valid UUID
- 401 when `Authorization` header is missing or invalid
- 401 when `x-app-id` header is missing

- [ ] **Step 8.4: Confirm Swagger UI**

Open `http://localhost:4000/swagger` and verify:
- The new operation `configDepartmentUser_findByUser` appears under the `Config: Departments` tag
- Response schema shows `DepartmentUserByUserResponseDto` with `department` (nullable `DepartmentRefDto`) and `hod_departments` (array of `DepartmentRefDto`)

---

## Self-Review Notes

- **Spec coverage:** Architecture, components (controller/service/DTO/Bruno/permissions), response contract, all 4 edge cases, and tests are each represented by a task above.
- **Placeholders:** none.
- **Type consistency:** `findByUserId` is the canonical name across micro-business service, micro-business controller spy, gateway service, and gateway controller→service call. The HTTP route handler is named `findByUser` (matching the Bruno path segment), while everything below it uses `findByUserId`. The TCP message pattern `department-users.find-by-user-id` is identical between gateway send and micro-business `@MessagePattern`. Response shape `{ department, hod_departments }` is identical across spec, service, DTO, and tests.
