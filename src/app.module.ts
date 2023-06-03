import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { UrlService } from './url/url.service';
import { UrlController } from './url/url.controller';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './utils/token/token.service';
import { TokenModule } from './utils/token/token.module';
import { CacheModule } from './utils/cache/cache.module';
import { MailerModule } from './utils/mailer/mailer.module';
import { AppController } from './app.controller';
import { UrlModule } from './url/url.module';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    AuthModule,
    TokenModule,
    CacheModule,
    MailerModule,
    UrlModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
  controllers: [AuthController, UrlController, AppController],
  providers: [PrismaService, JwtService, AuthService, UrlService, TokenService],
})
export class AppModule {}
