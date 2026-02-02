import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger: BackendLogger = new BackendLogger(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);

    this.logger.debug(
      {
        function: 'canActivate',
        result,
      },
      'canActivate',
    );

    return result;
  }
}
