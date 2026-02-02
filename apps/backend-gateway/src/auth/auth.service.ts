import {
  Injectable,
  Inject,
  ConsoleLogger,
  HttpException,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IInviteUser, ILogin, IRegisterConfirm, IResetPassword, IForgotPassword, IResetPasswordWithToken } from './dto/auth.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';
// import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger: BackendLogger = new BackendLogger(AuthService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) { }

  /**
   * Login function
   * @param loginDto
   * @param version
   * @returns
   */
  async login(loginDto: ILogin, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'login',
        loginDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'login', service: 'auth' },
      { data: loginDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  async logout(logoutDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'logout',
        logoutDto,
        version,
      },
      AuthService.name,
    );


    const res: Observable<any> = this.authService.send(
      { cmd: 'logout', service: 'auth' },
      { data: logoutDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.NO_CONTENT) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  async register(registerDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'register',
        registerDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'register', service: 'auth' },
      { data: registerDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  async inviteUser(inviteUserDto: IInviteUser, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'inviteUser',
        inviteUserDto,
        user_id,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'invite-user', service: 'auth' },
      { data: inviteUserDto, user_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  async registerConfirm(
    registerConfirmDto: IRegisterConfirm,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'registerConfirm',
        registerConfirmDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'register-confirm', service: 'auth' },
      { data: registerConfirmDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  async refreshToken(refreshTokenDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'refreshToken',
        refreshTokenDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'refresh-token', service: 'auth' },
      { data: refreshTokenDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  async forgotPassword(forgotPasswordDto: IForgotPassword, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'forgotPassword',
        forgotPasswordDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'forgot-password', service: 'auth' },
      { data: forgotPasswordDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response;
  }

  async resetPasswordWithToken(resetPasswordWithTokenDto: IResetPasswordWithToken, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'reset-password-with-token', service: 'auth' },
      { data: resetPasswordWithTokenDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response;
  }

  async resetPassword(resetPasswordDto: IResetPassword, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'reset-password',
        email: resetPasswordDto.email,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'reset-password', service: 'auth' },
      { data: resetPasswordDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response;
  }

  async changePassword(changePasswordDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'changePassword',
        changePasswordDto,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'change-password', service: 'auth' },
      { data: changePasswordDto, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  async changeEmail(changeEmailDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'changeEmail',
        changeEmailDto,
        version,
      },
      AuthService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  async getByTenant(tenant_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'getByTenant',
        tenant_id,
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-by-tenant', service: 'auth' },
      { data: tenant_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }

  // async permission_mobile(
  //   accessToken: string,
  //   appId: string,
  //   version: string,
  // ): Promise<any> {
  //   this.logger.debug(
  //     {
  //       function: 'permission_mobile',
  //       accessToken,
  //       appId,
  //       version,
  //     },
  //     AuthService.name,
  //   );

  //   // throw new NotImplementedException('Not implemented');

  //   return {
  //     data: ['pr.view', 'sr.view', 'grn.view', 'pc.view', 'spc.view'],
  //   };

  //   const res: Observable<any> = this.authService.send(
  //     { cmd: 'permission-mobile', service: 'auth' },
  //     { data: { accessToken, appId, version }, version: version },
  //   );

  //   const response = await firstValueFrom(res);

  //   if (response.response.status !== HttpStatus.OK) {
  //     throw new HttpException(response.response, response.response.status);
  //   }

  //   return response.data;
  // }

  // async permission_web(accessToken: string, version: string): Promise<any> {
  //   this.logger.debug(
  //     {
  //       function: 'permission_web',
  //       accessToken,
  //       version,
  //     },
  //     AuthService.name,
  //   );

  //   throw new NotImplementedException('Not implemented');

  //   const res: Observable<any> = this.authService.send(
  //     { cmd: 'permission-web', service: 'auth' },
  //     { data: { accessToken, version }, version: version },
  //   );

  //   const response = await firstValueFrom(res);

  //   if (response.response.status !== HttpStatus.OK) {
  //     throw new HttpException(response.response, response.response.status);
  //   }

  //   return response.data;
  // }

  async getAllUsers(version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'getAllUsers',
        version,
      },
      AuthService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-all-users', service: 'auth' },
      { data: {}, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return response.data;
  }
}
