import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
// import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import {
  IGoodReceivedNoteCreate,
  IGoodReceivedNoteUpdate,
  IGoodReceivedNoteDetailCreate,
  IGoodReceivedNoteDetailUpdate,
} from './interface/good-received-note.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { enum_doc_status, enum_good_received_note_status } from '@repo/prisma-shared-schema-tenant';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  NotificationService,
  // NotificationType,
  GoodReceivedNoteDetailResponseSchema,
  GoodReceivedNoteListItemResponseSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class GoodReceivedNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteService.name,
  );
  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly notificationService: NotificationService,
  ) { }

  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: id,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    const goodReceivedNoteDetail =
      await prisma.tb_good_received_note_detail.findMany({
        where: {
          good_received_note_id: id,
        },
      });

    const extraCost = await prisma.tb_extra_cost.findMany({
      where: {
        good_received_note_id: id,
      },
    });

    const extraCostDetail = await prisma.tb_extra_cost_detail.findMany({
      where: {
        extra_cost_id: {
          in: extraCost.map((item) => item.id),
        },
      },
    });

    const responseData = {
      ...goodReceivedNote,
      good_received_note_detail: goodReceivedNoteDetail,
      extra_cost: extraCost,
      extra_cost_detail: extraCostDetail,
    };

    const serializedData = GoodReceivedNoteDetailResponseSchema.parse(responseData);

    return Result.ok(serializedData);
  }

  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate },
      GoodReceivedNoteService.name,
    );
    const defaultSearchFields = ['grn_no', 'name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note
      .findMany({
        ...q.findMany(),
        select: {
          id: true,
          grn_no: true,
          description: true,
          vendor_name: true,
          created_at: true,
          is_active: true,
        },
      })
      .then(async (res) => {
        return await Promise.all(
          res.map(async (item) => {
            const goodReceivedNoteDetail =
              await prisma.tb_good_received_note_detail.findMany({
                where: {
                  good_received_note_id: item.id,
                },
                select: {
                  // total_amount: true,
                },
              });

            return {
              id: item.id,
              grn_no: item.grn_no,
              description: item.description,
              vendor_name: item.vendor_name,
              created_at: item.created_at,
              // total_amount: goodReceivedNoteDetail.reduce(
              //   (acc, curr) => acc + Number(curr.total_amount),
              //   0,
              // ),
              total_amount: 0, // todo calculate total amount
              is_active: item.is_active,
            };
          }),
        );
      });

    const total = await prisma.tb_good_received_note.count({
      where: {
        ...q.where(),
      },
    });

    const serializedGoodReceivedNotes = goodReceivedNote.map((item) =>
      GoodReceivedNoteListItemResponseSchema.parse(item)
    );

    return Result.ok({
      data: serializedGoodReceivedNotes,
      paginate: {
        total: total,
        page: q.page,
        perpage: q.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async create(
    data: IGoodReceivedNoteCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    if (data.vendor_id) {
      const foundVendor = await prisma.tb_vendor.findFirst({
        where: {
          id: data.vendor_id,
        },
      });

      if (!foundVendor) {
        return Result.error('Vendor not found', ErrorCode.NOT_FOUND);
      } else {
        data.vendor_name = foundVendor.name;
      }
    }

    const currency = await prisma.tb_currency.findFirst({
      where: {
        id: data.currency_id,
      },
    });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    } else {
      if (!data.currency_rate) {
        data.currency_rate = Number(currency.exchange_rate);
      }
      data.currency_name = currency.name;
    }

    // if (data.workflow_id) {
    //   const workflow = await prisma.tb_workflow.findFirst({
    //     where: {
    //       id: data.workflow_id,
    //     },
    //   });

    //   if (!workflow) {
    //     return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    //   }
    // }

    if (data.credit_term_id) {
      const creditTerm = await prisma.tb_credit_term.findFirst({
        where: {
          id: data.credit_term_id,
        },
      });

      if (!creditTerm) {
        return Result.error('Credit term not found', ErrorCode.NOT_FOUND);
      } else {
        data.credit_term_name = creditTerm.name;
        data.credit_term_days = Number(creditTerm.value);
      }
    }

    if (data.good_received_note_detail?.add) {
      const purchaseOrderDetailNotFound: string[] = [];
      const locationNotFound: string[] = [];
      const productNotFound: string[] = [];
      const orderUnitNotFound: string[] = [];
      const receivedUnitNotFound: string[] = [];
      const focUnitNotFound: string[] = [];
      const taxProfileNotFound: string[] = [];
      const deliveryPointNotFound: string[] = [];

      await Promise.all(
        data.good_received_note_detail.add.map(async (item) => {
          if (item.purchase_order_detail_id) {
            const findPurchaseOrderDetail =
              await prisma.tb_purchase_order_detail.findFirst({
                where: {
                  id: item.purchase_order_detail_id,
                },
              });

            if (!findPurchaseOrderDetail) {
              purchaseOrderDetailNotFound.push(item.purchase_order_detail_id);
            }
          }

          const findLocation = await prisma.tb_location.findFirst({
            where: {
              id: item.location_id,
            },
          });

          if (!findLocation) {
            locationNotFound.push(item.location_id);
          } else {
            item.location_name = findLocation.name;
          }

          const findProduct = await prisma.tb_product.findFirst({
            where: {
              id: item.product_id,
            },
          });

          if (!findProduct) {
            productNotFound.push(item.product_id);
          } else {
            item.product_name = findProduct.name;
            item.product_local_name = findProduct.local_name;
          }

          const findOrderUnit = await prisma.tb_unit.findFirst({
            where: {
              id: item.order_unit_id,
            },
          });

          if (!findOrderUnit) {
            orderUnitNotFound.push(item.order_unit_id);
          } else {
            item.order_unit_name = findOrderUnit.name;
          }

          const findReceivedUnit = await prisma.tb_unit.findFirst({
            where: {
              id: item.received_unit_id,
            },
          });

          if (!findReceivedUnit) {
            receivedUnitNotFound.push(item.received_unit_id);
          } else {
            item.received_unit_name = findReceivedUnit.name;
          }

          if (item.foc_unit_id) {
            const findFocUnit = await prisma.tb_unit.findFirst({
              where: {
                id: item.foc_unit_id,
              },
            });

            if (!findFocUnit) {
              focUnitNotFound.push(item.foc_unit_id);
            } else {
              item.foc_unit_name = findFocUnit.name;
            }
          }

          if (item.tax_profile_id) {
            const gbl_findTaxProfile =
              await prisma.tb_application_config.findFirst({
                where: {
                  key: "tax_profile",
                },
              });

            if (!gbl_findTaxProfile) {
              taxProfileNotFound.push(item.tax_profile_name);
            }

            if (gbl_findTaxProfile && gbl_findTaxProfile.value) {
              const taxProfile = gbl_findTaxProfile.value as any[];
              const findTaxProfile = taxProfile.find(
                (tax: any) => tax.id === item.tax_profile_id,
              );
              if (!findTaxProfile) {
                taxProfileNotFound.push(item.tax_profile_name);
              }
            }
          }

          if (item.delivery_point_id) {
            const findDeliveryPoint = await prisma.tb_delivery_point.findFirst(
              {
                where: {
                  id: item.delivery_point_id,
                },
              },
            );

            if (!findDeliveryPoint) {
              deliveryPointNotFound.push(item.delivery_point_id);
            } else {
              item.delivery_point_name = findDeliveryPoint.name;
            }
          }
        }),
      );

      if (purchaseOrderDetailNotFound.length > 0) {
        return Result.error(`Purchase order detail not found: ${purchaseOrderDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (locationNotFound.length > 0) {
        return Result.error(`Location not found: ${locationNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (productNotFound.length > 0) {
        return Result.error(`Product not found: ${productNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (orderUnitNotFound.length > 0) {
        return Result.error(`Order unit not found: ${orderUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (receivedUnitNotFound.length > 0) {
        return Result.error(`Received unit not found: ${receivedUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (focUnitNotFound.length > 0) {
        return Result.error(`Foc unit not found: ${focUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (taxProfileNotFound.length > 0) {
        return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (deliveryPointNotFound.length > 0) {
        return Result.error(`Delivery point not found: ${deliveryPointNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }
    }

    if (data.extra_cost?.extra_cost_detail?.add) {
      const extraCostTypeNotFound: string[] = [];
      const taxProfileNotFound: string[] = [];

      await Promise.all(
        data.extra_cost.extra_cost_detail.add.map(async (item) => {
          const findExtraCostType = await prisma.tb_extra_cost_type.findFirst({
            where: {
              id: item.extra_cost_type_id,
            },
          });

          if (!findExtraCostType) {
            extraCostTypeNotFound.push(item.extra_cost_type_id);
          } else {
            item.extra_cost_type_name = findExtraCostType.name;
          }

          // if (item.tax_profile_name) {
          //   const gbl_findTaxProfile =
          //     await prisma.tb_application_config.findFirst({
          //       where: {
          //         key: "tax_profile",
          //       },
          //     });

          //   if (!gbl_findTaxProfile) {
          //     taxProfileNotFound.push(item.tax_profile_name);
          //   }

          //   if (gbl_findTaxProfile) {
          //     const taxProfile = JSON.parse(gbl_findTaxProfile.value as string);
          //     const findTaxProfile = taxProfile.find(
          //       (tax: any) => tax.name === item.tax_profile_name,
          //     );
          //     if (!findTaxProfile) {
          //       taxProfileNotFound.push(item.tax_profile_name);
          //     }
          //   }
          // }
        }),
      );

      if (extraCostTypeNotFound.length > 0) {
        return Result.error(`Extra cost type not found: ${extraCostTypeNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      // if (taxProfileNotFound.length > 0) {
      //   return Result.error('Tax profile not found', ErrorCode.NOT_FOUND, {
      //     tax_profile_name: taxProfileNotFound,
      //   });
      // }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const goodReceivedNoteObject: IGoodReceivedNoteCreate = {
        ...data,
      };

      delete goodReceivedNoteObject.good_received_note_detail;
      delete goodReceivedNoteObject.extra_cost;

      const createGoodReceivedNote = await prisma.tb_good_received_note.create({
        data: {
          ...goodReceivedNoteObject,
          created_by_id: user_id,
          grn_no: await this.generateGRNNo(
            data.received_at,
            tenant_id,
            user_id,
          ),
          doc_version: 0,
          doc_status: enum_doc_status.draft,
        },
      });

      if (data.good_received_note_detail?.add.length > 0) {
        const goodReceivedNoteDetailObj = await Promise.all(
          data.good_received_note_detail.add.map(async (item) => {
            return {
              good_received_note_id: createGoodReceivedNote.id,
              created_by_id: user_id,
              ...item,
            };
          }),
        );

        await prisma.tb_good_received_note_detail.createMany({
          data: goodReceivedNoteDetailObj,
        });
      }

      if (data.extra_cost) {
        const extraCostObj = { ...data.extra_cost };
        delete extraCostObj.extra_cost_detail;

        const createExtraCost = await prisma.tb_extra_cost.create({
          data: {
            good_received_note_id: createGoodReceivedNote.id,
            created_by_id: user_id,
            ...extraCostObj,
          },
        });

        if (data.extra_cost.extra_cost_detail?.add.length > 0) {
          const extraCostDetailObj = await Promise.all(
            data.extra_cost.extra_cost_detail.add.map(async (item) => {
              return JSON.parse(
                JSON.stringify({
                  ...item,
                  extra_cost_id: createExtraCost.id,
                  created_by_id: user_id,
                  name: createExtraCost['extra_cost_type_name'],
                  extra_cost_type_name: undefined,
                }),
              );
            }),
          );

          await prisma.tb_extra_cost_detail.createMany({
            data: extraCostDetailObj,
          });
        }
      }

      return { id: createGoodReceivedNote.id, grn_no: createGoodReceivedNote.grn_no };
    });

    // Send notification for GRN creation
    this.sendGRNCreatedNotification(tx, data, user_id);

    return Result.ok(tx);
  }

  @TryCatch
  async update(
    data: IGoodReceivedNoteUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id },
      'update',
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    if (data.vendor_id) {
      const foundVendor = await prisma.tb_vendor.findFirst({
        where: {
          id: data.vendor_id,
        },
      });

      if (!foundVendor) {
        return Result.error('Vendor not found', ErrorCode.NOT_FOUND);
      } else {
        data.vendor_name = foundVendor.name;
      }
    }

    if (data.currency_id) {
      const foundCurrency = await prisma.tb_currency.findFirst({
        where: {
          id: data.currency_id,
        },
      });

      if (!foundCurrency) {
        return Result.error('Currency not found', ErrorCode.NOT_FOUND);
      } else {
        if (!data.currency_rate) {
          data.currency_rate = Number(foundCurrency.exchange_rate);
        }
        data.currency_name = foundCurrency.name;
      }
    }

    // if (data.workflow_id) {
    //   const workflow = await prisma.tb_workflow.findFirst({
    //     where: {
    //       id: data.workflow_id,
    //     },
    //   });

    //   if (!workflow) {
    //     return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    //   }
    // }

    if (data.credit_term_id) {
      const creditTerm = await prisma.tb_credit_term.findFirst({
        where: {
          id: data.credit_term_id,
        },
      });

      if (!creditTerm) {
        return Result.error('Credit term not found', ErrorCode.NOT_FOUND);
      } else {
        data.credit_term_name = creditTerm.name;
        data.credit_term_days = Number(creditTerm.value);
      }
    }

    if (data.good_received_note_detail) {
      if (data.good_received_note_detail?.add) {
        const purchaseOrderDetailNotFound: string[] = [];
        const locationNotFound: string[] = [];
        const productNotFound: string[] = [];
        const orderUnitNotFound: string[] = [];
        const receivedUnitNotFound: string[] = [];
        const focUnitNotFound: string[] = [];
        const taxProfileNotFound: string[] = [];
        const deliveryPointNotFound: string[] = [];

        await Promise.all(
          data.good_received_note_detail.add.map(async (item) => {
            if (item.purchase_order_detail_id) {
              const findPurchaseOrderDetail =
                await prisma.tb_purchase_order_detail.findFirst({
                  where: {
                    id: item.purchase_order_detail_id,
                  },
                });

              if (!findPurchaseOrderDetail) {
                purchaseOrderDetailNotFound.push(item.purchase_order_detail_id);
              }
            }

            const findLocation = await prisma.tb_location.findFirst({
              where: {
                id: item.location_id,
              },
            });

            if (!findLocation) {
              locationNotFound.push(item.location_id);
            } else {
              item.location_name = findLocation.name;
            }

            const findProduct = await prisma.tb_product.findFirst({
              where: {
                id: item.product_id,
              },
            });

            if (!findProduct) {
              productNotFound.push(item.product_id);
            } else {
              item.product_name = findProduct.name;
              item.product_local_name = findProduct.local_name;
            }

            const findOrderUnit = await prisma.tb_unit.findFirst({
              where: {
                id: item.order_unit_id,
              },
            });

            if (!findOrderUnit) {
              orderUnitNotFound.push(item.order_unit_id);
            } else {
              item.order_unit_name = findOrderUnit.name;
            }

            const findReceivedUnit = await prisma.tb_unit.findFirst({
              where: {
                id: item.received_unit_id,
              },
            });

            if (!findReceivedUnit) {
              receivedUnitNotFound.push(item.received_unit_id);
            } else {
              item.received_unit_name = findReceivedUnit.name;
            }

            if (item.foc_unit_id) {
              const findFocUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: item.foc_unit_id,
                },
              });

              if (!findFocUnit) {
                focUnitNotFound.push(item.foc_unit_id);
              } else {
                item.foc_unit_name = findFocUnit.name;
              }
            }

            if (item.tax_profile_id) {
              const gbl_findTaxProfile =
                await prisma.tb_application_config.findFirst({
                  where: {
                    key: "tax_profile",
                  },
                });

              if (!gbl_findTaxProfile) {
                taxProfileNotFound.push(item.tax_profile_name);
              }

              if (gbl_findTaxProfile && gbl_findTaxProfile.value) {
                const taxProfile = gbl_findTaxProfile.value as any[];
                const findTaxProfile = taxProfile.find(
                  (tax: any) => tax.id === item.tax_profile_id,
                );
                if (!findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }
              }
            }

            if (item.delivery_point_id) {
              const findDeliveryPoint =
                await prisma.tb_delivery_point.findFirst({
                  where: {
                    id: item.delivery_point_id,
                  },
                });

              if (!findDeliveryPoint) {
                deliveryPointNotFound.push(item.delivery_point_id);
              } else {
                item.delivery_point_name = findDeliveryPoint.name;
              }
            }
          }),
        );

        if (purchaseOrderDetailNotFound.length > 0) {
          return Result.error(`Purchase order detail not found: ${purchaseOrderDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (locationNotFound.length > 0) {
          return Result.error(`Location not found: ${locationNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (productNotFound.length > 0) {
          return Result.error(`Product not found: ${productNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (orderUnitNotFound.length > 0) {
          return Result.error(`Order unit not found: ${orderUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (receivedUnitNotFound.length > 0) {
          return Result.error(`Received unit not found: ${receivedUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (focUnitNotFound.length > 0) {
          return Result.error(`Foc unit not found: ${focUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (taxProfileNotFound.length > 0) {
          return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (deliveryPointNotFound.length > 0) {
          return Result.error(`Delivery point not found: ${deliveryPointNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }

      if (data.good_received_note_detail?.update) {
        const goodReceivedNoteDetailNotFound: string[] = [];
        const purchaseOrderDetailNotFound: string[] = [];
        const locationNotFound: string[] = [];
        const productNotFound: string[] = [];
        const orderUnitNotFound: string[] = [];
        const receivedUnitNotFound: string[] = [];
        const focUnitNotFound: string[] = [];
        const taxProfileNotFound: string[] = [];
        const deliveryPointNotFound: string[] = [];

        await Promise.all(
          data.good_received_note_detail.update.map(async (item) => {
            const findGoodReceivedNoteDetail =
              await prisma.tb_good_received_note_detail.findFirst({
                where: {
                  id: item.id,
                },
              });

            if (!findGoodReceivedNoteDetail) {
              goodReceivedNoteDetailNotFound.push(item.id);
            }

            if (item.purchase_order_detail_id) {
              const findPurchaseOrderDetail =
                await prisma.tb_purchase_order_detail.findFirst({
                  where: {
                    id: item.purchase_order_detail_id,
                  },
                });

              if (!findPurchaseOrderDetail) {
                purchaseOrderDetailNotFound.push(item.purchase_order_detail_id);
              }
            }

            if (item.location_id) {
              const findLocation = await prisma.tb_location.findFirst({
                where: {
                  id: item.location_id,
                },
              });

              if (!findLocation) {
                locationNotFound.push(item.location_id);
              } else {
                item.location_name = findLocation.name;
              }
            }

            if (item.product_id) {
              const findProduct = await prisma.tb_product.findFirst({
                where: {
                  id: item.product_id,
                },
              });

              if (!findProduct) {
                productNotFound.push(item.product_id);
              } else {
                item.product_name = findProduct.name;
                item.product_local_name = findProduct.local_name;
              }
            }

            if (item.order_unit_id) {
              const findOrderUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: item.order_unit_id,
                },
              });

              if (!findOrderUnit) {
                orderUnitNotFound.push(item.order_unit_id);
              } else {
                item.order_unit_name = findOrderUnit.name;
              }
            }

            if (item.received_unit_id) {
              const findReceivedUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: item.received_unit_id,
                },
              });

              if (!findReceivedUnit) {
                receivedUnitNotFound.push(item.received_unit_id);
              } else {
                item.received_unit_name = findReceivedUnit.name;
              }
            }

            if (item.foc_unit_id) {
              const findFocUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: item.foc_unit_id,
                },
              });

              if (!findFocUnit) {
                focUnitNotFound.push(item.foc_unit_id);
              } else {
                item.foc_unit_name = findFocUnit.name;
              }
            }

            if (item.tax_profile_id) {
              const gbl_findTaxProfile =
                await prisma.tb_application_config.findFirst({
                  where: {
                    key: "tax_profile",
                  },
                });

              if (!gbl_findTaxProfile) {
                taxProfileNotFound.push(item.tax_profile_name);
              }

              if (gbl_findTaxProfile && gbl_findTaxProfile.value) {
                const taxProfile = gbl_findTaxProfile.value as any[];
                const findTaxProfile = taxProfile.find(
                  (tax: any) => tax.id === item.tax_profile_id,
                );
                if (!findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }
              }
            }

            if (item.delivery_point_id) {
              const findDeliveryPoint =
                await prisma.tb_delivery_point.findFirst({
                  where: {
                    id: item.delivery_point_id,
                  },
                });

              if (!findDeliveryPoint) {
                deliveryPointNotFound.push(item.delivery_point_id);
              } else {
                item.delivery_point_name = findDeliveryPoint.name;
              }
            }
          }),
        );

        if (goodReceivedNoteDetailNotFound.length > 0) {
          return Result.error(`Good received note detail not found: ${goodReceivedNoteDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (purchaseOrderDetailNotFound.length > 0) {
          return Result.error(`Purchase order detail not found: ${purchaseOrderDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (locationNotFound.length > 0) {
          return Result.error(`Location not found: ${locationNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (orderUnitNotFound.length > 0) {
          return Result.error(`Order unit not found: ${orderUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (receivedUnitNotFound.length > 0) {
          return Result.error(`Received unit not found: ${receivedUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (focUnitNotFound.length > 0) {
          return Result.error(`Foc unit not found: ${focUnitNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (taxProfileNotFound.length > 0) {
          return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (deliveryPointNotFound.length > 0) {
          return Result.error(`Delivery point not found: ${deliveryPointNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }

      if (data.good_received_note_detail?.remove) {
        const goodReceivedNoteDetailNotFound: string[] = [];

        await Promise.all(
          data.good_received_note_detail.remove.map(async (item) => {
            const findGoodReceivedNoteDetail =
              await prisma.tb_good_received_note_detail.findFirst({
                where: { id: item.id },
              });

            if (!findGoodReceivedNoteDetail) {
              goodReceivedNoteDetailNotFound.push(item.id);
            }
          }),
        );

        if (goodReceivedNoteDetailNotFound.length > 0) {
          return Result.error(`Good received note detail not found: ${goodReceivedNoteDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    if (data.extra_cost) {
      if (data.extra_cost.id) {
        const extraCost = await prisma.tb_extra_cost.findFirst({
          where: { id: data.extra_cost.id },
        });

        if (!extraCost) {
          return Result.error('Extra cost not found', ErrorCode.NOT_FOUND);
        }
      }

      if (data.extra_cost.extra_cost_detail) {
        if (data.extra_cost.extra_cost_detail?.add) {
          const extraCostTypeNotFound: string[] = [];
          const taxProfileNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.add.map(async (item) => {
              const findExtraCostType =
                await prisma.tb_extra_cost_type.findFirst({
                  where: {
                    id: item.extra_cost_type_id,
                  },
                });

              if (!findExtraCostType) {
                extraCostTypeNotFound.push(item.extra_cost_type_id);
              } else {
                item.extra_cost_type_name = findExtraCostType.name;
              }

              if (item.tax_profile_id) {
                const gbl_findTaxProfile =
                  await prisma.tb_application_config.findFirst({
                    where: {
                      key: "tax_profile",
                    },
                  });

                if (!gbl_findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }

                if (gbl_findTaxProfile && gbl_findTaxProfile.value) {
                  const taxProfile = gbl_findTaxProfile.value as any[];
                  const findTaxProfile = taxProfile.find(
                    (tax: any) => tax.id === item.tax_profile_id,
                  );
                  if (!findTaxProfile) {
                    taxProfileNotFound.push(item.tax_profile_name);
                  }
                }
              }
            }),
          );

          if (extraCostTypeNotFound.length > 0) {
            return Result.error(`Extra cost type not found: ${extraCostTypeNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (taxProfileNotFound.length > 0) {
            return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }

        if (data.extra_cost.extra_cost_detail?.update) {
          const extraCostDetailNotFound: string[] = [];
          const extraCostTypeNotFound: string[] = [];
          const taxProfileNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.update.map(async (item) => {
              const findExtraCostDetail =
                await prisma.tb_extra_cost_detail.findFirst({
                  where: { id: item.id },
                });

              if (!findExtraCostDetail) {
                extraCostDetailNotFound.push(item.id);
              }

              if (item.extra_cost_type_id) {
                const findExtraCostType =
                  await prisma.tb_extra_cost_type.findFirst({
                    where: { id: item.extra_cost_type_id },
                  });

                if (!findExtraCostType) {
                  extraCostTypeNotFound.push(item.extra_cost_type_id);
                } else {
                  item.extra_cost_type_name = findExtraCostType.name;
                }
              }

              if (item.tax_profile_id) {
                const gbl_findTaxProfile =
                  await prisma.tb_application_config.findFirst({
                    where: { key: "tax_profile" },
                  });

                if (!gbl_findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }

                if (gbl_findTaxProfile && gbl_findTaxProfile.value) {
                  const taxProfile = gbl_findTaxProfile.value as any[];
                  const findTaxProfile = taxProfile.find(
                    (tax: any) => tax.id === item.tax_profile_id,
                  );
                  if (!findTaxProfile) {
                    taxProfileNotFound.push(item.tax_profile_name);
                  }
                }
              }
            }),
          );

          if (extraCostDetailNotFound.length > 0) {
            return Result.error(`Extra cost detail not found: ${extraCostDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (extraCostTypeNotFound.length > 0) {
            return Result.error(`Extra cost type not found: ${extraCostTypeNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (taxProfileNotFound.length > 0) {
            return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }

        if (data.extra_cost.extra_cost_detail?.remove) {
          const extraCostDetailNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.remove.map(async (item) => {
              const findExtraCostDetail =
                await prisma.tb_extra_cost_detail.findFirst({
                  where: { id: item.id },
                });

              if (!findExtraCostDetail) {
                extraCostDetailNotFound.push(item.id);
              }
            }),
          );

          if (extraCostDetailNotFound.length > 0) {
            return Result.error(`Extra cost detail not found: ${extraCostDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }
      }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const goodReceivedNoteObject: IGoodReceivedNoteUpdate = { ...data };
      delete goodReceivedNoteObject.good_received_note_detail;
      delete goodReceivedNoteObject.extra_cost;

      if (Object.keys(goodReceivedNoteObject).length > 0) {
        await prisma.tb_good_received_note.update({
          where: { id: data.id },
          data: {
            ...goodReceivedNoteObject,
            updated_by_id: user_id,
            updated_at: new Date(),
          },
        });
      }

      if (data.good_received_note_detail) {
        if (data.good_received_note_detail.add.length > 0) {
          const goodReceivedNoteDetailCreateObj = await Promise.all(
            data.good_received_note_detail.add.map(async (item) => {
              return {
                good_received_note_id: data.id,
                created_by_id: user_id,
                ...item,
              };
            }),
          );

          await prisma.tb_good_received_note_detail.createMany({
            data: goodReceivedNoteDetailCreateObj,
          });
        }

        // todo update good received note detail
        // if (data.good_received_note_detail.update.length > 0) {
        //   await Promise.all(
        //     data.good_received_note_detail.update.map(async (item) => {
        //       await prisma.tb_good_received_note_detail.update({
        //         where: { id: item.id },
        //         data: {
        //           ...item,
        //           updated_by_id: user_id,
        //           updated_at: new Date(),
        //         },
        //       });
        //     }),
        //   );
        // }

        if (data.good_received_note_detail.remove.length > 0) {
          const goodReceivedNoteDetailId = await Promise.all(
            data.good_received_note_detail.remove.map(async (item) => {
              return item.id;
            }),
          );

          await prisma.tb_good_received_note_detail.deleteMany({
            where: { id: { in: goodReceivedNoteDetailId } },
          });
        }
      }

      if (data.extra_cost) {
        if (data.extra_cost.id) {
          const extraCostObject = { ...data.extra_cost };
          delete extraCostObject.extra_cost_detail;

          await prisma.tb_extra_cost.update({
            where: { id: data.extra_cost.id },
            data: {
              ...extraCostObject,
              updated_by_id: user_id,
              updated_at: new Date(),
            },
          });
        } else {
          const extraCostObject = { ...data.extra_cost };
          delete extraCostObject.extra_cost_detail;

          await prisma.tb_extra_cost.create({
            data: {
              ...extraCostObject,
              good_received_note_id: data.id,
              created_by_id: user_id,
            },
          });
        }

        if (data.extra_cost.extra_cost_detail?.add.length > 0) {
          const extraCostDetailObj = await Promise.all(
            data.extra_cost.extra_cost_detail.add.map(async (item) => {
              return {
                extra_cost_id: data.extra_cost.id,
                created_by_id: user_id,
                ...item,
              };
            }),
          );

          await prisma.tb_extra_cost_detail.createMany({
            data: extraCostDetailObj,
          });
        }

        if (data.extra_cost.extra_cost_detail?.update.length > 0) {
          await Promise.all(
            data.extra_cost.extra_cost_detail.update.map(async (item) => {
              await prisma.tb_extra_cost_detail.update({
                where: { id: item.id },
                data: {
                  ...item,
                  updated_by_id: user_id,
                  updated_at: new Date(),
                },
              });
            }),
          );
        }
        if (data.extra_cost.extra_cost_detail?.remove.length > 0) {
          const extraCostDetailId =
            data.extra_cost.extra_cost_detail.remove.map((item) => item.id);

          await prisma.tb_extra_cost_detail.deleteMany({
            where: { id: { in: extraCostDetailId } },
          });
        }
      }

      return { id: data.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'delete', id, user_id, tenant_id }, 'delete');
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: id,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    await prisma.tb_good_received_note_detail.deleteMany({
      where: {
        good_received_note_id: id,
      },
    });

    const extraCost = await prisma.tb_extra_cost
      .findMany({
        where: {
          good_received_note_id: id,
        },
        select: {
          id: true,
        },
      })
      .then((res) => {
        return res.map((item) => item.id);
      });

    await prisma.tb_extra_cost_detail.deleteMany({
      where: {
        extra_cost_id: { in: extraCost },
      },
    });

    await prisma.tb_extra_cost.deleteMany({
      where: {
        good_received_note_id: id,
      },
    });

    await prisma.tb_good_received_note.delete({
      where: {
        id: id,
      },
    });

    return Result.ok({ id });
  }

  async findLatestPrByPattern(
    pattern: string,
    tenant_id: string,
    user_id: string,
  ): Promise<any> {
    this.logger.debug(
      { function: 'findLatestPrByPattern', pattern, tenant_id, user_id },
      'findLatestPrByPattern',
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      throw new Error('tenant not found');
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        grn_no: {
          contains: pattern,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return goodReceivedNote;
  }

  private async generateGRNNo(
    GRNDate: string,
    tenant_id: string,
    user_id: string,
  ) {
    this.logger.debug(
      { function: 'generateGRNNo', GRNDate, tenant_id, user_id },
      'generateGRNNo',
    );
    // const pattern = await this.commonLogic.getRunningPattern('PR', user_id, tenant_id)
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'GRN', user_id, bu_code: tenant_id },
    );
    const response = await firstValueFrom(res);
    const patterns = response.data;

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    const getDate = new Date(GRNDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestGRN = await this.findLatestPrByPattern(
      datePatternValue,
      tenant_id,
      user_id,
    );
    const latestGRNNumber = latestGRN
      ? Number(latestGRN.grn_no.slice(-Number(runningPattern.pattern)))
      : 0;

    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'GRN',
        issueDate: getDate,
        last_no: latestGRNNumber,
        user_id,
        bu_code: tenant_id,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);
    const grnNo = generateCodeResponse.data.code;

    return grnNo;
  }

  /**
   * Send notification when GRN is created
   */
  private async sendGRNCreatedNotification(
    grnData: { id: string; grn_no?: string },
    createData: IGoodReceivedNoteCreate,
    creatorId: string,
  ): Promise<void> {
    try {
      const grnNo = grnData.grn_no || 'N/A';

      // Notify the creator
      await this.notificationService.sendGRNNotification(
        creatorId,
        `Good Received Note Created: ${grnNo}`,
        `Good Received Note ${grnNo} has been created for vendor ${createData.vendor_name || 'N/A'}.`,
        {
          grn_id: grnData.id,
          grn_no: grnNo,
          vendor_id: createData.vendor_id,
          vendor_name: createData.vendor_name,
          action: 'created',
        },
        creatorId,
      );

      this.logger.log(`Notification sent for GRN ${grnNo} creation`);
    } catch (error) {
      this.logger.error('Failed to send GRN created notification:', error);
    }
  }

  /**
   * Export Good Received Note to Excel
   */
  @TryCatch
  async exportToExcel(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      { function: 'exportToExcel', id, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Fetch GRN with details
    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id },
      include: {
        tb_good_received_note_detail: {
          include: {
            tb_good_received_note_detail_item: true,
          },
        },
        tb_vendor: true,
        tb_currency: true,
      },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carmen System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('GRN Details');

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    // Title
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Good Received Note: ${grn.grn_no || 'N/A'}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // GRN Info
    worksheet.addRow([]);
    worksheet.addRow(['GRN No:', grn.grn_no || 'N/A', '', 'GRN Date:', grn.grn_date ? format(new Date(grn.grn_date), 'yyyy-MM-dd') : 'N/A']);
    worksheet.addRow(['Vendor:', grn.vendor_name || grn.tb_vendor?.name || 'N/A', '', 'Status:', grn.doc_status]);
    worksheet.addRow(['Invoice No:', grn.invoice_no || 'N/A', '', 'Invoice Date:', grn.invoice_date ? format(new Date(grn.invoice_date), 'yyyy-MM-dd') : 'N/A']);
    worksheet.addRow(['Currency:', grn.currency_name || grn.tb_currency?.name || 'N/A', '', 'Exchange Rate:', Number(grn.exchange_rate) || 1]);
    worksheet.addRow(['Description:', grn.description || 'N/A']);
    worksheet.addRow([]);

    // Detail items header
    const detailHeaderRow = worksheet.addRow([
      'Seq',
      'Product Name',
      'Location',
      'Order Qty',
      'Order Unit',
      'Received Qty',
      'Received Unit',
      'FOC Qty',
      'Price',
      'Total Price',
    ]);
    detailHeaderRow.eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });

    // Flatten details and items
    let seq = 1;
    for (const detail of grn.tb_good_received_note_detail) {
      for (const item of detail.tb_good_received_note_detail_item) {
        const row = worksheet.addRow([
          seq++,
          detail.product_name || 'N/A',
          detail.location_name || 'N/A',
          Number(item.order_qty) || 0,
          item.order_unit_name || 'N/A',
          Number(item.received_qty) || 0,
          item.received_unit_name || 'N/A',
          Number(item.foc_qty) || 0,
          Number(item.base_price) || 0,
          Number(item.total_price) || 0,
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `GRN_${grn.grn_no || id}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    return Result.ok({ buffer: Buffer.from(buffer), filename });
  }

  /**
   * Reject a Good Received Note - changes status to voided
   */
  @TryCatch
  async reject(
    id: string,
    reason: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'reject', id, reason, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find the GRN
    const grn = await prisma.tb_good_received_note.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    // Validate status - only allow rejection from draft or saved status
    const allowedStatuses: enum_good_received_note_status[] = [
      enum_good_received_note_status.draft,
      enum_good_received_note_status.saved,
    ];

    if (!allowedStatuses.includes(grn.doc_status)) {
      return Result.error(
        `Cannot reject GRN with status '${grn.doc_status}'. Only draft or saved GRNs can be rejected.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Update GRN status to voided
    await prisma.tb_good_received_note.update({
      where: { id },
      data: {
        doc_status: enum_good_received_note_status.voided,
        note: reason ? `Rejected: ${reason}` : grn.note,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    // Send rejection notification
    await this.sendGRNRejectedNotification(grn, reason, user_id);

    return Result.ok({ id, message: 'Good Received Note rejected successfully' });
  }

  /**
   * Send notification when GRN is rejected
   */
  private async sendGRNRejectedNotification(
    grn: any,
    reason: string,
    rejectorId: string,
  ): Promise<void> {
    try {
      const grnNo = grn.grn_no || 'N/A';
      const creatorId = grn.created_by_id;

      // Notify the creator
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

  // ==================== Good Received Note Detail CRUD ====================

  /**
   * Find a GRN Detail by ID
   */
  @TryCatch
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detail = await prisma.tb_good_received_note_detail.findFirst({
      where: {
        id: detailId,
      },
      include: {
        tb_good_received_note_detail_item: true,
        tb_good_received_note: {
          select: {
            id: true,
            grn_no: true,
            doc_status: true,
          },
        },
        tb_location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_product: {
          select: {
            id: true,
            name: true,
            local_name: true,
          },
        },
      },
    });

    if (!detail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(detail);
  }

  /**
   * Find all GRN Details by GRN ID
   */
  @TryCatch
  async findDetailsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', grnId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // First check if GRN exists
    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id: grnId },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_good_received_note_detail.findMany({
      where: {
        good_received_note_id: grnId,
      },
      include: {
        tb_good_received_note_detail_item: true,
        tb_location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_product: {
          select: {
            id: true,
            name: true,
            local_name: true,
          },
        },
      },
      orderBy: {
        sequence_no: 'asc',
      },
    });

    return Result.ok(details);
  }

  /**
   * Create a new GRN Detail
   */
  @TryCatch
  async createDetail(
    grnId: string,
    data: IGoodReceivedNoteDetailCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', grnId, data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Check if GRN exists and is in draft status
    const grn = await prisma.tb_good_received_note.findFirst({
      where: {
        id: grnId,
        deleted_at: null,
      },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    if (grn.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot add detail to non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Get next sequence number
    const maxSequence = await prisma.tb_good_received_note_detail.aggregate({
      where: { good_received_note_id: grnId },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    // Create detail and item in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create detail
      const detail = await tx.tb_good_received_note_detail.create({
        data: {
          good_received_note_id: grnId,
          sequence_no: data.sequence_no || nextSequence,
          purchase_order_id: data.purchase_order_detail_id ? grn.id : null,
          purchase_order_detail_id: data.purchase_order_detail_id,
          location_id: data.location_id,
          location_name: data.location_name,
          product_id: data.product_id,
          product_name: data.product_name,
          product_local_name: data.product_local_name,
        },
      });

      // Create detail item with quantity/pricing info
      const detailItem = await tx.tb_good_received_note_detail_item.create({
        data: {
          good_received_note_detail_id: detail.id,
          inventory_transaction_id: data.inventory_transaction_id,
          order_qty: data.order_qty || 0,
          order_unit_id: data.order_unit_id,
          order_unit_name: data.order_unit_name,
          received_qty: data.received_qty || 0,
          received_unit_id: data.received_unit_id,
          received_unit_name: data.received_unit_name,
          foc_qty: data.foc_qty || 0,
          foc_unit_id: data.foc_unit_id,
          foc_unit_name: data.foc_unit_name,
          tax_profile_id: data.tax_profile_id,
          tax_profile_name: data.tax_profile_name,
          tax_rate: data.tax_rate || 0,
          tax_amount: data.tax_amount || 0,
          is_tax_adjustment: data.is_tax_adjustment || false,
          discount_rate: data.discount_rate || 0,
          discount_amount: data.discount_amount || 0,
          is_discount_adjustment: data.is_discount_adjustment || false,
          base_price: data.base_price || data.price || 0,
          sub_total_price: data.price ? (data.price * (data.received_qty || 0)) : 0,
          total_price: data.total_amount || 0,
          note: data.note,
          created_by_id: user_id,
        },
      });

      return { ...detail, tb_good_received_note_detail_item: [detailItem] };
    });

    return Result.ok(result);
  }

  /**
   * Update a GRN Detail
   */
  @TryCatch
  async updateDetail(
    detailId: string,
    data: IGoodReceivedNoteDetailUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find existing detail with GRN
    const existingDetail = await prisma.tb_good_received_note_detail.findFirst({
      where: { id: detailId },
      include: {
        tb_good_received_note: true,
        tb_good_received_note_detail_item: true,
      },
    });

    if (!existingDetail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_good_received_note?.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot update detail of non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Update detail and item in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update detail
      const updatedDetail = await tx.tb_good_received_note_detail.update({
        where: { id: detailId },
        data: {
          sequence_no: data.sequence_no,
          location_id: data.location_id,
          location_name: data.location_name,
          product_id: data.product_id,
          product_name: data.product_name,
          product_local_name: data.product_local_name,
        },
      });

      // Update detail item if exists
      const existingItem = existingDetail.tb_good_received_note_detail_item?.[0];
      if (existingItem) {
        await tx.tb_good_received_note_detail_item.update({
          where: { id: existingItem.id },
          data: {
            inventory_transaction_id: data.inventory_transaction_id,
            order_qty: data.order_qty,
            order_unit_id: data.order_unit_id,
            order_unit_name: data.order_unit_name,
            received_qty: data.received_qty,
            received_unit_id: data.received_unit_id,
            received_unit_name: data.received_unit_name,
            foc_qty: data.foc_qty,
            foc_unit_id: data.foc_unit_id,
            foc_unit_name: data.foc_unit_name,
            tax_profile_id: data.tax_profile_id,
            tax_profile_name: data.tax_profile_name,
            tax_rate: data.tax_rate,
            tax_amount: data.tax_amount,
            is_tax_adjustment: data.is_tax_adjustment,
            discount_rate: data.discount_rate,
            discount_amount: data.discount_amount,
            is_discount_adjustment: data.is_discount_adjustment,
            base_price: data.base_price ?? data.price,
            total_price: data.total_amount,
            note: data.note,
            updated_by_id: user_id,
            updated_at: new Date(),
          },
        });
      }

      return updatedDetail;
    });

    return Result.ok(result);
  }

  /**
   * Delete a GRN Detail
   */
  @TryCatch
  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find existing detail with GRN
    const existingDetail = await prisma.tb_good_received_note_detail.findFirst({
      where: { id: detailId },
      include: {
        tb_good_received_note: true,
        tb_good_received_note_detail_item: true,
      },
    });

    if (!existingDetail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_good_received_note?.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot delete detail of non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Delete detail and related items in transaction
    await prisma.$transaction(async (tx) => {
      // Delete detail items first (due to foreign key)
      await tx.tb_good_received_note_detail_item.deleteMany({
        where: { good_received_note_detail_id: detailId },
      });

      // Delete detail comments
      await tx.tb_good_received_note_detail_comment.deleteMany({
        where: { good_received_note_detail_id: detailId },
      });

      // Delete detail
      await tx.tb_good_received_note_detail.delete({
        where: { id: detailId },
      });
    });

    return Result.ok({ id: detailId });
  }
}
