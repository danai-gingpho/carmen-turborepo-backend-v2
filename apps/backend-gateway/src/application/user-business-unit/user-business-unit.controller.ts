import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserBusinessUnitService } from './user-business-unit.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SetDefaultTenantRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
} from '@/common';

@Controller('api/business-unit')
@ApiTags('User: Business Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class UserBusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserBusinessUnitController.name,
  );

  constructor(
    private readonly userBusinessUnitService: UserBusinessUnitService,
  ) {
    super();
  }

  /**
   * Set the user's default business unit (tenant)
   * ตั้งค่าหน่วยธุรกิจเริ่มต้นของผู้ใช้ (tenant)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param body - Request body containing tenant_id / เนื้อหาคำขอที่มี tenant_id
   * @param version - API version / เวอร์ชัน API
   * @returns Updated default tenant / หน่วยธุรกิจเริ่มต้นที่อัปเดตแล้ว
   */
  @Post('default')
  @UseGuards(new AppIdGuard('userBusinessUnit.setDefaultTenant'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default tenant',
    description: 'Sets the user\'s default business unit (tenant), determining which hotel property\'s data and procurement operations are loaded upon login.',
    'x-description-th': 'ตั้งค่าหน่วยธุรกิจเริ่มต้นของผู้ใช้',
    operationId: 'setDefaultTenant',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Default tenant set successfully',
      },
      404: {
        description: 'Default tenant not found',
      },
    },
  } as any)
  @ApiBody({ type: SetDefaultTenantRequestDto })
  async setDefaultTenant(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { tenant_id: string },
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'setDefaultTenant',
        version,
      },
      UserBusinessUnitController.name,
    );

    const { user_id, tenant_id: _tenant_id } = ExtractRequestHeader(req);
    const result = await this.userBusinessUnitService.setDefaultTenant(
      user_id,
      body.tenant_id,
      version,
    );
    this.respond(res, result);
  }

  // @Get()
  // @ApiVersionMinRequest()
  // @HttpCode(HttpStatus.OK)
  // async getBusinessUnit(@Req() req: Request, @Query('version') version: string = 'latest') {
  //   const {user_id} = ExtractRequestHeader(req);
  //   return this.userBusinessUnitService.getBusinessUnit(user_id, version);
  // }
}
