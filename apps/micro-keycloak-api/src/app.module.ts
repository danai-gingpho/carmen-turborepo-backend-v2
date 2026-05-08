import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeycloakModule } from './keycloak/keycloak.module';

@Module({
  imports: [KeycloakModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
