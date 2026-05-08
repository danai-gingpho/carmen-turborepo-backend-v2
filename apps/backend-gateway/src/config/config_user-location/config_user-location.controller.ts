import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { Config_UserLocationService } from './config_user-location.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserLocationUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/user/location')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_UserLocationController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UserLocationController.name,
  );
  constructor(
    private readonly config_userLocationService: Config_UserLocationService,
  ) {}

  /**
   * Retrieve all users assigned to a location
   * ค้นหารายการผู้ใช้ทั้งหมดที่ผูกกับสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param locationId - Location ID / รหัสสถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns List of users for the location / รายการผู้ใช้ของสถานที่
   */
  @Get(':locationId')
  @UseGuards(new AppIdGuard('userLocation.getUsersByLocationId'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Get users by location ID', description: 'Retrieves all users who have access to a specific storage location. This determines which staff members can perform inventory operations (stock-in, stock-out, transfers) at this location.', operationId: 'configUserLocation_findByLocationId', 'x-description-th': 'ดึงข้อมูลผู้ใช้ทั้งหมดที่ผูกกับสถานที่ตาม Location ID' } as any)
  async getUsersByLocationId(
    @Param('bu_code') bu_code: string,
    @Param('locationId') locationId: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getUsersByLocationId',
        locationId,
        version,
      },
      Config_UserLocationController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    return this.config_userLocationService.getUsersByLocationId(
      locationId,
      user_id,
      bu_code,
      version,
    );
  }

  /**
   * Update user assignments for a location
   * อัปเดตการกำหนดผู้ใช้ให้กับสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param locationId - Location ID / รหัสสถานที่
   * @param updateDto - User-location assignment update data / ข้อมูลสำหรับอัปเดตการกำหนดผู้ใช้-สถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated assignment result / ผลลัพธ์การอัปเดตการกำหนด
   */
  @Put(':locationId')
  @UseGuards(new AppIdGuard('userLocation.managerUserLocation'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Manage user-location assignments', description: 'Updates the set of users assigned to a specific storage location. Controls which staff members can perform inventory operations at this warehouse or store.', operationId: 'configUserLocation_manageAssignments', 'x-description-th': 'อัปเดตการกำหนดผู้ใช้ให้กับสถานที่' } as any)
  @ApiBody({ type: UserLocationUpdateRequest })
  async managerUserLocation(
    @Param('bu_code') bu_code: string,
    @Param('locationId') locationId: string,
    @Body() updateDto: Record<string, unknown>,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'managerUserLocation',
        locationId,
        updateDto,
        version,
      },
      Config_UserLocationController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    return this.config_userLocationService.managerUserLocation(
      locationId,
      updateDto,
      user_id,
      bu_code,
      version,
    );
  }
}
