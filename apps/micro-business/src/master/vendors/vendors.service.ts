import { find } from 'rxjs';
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateVendor,
  IUpdateVendor,
  IVendorAddress,
} from './interface/vendors.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import {
  ERROR_MISSING_BU_CODE,
  ERROR_MISSING_TENANT_ID,
  ERROR_MISSING_USER_ID,
} from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode, VendorListItemResponseSchema, VendorDetailResponseSchema } from '@/common';

@Injectable()
export class VendorsService {
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

  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
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


  private readonly logger: BackendLogger = new BackendLogger(
    VendorsService.name,
  );

  constructor(private readonly tenantService: TenantService) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      VendorsService.name,
    );

    const vendor = await this.prismaService.tb_vendor.findFirst({
      where: {
        id: id,
        is_active: true,
      },
    });

    if (!vendor) {
      return Result.error('Vendor not found', ErrorCode.NOT_FOUND);
    }

    const vendorAddress = await this.prismaService.tb_vendor_address.findMany({
      where: {
        vendor_id: vendor.id,
      },
      select: {
        id: true,
        address_type: true,
        data: true,
        is_active: true,
      },
    });

    const vendorContact = await this.prismaService.tb_vendor_contact.findMany({
      where: {
        vendor_id: vendor.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        is_primary: true,
        description: true,
        info: true,
        is_active: true,
      },
    });

    // Serialize response data
    const serializedVendor = VendorDetailResponseSchema.parse({
      ...vendor,
      vendor_address: vendorAddress,
      vendor_contact: vendorContact,
    });

    return Result.ok(serializedVendor);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      VendorsService.name,
    );
    const defaultSearchFields = ['code', 'name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const selectClause = {
      id: true,
      code: true,
      name: true,
      description: true,
      note: true,
      business_type: true,
      tax_profile_id: true,
      tax_profile_name: true,
      tax_rate: true,
      is_active: true,
      // info: true,
      dimension: true,
      created_at: true,
      updated_at: true,
      tb_vendor_contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          is_primary: true,
          description: true,
          info: true,
        },
        where: {
          is_active: true,
        },
      },
    };

    const vendors = await this.prismaService.tb_vendor.findMany({
      select: selectClause,
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_vendor.count({ where: q.where() });

    // Serialize response data
    const serializedVendors = vendors.map((vendor) => VendorListItemResponseSchema.parse(vendor));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedVendors,
    });
  }

  @TryCatch
  async findAllById(ids: string[]): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllById', ids, user_id: this.userId, tenant_id: this.bu_code },
      VendorsService.name,
    );

    const vendors = await this.prismaService.tb_vendor.findMany({
      where: {
        id: { in: ids },
      },
    });

    // Serialize response data
    const serializedVendors = vendors.map((vendor) => VendorListItemResponseSchema.parse(vendor));

    return Result.ok(serializedVendors);
  }

  @TryCatch
  async create(data: ICreateVendor): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      VendorsService.name,
    );

    const foundVendor = await this.prismaService.tb_vendor.findFirst({
      where: {
        code: data.code,
        name: data.name,
      },
      select: {
        id: true,
        code: true,
        name: true,
        deleted_at: true,
      },
    });

    if (foundVendor) {
      return Result.error('Vendor already exists', ErrorCode.ALREADY_EXISTS);
    }

    // check business type is exists
    if (data.business_type && data.business_type.length > 0) {
      for (const businessType of data.business_type || []) {
        const foundBusinessType =
          await this.prismaService.tb_vendor_business_type.findFirst({
            where: {
              id: businessType.id,
            },
          });

        if (!foundBusinessType) {
          return Result.error(`Vendor business type not found: ${businessType.name}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      const vendorObject: ICreateVendor = {
        ...data,
      };
      delete vendorObject.vendor_address;
      delete vendorObject.vendor_contact;

      const createVendor = await prisma.tb_vendor.create({
        data: {
          ...vendorObject,
          created_by_id: this.userId,
        },
      });

      if (data.vendor_address) {
        const vendorAddressObj = await Promise.all(
          data.vendor_address.map((address) => ({
            vendor_id: createVendor.id,
            is_active: true,
            created_by_id: this.userId,
            ...address,
          })),
        );

        await prisma.tb_vendor_address.createMany({
          data: vendorAddressObj,
        });
      }

      if (data.vendor_contact) {
        const vendorContactObj = await Promise.all(
          data.vendor_contact.map((contact) => ({
            vendor_id: createVendor.id,
            is_active: true,
            created_by_id: this.userId,
            ...contact,
          })),
        );

        await prisma.tb_vendor_contact.createMany({
          data: vendorContactObj,
        });
      }

      return { id: createVendor.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async update(data: IUpdateVendor): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      VendorsService.name,
    );

    const vendor = await this.prismaService.tb_vendor.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!vendor) {
      return Result.error('Vendor not found', ErrorCode.NOT_FOUND);
    }

    // check business type is exists
    if (data.business_type && data.business_type.length > 0) {
      for (const businessType of data.business_type || []) {
        const foundBusinessType =
          await this.prismaService.tb_vendor_business_type.findFirst({
            where: {
              id: businessType.id,
            },
          });

        if (!foundBusinessType) {
          return Result.error(`Vendor business type not found: ${businessType.name}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    if (data.vendor_address) {
      if (data.vendor_address.update) {
        const vendorAddressNotFound: string[] = [];
        await Promise.all(
          data.vendor_address.update.map(async (address) => {
            const vendorAddressObj = await this.prismaService.tb_vendor_address.findFirst({
              where: {
                id: address.vendor_address_id,
              },
            });

            if (!vendorAddressObj) {
              vendorAddressNotFound.push(address.vendor_address_id);
            }
          }),
        );

        if (vendorAddressNotFound.length > 0) {
          return Result.error('Vendor address not found', ErrorCode.NOT_FOUND);
        }
      }

      if (data.vendor_address.remove) {
        const vendorAddressNotFound: string[] = [];
        await Promise.all(
          data.vendor_address.remove.map(async (address) => {
            const vendorAddressObj = await this.prismaService.tb_vendor_address.findFirst({
              where: {
                id: address.vendor_address_id,
              },
            });

            if (!vendorAddressObj) {
              vendorAddressNotFound.push(address.vendor_address_id);
            }
          }),
        );

        if (vendorAddressNotFound.length > 0) {
          return Result.error('Vendor address not found', ErrorCode.NOT_FOUND);
        }
      }
    }

    if (data.vendor_contact) {
      if (data.vendor_contact.update) {
        const vendorContactNotFound: string[] = [];
        await Promise.all(
          data.vendor_contact.update.map(async (contact) => {
            const vendorContactObj = await this.prismaService.tb_vendor_contact.findFirst({
              where: {
                id: contact.vendor_contact_id,
              },
            });

            if (!vendorContactObj) {
              vendorContactNotFound.push(contact.vendor_contact_id);
            }
          }),
        );

        if (vendorContactNotFound.length > 0) {
          return Result.error('Vendor contact not found', ErrorCode.NOT_FOUND);
        }
      }

      if (data.vendor_contact.remove) {
        const vendorContactNotFound: string[] = [];
        await Promise.all(
          data.vendor_contact.remove.map(async (contact) => {
            const vendorContactObj = await this.prismaService.tb_vendor_contact.findFirst({
              where: {
                id: contact.vendor_contact_id,
              },
            });

            if (!vendorContactObj) {
              vendorContactNotFound.push(contact.vendor_contact_id);
            }
          }),
        );

        if (vendorContactNotFound.length > 0) {
          return Result.error('Vendor contact not found', ErrorCode.NOT_FOUND);
        }
      }
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      const vendorObject: IUpdateVendor = {
        ...data,
      };
      delete vendorObject.vendor_address;
      delete vendorObject.vendor_contact;

      const updateVendor = await prisma.tb_vendor.update({
        where: {
          id: data.id,
        },
        data: {
          ...vendorObject,
          updated_by_id: this.userId,
        },
      });

      if (data.vendor_address) {
        if (data.vendor_address.add?.length > 0) {
          const vendorAddressObj = await Promise.all(
            data.vendor_address.add.map((address) => ({
              ...address,
              updated_by_id: this.userId,
            })),
          );

          await prisma.tb_vendor_address.createMany({
            data: vendorAddressObj,
          });
        }

        if (data.vendor_address.update?.length > 0) {
          await Promise.all(
            data.vendor_address.update.map(async (address) => {
              const vendorAddress = await prisma.tb_vendor_address.findFirst({
                where: {
                  id: address.vendor_address_id,
                },
              });

              if (!vendorAddress) {
                throw new Error('Vendor address not found');
              }

              const data = {
                id: vendorAddress.id,
                vendor_id: vendorAddress.vendor_id,
                address_type:
                  address.address_type ?? vendorAddress.address_type,
                data: address.data ?? vendorAddress.data,
                updated_by_id: this.userId,
              };

              await prisma.tb_vendor_address.update({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.vendor_address.remove?.length > 0) {
          const vendorAddressIds = data.vendor_address?.remove?.map(
            (address) => address.vendor_address_id,
          );

          await prisma.tb_vendor_address.deleteMany({
            where: {
              id: { in: vendorAddressIds },
            },
          });
        }
      }

      if (data.vendor_contact) {
        if (data.vendor_contact.add?.length > 0) {
          const vendorContactObj = await Promise.all(
            data.vendor_contact.add.map((contact) => ({
              ...contact,
              updated_by_id: this.userId,
            })),
          );

          await prisma.tb_vendor_contact.createMany({
            data: vendorContactObj,
          });
        }

        if (data.vendor_contact.update) {
          await Promise.all(
            data.vendor_contact.update.map(async (contact) => {
              const vendorContact = await prisma.tb_vendor_contact.findFirst({
                where: { id: contact.vendor_contact_id },
              });

              if (!vendorContact) {
                throw new Error('Vendor contact not found');
              }

              const data = {
                id: vendorContact.id,
                vendor_id: vendorContact.vendor_id,
                name: contact.name ?? vendorContact.name,
                email: contact.email ?? vendorContact.email,
                phone: contact.phone ?? vendorContact.phone,
                is_primary: contact.is_primary ?? vendorContact.is_primary,
                description: contact.description ?? vendorContact.description,
                info: contact.info ?? vendorContact.info,
                updated_by_id: this.userId,
              };

              await prisma.tb_vendor_contact.update({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.vendor_contact.remove) {
          const vendorContactIds = data.vendor_contact?.remove?.map(
            (contact) => contact.vendor_contact_id,
          );

          await prisma.tb_vendor_contact.deleteMany({
            where: { id: { in: vendorContactIds } },
          });
        }
      }

      return { id: updateVendor.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      VendorsService.name,
    );

    const vendor = await this.prismaService.tb_vendor.findFirst({
      where: {
        id: id,
      },
    });

    if (!vendor) {
      return Result.error('Vendor not found', ErrorCode.NOT_FOUND);
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      // await prisma.tb_vendor_contact.deleteMany({
      //   where: {
      //     vendor_id: id,
      //   },
      // });

      // await prisma.tb_vendor_address.deleteMany({
      //   where: {
      //     vendor_id: id,
      //   },
      // });

      await prisma.tb_vendor.update({
        where: {
          id,
        },
        data: {
          deleted_at: new Date().toISOString(),
          deleted_by_id: this.userId,
          updated_by_id: this.userId,
          is_active: false,
        },
      });

      return {};
    });

    return Result.ok(tx);
  }
}
