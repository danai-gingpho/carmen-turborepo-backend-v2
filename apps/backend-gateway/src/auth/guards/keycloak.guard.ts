import { Injectable, ExecutionContext, UnauthorizedException, Type, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { BusinessUnit, ValidatedUser, AuthenticatedUser } from '../interfaces/auth.interface';
import { PermissionService } from '../services/permission.service';
import { Reflector } from '@nestjs/core';
import { IGNORE_GUARDS_KEY } from '../decorators/ignore-guard.decorator';
import { OPTIONAL_BU_CODE_KEY } from '../decorators/optional-bu-code.decorator';

@Injectable()
export class KeycloakGuard extends AuthGuard('keycloak') {
  private readonly logger = new BackendLogger(KeycloakGuard.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ignoredGuards = this.reflector.getAllAndOverride<Array<Type<CanActivate>>>(
      IGNORE_GUARDS_KEY,
      [
        context.getHandler(), // Check specific method
        context.getClass(),   // Check controller class
      ],
    );

    console.log('Ignored Guards:', ignoredGuards);

    // 3. Check if *this* specific Guard class is in the list
    if (ignoredGuards && ignoredGuards.includes(KeycloakGuard)) {
      return true; // Bypass this guard
    }

    // Call parent canActivate which triggers the strategy's validate method
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as ValidatedUser;

    const isUrlNotRequireBuCode = !request.query?.bu_code && !request.params?.bu_code;

    // Check if endpoint has @OptionalBuCode() decorator
    const isOptionalBuCode = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_BU_CODE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isUrlNotRequireBuCode) {
      // If @OptionalBuCode() is present, return ALL user's BUs
      if (isOptionalBuCode && user.bu && user.bu.length > 0) {
        return this.setAllUserBusToRequest(request, user);
      }

      // Default behavior: basic user data without BU headers
      const userData: AuthenticatedUser = {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        email: user.email,
      };

      request.user = userData;

      return true;
    }

    // BU validation logic
    const buCodeParam = request.query?.bu_code || request.params?.bu_code;

    if (!buCodeParam) {
      throw new UnauthorizedException('bu_code parameter is required');
    }

    // Parse bu_code parameter - support single or comma-separated multiple values
    const buCodes = typeof buCodeParam === 'string'
      ? buCodeParam.split(',').map(code => code.trim()).filter(Boolean)
      : [buCodeParam];

    // Find all matching BUs and collect unauthorized ones
    const matchedBus: BusinessUnit[] = [];
    const unauthorizedBus: string[] = [];

    buCodes.forEach(code => {
      const matched = user.bu.find((bu: BusinessUnit) => bu.bu_code === code);
      if (matched) {
        matchedBus.push(matched);
      } else {
        unauthorizedBus.push(code);
      }
    });

    // Throw error if user requested any BU codes they don't have permission for
    if (unauthorizedBus.length > 0) {
      this.logger.warn(`User ${user.user_id} attempted to access unauthorized BU codes: ${unauthorizedBus.join(', ')}`);
      throw new UnauthorizedException(
        `Access denied. You do not have permission for the following BU code(s): ${unauthorizedBus.join(', ')}`
      );
    }

    // Throw error if no matching BUs were found
    if (matchedBus.length === 0) {
      this.logger.warn(`No matching bu_codes found for user ${user.user_id}`);
      throw new UnauthorizedException('No valid BU codes provided');
    }

    // Additional check: if matched BUs count is less than requested BUs count
    if (matchedBus.length < buCodes.length) {
      this.logger.warn(`Matched BUs (${matchedBus.length}) is less than requested BUs (${buCodes.length}) for user ${user.user_id}`);
      throw new UnauthorizedException('Access denied to one or more requested BU codes');
    }

    let userPermissions = {};

    // Set headers based on single or multiple BU codes
    if (matchedBus.length === 1) {
      const matchedBu = matchedBus[0];
      // Fetch user permissions from database
      userPermissions = await this.permissionService.getUserPermissions(user.user_id, matchedBu.bu_id);

      // Attach user information to the request object (including permissions)
      const authenticatedUser: AuthenticatedUser = {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        email: user.email,
        permissions: userPermissions,
      };

      request.user = authenticatedUser;
      // Single BU code - backward compatible behavior
      request.headers['x-bu-code'] = matchedBu.bu_code;
      request.headers['x-bu-role'] = matchedBu.role;
      request.headers['x-bu-id'] = matchedBu.bu_id;
      request.headers['x-bu-datas'] = JSON.stringify([{
        bu_id: matchedBu.bu_id,
        bu_code: matchedBu.bu_code,
        role: matchedBu.role,
        permissions: userPermissions,
      }]);
    } else {
      // Multiple BU codes - set x-bu-datas with array of BU details
      const buDatas = await Promise.all(
        matchedBus.map(async (bu) => ({
          bu_id: bu.bu_id,
          bu_code: bu.bu_code,
          role: bu.role,
          permissions: await this.permissionService.getUserPermissions(user.user_id, bu.bu_id),
        }))
      )

      request.headers['x-bu-datas'] = JSON.stringify(buDatas);
      request.headers['x-bu-code'] = matchedBus.map(bu => bu.bu_code).join(',');
      request.headers['x-bu-id'] = matchedBus.map(bu => bu.bu_id).join(',');
      request.headers['x-bu-role'] = matchedBus.map(bu => bu.role).join(',');
    }

    this.logger.debug(
      { user_id: user.user_id, bu_codes: matchedBus.map(bu => bu.bu_code) },
      'User authenticated and authorized for BU codes'
    );

    return true;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }

  /**
   * Set ALL user's BUs to request headers when bu_code is optional and not provided.
   * This allows endpoints to return data for all BUs the user has access to.
   */
  private async setAllUserBusToRequest(request: any, user: ValidatedUser): Promise<boolean> {
    const allBus = user.bu;

    if (allBus.length === 1) {
      const bu = allBus[0];
      const userPermissions = await this.permissionService.getUserPermissions(user.user_id, bu.bu_id);

      const authenticatedUser: AuthenticatedUser = {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        email: user.email,
        permissions: userPermissions,
      };

      request.user = authenticatedUser;
      request.headers['x-bu-code'] = bu.bu_code;
      request.headers['x-bu-role'] = bu.role;
      request.headers['x-bu-id'] = bu.bu_id;
      request.headers['x-bu-datas'] = JSON.stringify([{
        bu_id: bu.bu_id,
        bu_code: bu.bu_code,
        role: bu.role,
        permissions: userPermissions,
      }]);
    } else {
      const buDatas = await Promise.all(
        allBus.map(async (bu) => ({
          bu_id: bu.bu_id,
          bu_code: bu.bu_code,
          role: bu.role,
          permissions: await this.permissionService.getUserPermissions(user.user_id, bu.bu_id),
        }))
      );

      const authenticatedUser: AuthenticatedUser = {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        email: user.email,
      };

      request.user = authenticatedUser;
      request.headers['x-bu-datas'] = JSON.stringify(buDatas);
      request.headers['x-bu-code'] = allBus.map(bu => bu.bu_code).join(',');
      request.headers['x-bu-id'] = allBus.map(bu => bu.bu_id).join(',');
      request.headers['x-bu-role'] = allBus.map(bu => bu.role).join(',');
    }

    this.logger.debug(
      { user_id: user.user_id, bu_codes: allBus.map(bu => bu.bu_code) },
      'User authenticated with all accessible BU codes (optional bu_code mode)'
    );

    return true;
  }
}