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
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    AuthModule,
    TokenModule,
    CacheModule,
  ],
  controllers: [AuthController, UrlController],
  providers: [PrismaService, JwtService, AuthService, UrlService, TokenService],
})
export class AppModule {}
