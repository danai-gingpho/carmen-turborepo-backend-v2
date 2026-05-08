import { Controller, UseGuards } from '@nestjs/common';
import { BusinessUnitService } from './business-unit.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController } from '@/common';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('/api/:bu_code/business-unit')
@ApiTags('User: Business Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class BusinessUnitController extends BaseHttpController {
  constructor(private readonly _businessUnitService: BusinessUnitService) {
    super();
  }
}
