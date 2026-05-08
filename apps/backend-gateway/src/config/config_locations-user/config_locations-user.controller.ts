import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_LocationsUserService } from './config_locations-user.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController } from '@/common';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { LocationUserUpdateRequest } from './swagger/request';

@Controller('api/config/:bu_code/locations/user')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_LocationsUserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsUserController.name,
  );

  constructor(
    private readonly config_locationsUserService: Config_LocationsUserService,
  ) {
    super();
  }

  @Get(':userId')
  @UseGuards(new AppIdGuard('locationUser.getLocationByUserId'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get locations by user ID', description: 'Retrieves all storage locations accessible to a specific user.', operationId: 'configLocationUser_findByUserId', 'x-description-th': 'ดึงข้อมูลสถานที่ทั้งหมดที่ผู้ใช้สามารถเข้าถึงได้ตาม User ID' } as any)
  async getLocationByUserId(
    @Param('userId') userId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getLocationByUserId', userId, version },
      Config_LocationsUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationsUserService.getLocationByUserId(userId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Put(':userId')
  @UseGuards(new AppIdGuard('locationUser.managerLocationUser'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manage location-user assignments', description: 'Updates the set of storage locations a user has access to.', operationId: 'configLocationUser_manageAssignments', 'x-description-th': 'อัปเดตการกำหนดสถานที่ให้กับผู้ใช้' } as any)
  @ApiBody({ type: LocationUserUpdateRequest })
  async managerLocationUser(
    @Param('userId') userId: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'managerLocationUser', userId, version },
      Config_LocationsUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationsUserService.managerLocationUser(userId, updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }
}
