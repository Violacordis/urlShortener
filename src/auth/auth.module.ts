import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategy';
import { TokenModule } from 'src/utils/token/token.module';
import { MailerService } from 'src/utils/mailer/mailer.service';

@Module({
  imports: [JwtModule.register({}), TokenModule],
  providers: [AuthService, JwtStrategy, MailerService],
  controllers: [AuthController],
})
export class AuthModule {}
