import { de } from 'zod/v4/locales';
import { HttpStatus, Injectable, HttpException, Inject } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateDepartments,
  IUpdateDepartments,
} from './interface/departments.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import {
  ERROR_MISSING_BU_CODE,
  ERROR_MISSING_USER_ID,
} from '@/common/constant';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  TryCatch,
  Result,
  ErrorCode,
  DepartmentDetailResponseSchema,
  DepartmentListItemResponseSchema,
} from '@/common';

@Injectable()
export class DepartmentsService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(
      ERROR_MISSING_BU_CODE,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(
      ERROR_MISSING_USER_ID,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentsService.name,
  );

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
    );
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) {}

  @TryCatch
  async findOne(id: string, withUsers: boolean = false): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id: this.userId,
        bu_code: this.bu_code,
        withUsers,
      },
      DepartmentsService.name,
    );
    const specialQuery = {};

    if (withUsers) {
      Object.assign(specialQuery, {
        include: {
          tb_department_user: {
            where: {
              department_id: id,
            },
            select: {
              user_id: true,
              is_hod: true,
            },
          },
        },
      });
    }

    const department = await this.prismaService.tb_department
      .findFirst({
        ...specialQuery,
        where: {
          id: id,
        },
      })
      .then(async (res: any) => {
        if (!res) return null;
        const hod_users = [];
        const department_users = [];

        if (withUsers && res?.tb_department_user) {
          for (const user of res.tb_department_user) {
            user.id = user.user_id;
            const userProfile =
              await this.prismaSystem.tb_user_profile.findFirst({
                where: {
                  user_id: user.user_id,
                },
                select: {
                  firstname: true,
                  lastname: true,
                  middlename: true,
                  telephone: true,
                },
              });

            if (userProfile) {
              user.firstname = userProfile.firstname;
              user.lastname = userProfile.lastname;
              user.middlename = userProfile.middlename;
              user.telephone = userProfile.telephone;
            }

            if (user.is_hod) {
              hod_users.push(user);
            } else {
              department_users.push(user);
            }
          }
        }

        return {
          ...res,
          hod_users: hod_users,
          department_users: department_users,
        };
      });

    if (!department) {
      return Result.error('Department not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedDepartment =
      DepartmentDetailResponseSchema.parse(department);

    return Result.ok(serializedDepartment);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: this.userId,
        bu_code: this.bu_code,
        paginate,
      },
      DepartmentsService.name,
    );
    const defaultSearchFields = ['code', 'name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);
    const departments = await this.prismaService.tb_department.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_department.count({
      where: q.where(),
    });

    // Serialize response data
    const serializedDepartments = departments.map((dept) =>
      DepartmentListItemResponseSchema.parse(dept),
    );

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedDepartments,
    });
  }

  @TryCatch
  async create(data: ICreateDepartments): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, bu_code: this.bu_code },
      DepartmentsService.name,
    );

    const foundDepartment = await this.prismaService.tb_department.findFirst({
      where: {
        name: data.name,
      },
    });

    if (foundDepartment) {
      return Result.error(
        'Department already exists',
        ErrorCode.ALREADY_EXISTS,
      );
    }

    const transaction = await this.prismaService.$transaction(async (tx) => {
      const createDepartmentData = {
        ...data,
        created_by_id: this.userId,
      };
      delete createDepartmentData.department_users;
      delete createDepartmentData.hod_users;

      const createDepartment = await tx.tb_department.create({
        data: createDepartmentData,
      });

      if (data.department_users?.add) {
        const createUser = data.department_users.add.map((user) => ({
          user_id: user.id,
          department_id: createDepartment.id,
          is_hod: false,
          created_by_id: this.userId,
        }));

        await tx.tb_department_user.createMany({
          data: createUser,
        });
      }

      if (data.hod_users?.add) {
        const createHod = data.hod_users.add.map((user) => ({
          user_id: user.id,
          department_id: createDepartment.id,
          is_hod: true,
          created_by_id: this.userId,
        }));

        await tx.tb_department_user.createMany({
          data: createHod,
        });
      }

      return createDepartment;
    });

    return Result.ok({ id: transaction.id });
  }

  @TryCatch
  async update(data: IUpdateDepartments): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, bu_code: this.bu_code },
      DepartmentsService.name,
    );

    const department = await this.prismaService.tb_department.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!department) {
      return Result.error('Department not found', ErrorCode.NOT_FOUND);
    }

    const transaction = await this.prismaService.$transaction(async (tx) => {
      const updateDepartmentData = {
        ...data,
        updated_by_id: this.userId,
      };
      delete updateDepartmentData.department_users;
      delete updateDepartmentData.hod_users;

      const updateDepartment = await tx.tb_department.update({
        where: {
          id: data.id,
        },
        data: updateDepartmentData,
      });

      if (data.department_users?.add) {
        for (const user of data.department_users.add) {
          const existingDepartmentUser = await tx.tb_department_user.findFirst({
            where: {
              user_id: user.id,
              department_id: data.id,
              is_hod: false,
              deleted_at: null,
            },
          });

          if (existingDepartmentUser) {
            await tx.tb_department_user.update({
              where: { id: existingDepartmentUser.id },
              data: {
                is_hod: false,
                updated_by_id: this.userId,
              },
            });
          } else {
            await tx.tb_department_user.create({
              data: {
                user_id: user.id,
                department_id: data.id,
                is_hod: false,
                created_by_id: this.userId,
              },
            });
          }
        }
      }

      if (data.department_users?.remove) {
        await tx.tb_department_user.deleteMany({
          where: {
            user_id: { in: data.department_users.remove.map((user) => user.id) },
            department_id: data.id,
            is_hod: false,
          },
        });
      }

      if (data.hod_users?.add) {
        for (const user of data.hod_users.add) {
          const existingHodUser = await tx.tb_department_user.findFirst({
            where: {
              user_id: user.id,
              department_id: data.id,
              is_hod: true,
              deleted_at: null,
            },
          });

          if (existingHodUser) {
            await tx.tb_department_user.update({
              where: { id: existingHodUser.id },
              data: {
                is_hod: true,
                updated_by_id: this.userId,
              },
            });
          } else {
            await tx.tb_department_user.create({
              data: {
                user_id: user.id,
                department_id: data.id,
                is_hod: true,
                created_by_id: this.userId,
              },
            });
          }
        }
      }

      if (data.hod_users?.remove) { 
        await tx.tb_department_user.deleteMany({
          where: {
            user_id: { in: data.hod_users.remove.map((user) => user.id) },
            department_id: data.id,
            is_hod: true,   
          },
        });
      }

      return updateDepartment;
    });

    return Result.ok({ id: transaction.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, bu_code: this.bu_code },
      DepartmentsService.name,
    );

    const department = await this.prismaService.tb_department.findFirst({
      where: {
        id: id,
      },
    });

    if (!department) {
      return Result.error('Department not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_department.update({
      where: { id: id },
      data: {
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: department.id });
  }
}
