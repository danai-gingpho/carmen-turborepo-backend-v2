import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserLocationService } from './user-location.service';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
} from '@/common';

@Controller('api/:bu_code/user-location')
@ApiTags('User: Locations')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
@UseGuards(KeycloakGuard)
export class UserLocationController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserLocationController.name,
  );

  constructor(private readonly userLocationService: UserLocationService) {
    super();
  }

  /**
   * List all locations accessible by the current user
   * ค้นหารายการสถานที่จัดเก็บทั้งหมดที่ผู้ใช้ปัจจุบันเข้าถึงได้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of user-accessible locations / รายการสถานที่ที่ผู้ใช้เข้าถึงได้
   */
  @Get()
  @UseGuards(new AppIdGuard('userLocation.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all user locations',
    description: 'Retrieves all storage locations (e.g., main warehouse, kitchen storeroom, bar stock) that the current user has access permissions for, controlling which inventory locations the user can perform stock-in, stock-out, and transfer operations on.',
    'x-description-th': 'ดึงรายการสถานที่ของผู้ใช้ทั้งหมดที่ผู้ใช้ปัจจุบันเข้าถึงได้',
    operationId: 'findAllUserLocations',
    responses: {
      200: { description: 'User locations retrieved successfully' },
    },
  } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      UserLocationController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.userLocationService.findAll(user_id, bu_code, version);
    this.respond(res, result);
  }
}
